import { createServer } from "http";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DIST = join(__dirname, "dist");

console.log("🚀 Starting ChemoSense...");

async function startServer() {
  const app = express();

  app.get("/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Serve static assets with cache headers
  app.use(express.static(join(DIST, "client"), { immutable: true, maxAge: "1y" }));

  // Import the TanStack Start server handler
  const { default: handler } = await import("./dist/server/index.js");

  app.all("*", async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        body: ["GET", "HEAD"].includes(req.method) ? undefined : await new Promise(resolve => {
          const chunks = [];
          req.on("data", c => chunks.push(c));
          req.on("end", () => resolve(Buffer.concat(chunks)));
        }),
      });

      const response = await handler.fetch(request, {});

      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        if (key !== "content-encoding") res.setHeader(key, value);
      });
      const body = await response.arrayBuffer();
      res.end(Buffer.from(body));
    } catch (err) {
      console.error("Request error:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  createServer(app).listen(PORT, "0.0.0.0", () => {
    console.log(`✅ ChemoSense live at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Server failed:", err);
  process.exit(1);
});
