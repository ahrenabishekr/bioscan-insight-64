import { createServer } from "http";
import { createRequestHandler } from "@remix-run/express";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const BUILD_DIR = join(__dirname, "dist");

console.log("🚀 Starting ChemoSense...");
console.log(`📂 Build directory: ${BUILD_DIR}`);

async function startServer() {
  const app = express();

  app.get("/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.use(express.static(join(BUILD_DIR, "client"), { immutable: true, maxAge: "1y" }));

  const build = await import("./dist/server/index.js");

  app.all("*", createRequestHandler({ build: build, mode: process.env.NODE_ENV || "production" }));

  const server = createServer(app);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ ChemoSense live at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Server failed:", err);
  process.exit(1);
});
