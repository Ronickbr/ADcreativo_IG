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
