import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({ interactions: { create: mockCreate } })),
}));

import { GoogleGenAI } from "@google/genai";
import { createGeminiMiddleware } from "./geminiRouter";

const validAnalysis = {
  category: "water_quality",
  severity: "moderate",
  summary: "The report describes an unusual change in water taste.",
  recommended_action: "Use a trusted source and report the change to the local water provider.",
};

let server: ReturnType<ReturnType<typeof createGeminiMiddleware>["listen"]>;
let endpoint = "";
const originalApiKey = process.env.GEMINI_API_KEY;

async function postReview(reviewText: unknown) {
  return fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewText }),
  });
}

describe("POST /api/gemini/analyze-review", () => {
  beforeAll(async () => {
    server = createGeminiMiddleware().listen(0);
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const address = server.address() as AddressInfo;
    endpoint = `http://127.0.0.1:${address.port}/api/gemini/analyze-review`;
  });

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-only-secret-not-a-real-key";
    mockCreate.mockReset().mockResolvedValue({ output_text: JSON.stringify(validAnalysis) });
  });

  afterAll(async () => {
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  });

  it("returns validated structured analysis and uses only the server-side key", async () => {
    const response = await postReview("The tap water suddenly smells unusual.");
    const body = await response.json() as { ok?: boolean; analysis?: typeof validAnalysis };

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, analysis: validAnalysis });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(JSON.stringify(body)).not.toContain(process.env.GEMINI_API_KEY!);
    expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: "test-only-secret-not-a-real-key" });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: "gemini-3.8-flash",
      input: expect.stringContaining("The tap water suddenly smells unusual."),
      store: false,
      response_format: expect.objectContaining({
        type: "text",
        mime_type: "application/json",
        schema: expect.objectContaining({ required: ["category", "severity", "summary", "recommended_action"] }),
      }),
      generation_config: { max_output_tokens: 256, thinking_level: "low" },
    }), { timeout_ms: 25_000, retries: { strategy: "none" } });
  });

  it("rejects missing or oversized review text before calling Gemini", async () => {
    const missing = await postReview("   ");
    expect(missing.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();

    const oversized = await postReview("x".repeat(1201));
    expect(oversized.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns a configuration error when the server key is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    const response = await postReview("Water pressure dropped today.");
    const body = await response.json() as { ok?: boolean; error?: string };

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.error).toContain("not configured");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed model output and hides provider errors", async () => {
    mockCreate.mockResolvedValueOnce({ output_text: JSON.stringify({ ...validAnalysis, severity: "extreme" }) });
    const invalid = await postReview("There is a cloudy appearance.");
    expect(invalid.status).toBe(502);
    expect((await invalid.json()).ok).toBe(false);

    mockCreate.mockRejectedValueOnce(new Error("sensitive provider diagnostics"));
    const failed = await postReview("There is a cloudy appearance.");
    const body = await failed.json() as { ok?: boolean; error?: string };
    expect(failed.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(JSON.stringify(body)).not.toContain("sensitive provider diagnostics");
  });

  it("keeps the report intact when Gemini is temporarily unavailable", async () => {
    mockCreate.mockRejectedValueOnce(Object.assign(new Error("temporary provider details"), { status: 503 }));

    const response = await postReview("The tap water smells unusual.");
    const body = await response.json() as { ok?: boolean; error?: string };

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("30");
    expect(body.error).toContain("report was still saved");
    expect(JSON.stringify(body)).not.toContain("temporary provider details");
  });
});
