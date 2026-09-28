import { GoogleGenAI } from "@google/genai";
import express, { type Request } from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GEMINI_MODEL = "gemini-3.8-flash";
const TEST_PROMPT = "Return exactly this short sentence: Gemini is responding successfully for AquaWatch.";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const requestsByIp = new Map<string, number[]>();

function allowGeminiTestRequest(ip: string, now = Date.now()): boolean {
  requestsByIp.forEach((timestamps, savedIp) => {
    const recent = timestamps.filter((timestamp: number) => now - timestamp < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) requestsByIp.delete(savedIp);
    else requestsByIp.set(savedIp, recent);
  });

  const recent = requestsByIp.get(ip) ?? [];
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) return false;
  requestsByIp.set(ip, [...recent, now]);
  return true;
}

export function createApp() {
  const app = express();

  app.post("/api/gemini/test", async (req: Request, res) => {
    res.setHeader("Cache-Control", "no-store");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ ok: false, error: "Gemini API key is not configured on the server." });
    }

    if (!allowGeminiTestRequest(req.ip || "unknown")) {
      return res.status(429).json({ ok: false, error: "Too many Gemini test requests. Try again in a minute." });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.interactions.create({
        model: GEMINI_MODEL,
        input: TEST_PROMPT,
        store: false,
        generation_config: { max_output_tokens: 64, thinking_level: "low" },
      }, { timeout_ms: 25_000, retries: { strategy: "none" } });
      const text = result.output_text?.trim();
      if (!text) {
        return res.status(502).json({ ok: false, error: "Gemini returned an empty response." });
      }

      return res.status(200).json({ ok: true, model: GEMINI_MODEL, text });
    } catch (error) {
      // Do not expose provider diagnostics, request details, or credentials.
      const upstreamStatus = error && typeof error === "object" && "status" in error
        ? (error as { status?: unknown }).status
        : undefined;
      if (upstreamStatus === 429 || upstreamStatus === 503) {
        res.setHeader("Retry-After", "30");
        return res.status(503).json({ ok: false, error: "Gemini is temporarily unavailable. Try again shortly." });
      }
      return res.status(502).json({ ok: false, error: "Gemini request failed. Check server configuration and provider availability." });
    }
  });

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
