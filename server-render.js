import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = process.env.PORT || 3000;
const ASSETS_DIR = join(__dirname, "dist/server");

const MIME_TYPES = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

async function main() {
  const mod = await import("./dist/server/index.js");
  const handler = mod.default;

  const server = createServer(async (req, res) => {
    try {
      // Serve static assets directly from dist/server/assets/
      if (req.url.startsWith("/assets/")) {
        const filePath = join(ASSETS_DIR, req.url);
        if (existsSync(filePath)) {
          const ext = extname(filePath);
          const mime = MIME_TYPES[ext] || "application/octet-stream";
          res.setHeader("Content-Type", mime);
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          res.end(readFileSync(filePath));
          return;
        }
      }

      // All other requests go to the worker fetch handler
      const url = new URL(req.url, `http://${req.headers.host}`);
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const bodyBuffer = chunks.length ? Buffer.concat(chunks) : undefined;

      const request = new Request(url.toString(), {
        method: req.method,
        headers: Object.fromEntries(
          Object.entries(req.headers).filter(([_, v]) => v != null)
        ),
        body: bodyBuffer?.length > 0 ? bodyBuffer : undefined,
      });

      const response = await handler.fetch(request, {}, {});

      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      const body = await response.arrayBuffer();
      res.end(Buffer.from(body));
    } catch (err) {
      console.error("Request error:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  server.listen(PORT, () => {
    console.log(`✅ ChemoSense running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
