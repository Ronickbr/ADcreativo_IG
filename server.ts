import express, { type NextFunction, type Request, type Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { assertSafePublicUrl } from "./src/lib/urlSafety.ts";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 2_000_000;
const MAX_IMAGE_BYTES = 8_000_000;
const MAX_IMAGES = 4;

type ApiError = Error & { status?: number };
const fail = (status: number, message: string) => Object.assign(new Error(message), { status });
const asyncRoute = (handler: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => void handler(req, res).catch(next);

async function fetchWithGuard(url: URL, accept: string, maxBytes: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let target = url;
    let response: globalThis.Response | undefined;
    for (let redirect = 0; redirect <= 3; redirect++) {
      response = await fetch(target, {
        redirect: "manual",
        signal: controller.signal,
        headers: { Accept: accept, "User-Agent": "AdCreativeAI/1.0 (+https://github.com/Ronickbr/ADcreativo_IG)" },
      });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get("location");
      if (!location || redirect === 3) throw fail(502, "O site excedeu o limite de redirecionamentos.");
      target = await assertSafePublicUrl(new URL(location, target).toString());
    }
    if (!response) throw fail(502, "O site não retornou uma resposta.");
    if (!response.ok) throw fail(502, `O site respondeu com status ${response.status}.`);
    const declaredSize = Number(response.headers.get("content-length") || 0);
    if (declaredSize > maxBytes) throw fail(413, "O arquivo remoto excede o limite permitido.");
    const reader = response.body?.getReader();
    if (!reader) throw fail(502, "O site não retornou conteúdo.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw fail(413, "O arquivo remoto excede o limite permitido.");
      }
      chunks.push(value);
    }
    return { response, buffer: Buffer.concat(chunks) };
  } finally {
    clearTimeout(timer);
  }
}

