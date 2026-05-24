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
      // Serve static assets directly
      if (req.url.startsWith("/assets/")) {
        const filePath = join(ASSETS_DIR, req.url);
        if (existsSync(filePath)) {
          const ext = extname(filePath);
          res.setHeader("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          res.end(readFileSync(filePath));
          return;
        }
      }

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

      const response = await handler.fetch(request, {
        ASSETS: {
          fetch: async (req) => {
            const u = new URL(typeof req === "string" ? req : req.url);
            const filePath = join(ASSETS_DIR, u.pathname);
            if (existsSync(filePath)) {
              return new Response(readFileSync(filePath), {
                headers: { "Content-Type": MIME_TYPES[extname(filePath)] || "application/octet-stream" },
              });
            }
            return new Response("Not found", { status: 404 });
          },
        },
      }, {});

      const bodyText = await response.text();
      console.log(`[${req.method}] ${req.url} → ${response.status} (${bodyText.length} bytes)`);

      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(bodyText);
    } catch (err) {
      console.error("Request error:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  server.listen(PORT, () => console.log(`✅ ChemoSense running on port ${PORT}`));
}

main().catch((err) => { console.error(err); process.exit(1); });
