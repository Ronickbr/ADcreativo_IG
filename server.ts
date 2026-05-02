import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

// API routes
  let openRouterConfig = {
    key: process.env.OPENROUTER_API_KEY || "",
    model: "google/gemini-2.0-flash-001"
  };

  app.post("/api/settings/openrouter", (req, res) => {
    const { key, model } = req.body;
    if (key) openRouterConfig.key = key;
    if (model) openRouterConfig.model = model;
    res.json({ success: true, hasKey: !!openRouterConfig.key });
  });

  app.get("/api/settings/openrouter", (req, res) => {
    res.json({ 
      model: openRouterConfig.model, 
      hasKey: !!openRouterConfig.key,
      // We don't send the full key back for security
      keyMasked: openRouterConfig.key ? `${openRouterConfig.key.substring(0, 6)}...${openRouterConfig.key.substring(openRouterConfig.key.length - 4)}` : ""
    });
  });

  app.post("/api/ai/generate", async (req, res) => {
    const { prompt, images, model } = req.body;
    const apiKey = openRouterConfig.key;
    const targetModel = model || openRouterConfig.model;

    if (!apiKey) {
      return res.status(401).json({ error: "OpenRouter API Key not configured on server" });
    }

    try {
      const messages: any[] = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...(images || []).map((img: any) => ({
              type: "image_url",
              image_url: { url: `data:${img.mimeType};base64,${img.data}` }
            }))
          ]
        }
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://ais-build.google.com", 
          "X-Title": "AdCreative AI",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: targetModel,
          messages,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `OpenRouter error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("AI Generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/scrape", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Basic scraping logic - can be improved for specific sites
      const title = $('meta[property="og:title"]').attr("content") || 
                    $("title").text() || 
                    $("h1").first().text();
      const description = $('meta[name="description"]').attr("content") || 
                         $('meta[property="og:description"]').attr("content") ||
                         $("p").first().text();
      
      // Try to find the main product image
      let imageUrl = $('meta[property="og:image"]').attr("content") || 
                     $('meta[name="twitter:image"]').attr("content");

      if (!imageUrl) {
        // Fallback: find the first large image
        $("img").each((i, el) => {
          const src = $(el).attr("src");
          if (src && (src.startsWith("http") || src.startsWith("//"))) {
            imageUrl = src.startsWith("//") ? `https:${src}` : src;
            return false; // break
          }
        });
      }

      let base64Image = null;
      let mimeType = null;
      if (imageUrl) {
        try {
          const imgRes = await fetch(imageUrl);
          if (imgRes.ok) {
            const blob = await imgRes.arrayBuffer();
            base64Image = Buffer.from(blob).toString("base64");
            mimeType = imgRes.headers.get("content-type");
          }
        } catch (e) {
          console.error("Failed to fetch image for base64 conversion:", e);
        }
      }

      res.json({
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl,
        base64Image: base64Image,
        mimeType: mimeType
      });
    } catch (error: any) {
      console.error("Scraping error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