function validateAiBody(body: any) {
  const { prompt, images = [], mode = "copy", provider = "gemini", model, apiKey, aspectRatio = "1:1" } = body || {};
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 30_000) throw fail(400, "Prompt inválido.");
  if (!Array.isArray(images) || images.length > MAX_IMAGES) throw fail(400, `Envie no máximo ${MAX_IMAGES} imagens.`);
  if (!images.every((img) => typeof img?.data === "string" && img.data.length <= 12_000_000 && /^image\//.test(img.mimeType || ""))) throw fail(400, "Uma das imagens é inválida ou muito grande.");
  if (!["gemini", "openrouter"].includes(provider) || !["copy", "image"].includes(mode)) throw fail(400, "Configuração de IA inválida.");
  if (typeof model !== "string" || !model.trim()) throw fail(400, "Selecione um modelo.");
  return { prompt, images, mode, provider, model, apiKey: typeof apiKey === "string" ? apiKey.trim() : "", aspectRatio };
}

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "18mb" }));
  app.use((_req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy": "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; script-src 'self' 'unsafe-inline'",
    });
    next();
  });

  const requests = new Map<string, { count: number; reset: number }>();
  app.use("/api", (req, res, next) => {
    const now = Date.now();
    const key = req.ip || "unknown";
    const entry = requests.get(key);
    if (!entry || entry.reset < now) requests.set(key, { count: 1, reset: now + 60_000 });
    else if (++entry.count > 60) return res.status(429).json({ error: "Muitas solicitações. Aguarde um minuto." });
    next();
  });

  app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
  app.get("/api/settings", (_req, res) => res.json({
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
    defaultOpenRouterModel: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
  }));

  app.get("/api/proxy-image", asyncRoute(async (req, res) => {
    const url = await assertSafePublicUrl(req.query.url);
    const { response, buffer } = await fetchWithGuard(url, "image/*", MAX_IMAGE_BYTES);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) throw fail(415, "A URL não aponta para uma imagem válida.");
    res.set({ "Content-Type": contentType, "Cache-Control": "public, max-age=3600", "Content-Length": String(buffer.length) }).send(buffer);
  }));

  app.post("/api/ai/generate", asyncRoute(async (req, res) => {
    const input = validateAiBody(req.body);
    const apiKey = input.apiKey || (input.provider === "gemini" ? process.env.GEMINI_API_KEY : process.env.OPENROUTER_API_KEY) || "";
    if (!apiKey) throw fail(401, `Configure uma chave ${input.provider === "gemini" ? "Gemini" : "OpenRouter"}.`);

    if (input.provider === "gemini") {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: input.model,
        contents: { parts: [
          ...input.images.map((img: any) => ({ inlineData: { mimeType: img.mimeType, data: img.data } })),
          { text: input.prompt },
        ] },
        config: input.mode === "image"
          ? { imageConfig: { aspectRatio: input.aspectRatio as any } }
          : { responseMimeType: "application/json" },
      });
      const image = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData;
      return res.json({ text: response.text || "", imageUrl: image?.data ? `data:${image.mimeType || "image/png"};base64,${image.data}` : null });
    }

    const payload: any = {
      model: input.model,
      messages: [{ role: "user", content: [
        { type: "text", text: input.prompt },
        ...input.images.map((img: any) => ({ type: "image_url", image_url: { url: `data:${img.mimeType};base64,${img.data}` } })),
      ] }],
    };
    if (input.mode === "image") {
      payload.modalities = ["image", "text"];
      payload.image_config = { image_size: "1K", aspect_ratio: input.aspectRatio };
    } else payload.response_format = { type: "json_object" };
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "HTTP-Referer": req.get("origin") || "https://github.com/Ronickbr/ADcreativo_IG", "X-Title": "AdCreative AI", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90_000),
    });
    const data: any = await upstream.json();
    if (!upstream.ok) throw fail(upstream.status, data?.error?.message || "Falha no OpenRouter.");
    const message = data.choices?.[0]?.message || {};
    const firstImage = message.images?.[0];
    const imageUrl = typeof firstImage === "string" ? firstImage : firstImage?.image_url?.url || firstImage?.url || null;
    res.json({ text: typeof message.content === "string" ? message.content : "", imageUrl });
  }));

  app.post("/api/scrape", asyncRoute(async (req, res) => {
    const url = await assertSafePublicUrl(req.body?.url);
    const { buffer } = await fetchWithGuard(url, "text/html,application/xhtml+xml", MAX_HTML_BYTES);
    const $ = cheerio.load(buffer.toString("utf8"));
    const title = ($('meta[property="og:title"]').attr("content") || $("title").text() || $("h1").first().text()).trim().slice(0, 300);
    const description = ($('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || $("p").first().text()).trim().slice(0, 3000);
    const rawImage = $('meta[property="og:image"]').attr("content") || $('meta[name="twitter:image"]').attr("content") || $("img").first().attr("src");
    let base64Image: string | null = null;
    let mimeType: string | null = null;
    let imageUrl: string | null = null;
    if (rawImage) {
      const resolved = new URL(rawImage, url);
      await assertSafePublicUrl(resolved.toString());
      const image = await fetchWithGuard(resolved, "image/*", MAX_IMAGE_BYTES);
      const type = image.response.headers.get("content-type") || "";
      if (type.startsWith("image/")) {
        imageUrl = resolved.toString();
        base64Image = image.buffer.toString("base64");
        mimeType = type;
      }
    }
    res.json({ title, description, imageUrl, base64Image, mimeType });
  }));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.use((error: ApiError, _req: Request, res: Response, _next: NextFunction) => {
    const status = error.name === "AbortError" || error.name === "TimeoutError" ? 504 : error.status || 500;
    if (status >= 500) console.error("API error:", error);
    res.status(status).json({ error: status >= 500 ? "Não foi possível concluir a solicitação." : error.message });
  });

  app.listen(PORT, "0.0.0.0", () => console.log(`AdCreative AI disponível em http://localhost:${PORT}`));
}

startServer().catch((error) => {
  console.error("Falha ao iniciar servidor:", error);
  process.exitCode = 1;
});
