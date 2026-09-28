import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createGeminiRouter } from "./geminiRouter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export function createApp() {
  const app = express();
  app.use(createGeminiRouter());

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all GET routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  const app = createApp();
  const server = createServer(app);
  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
