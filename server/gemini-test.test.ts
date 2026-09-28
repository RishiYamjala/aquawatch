import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({ interactions: { create: mockCreate } })),
}));

import { GoogleGenAI } from "@google/genai";
import { createApp } from "./index";

let server: ReturnType<ReturnType<typeof createApp>["listen"]>;
let endpoint = "";
const originalApiKey = process.env.GEMINI_API_KEY;

async function postTestEndpoint() {
  return fetch(endpoint, { method: "POST" });
}

describe("POST /api/gemini/test", () => {
  beforeAll(async () => {
    server = createApp().listen(0);
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const address = server.address() as AddressInfo;
    endpoint = `http://127.0.0.1:${address.port}/api/gemini/test`;
  });

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-only-secret-not-a-real-key";
    mockCreate.mockReset().mockResolvedValue({ output_text: "AquaWatch Gemini test is working." });
  });

  afterAll(async () => {
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  });

  it("returns generated text as JSON without exposing the API key", async () => {
    const response = await postTestEndpoint();
    const body = await response.json() as { ok?: boolean; model?: string; text?: string };

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, model: "gemini-3.5-flash-lite", text: "AquaWatch Gemini test is working." });
    expect(JSON.stringify(body)).not.toContain(process.env.GEMINI_API_KEY!);
    expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: "test-only-secret-not-a-real-key" });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: "gemini-3.5-flash-lite",
      input: expect.stringContaining("Gemini is responding successfully for AquaWatch"),
      store: false,
      generation_config: { max_output_tokens: 64 },
    }), { timeout_ms: 60_000, retries: { strategy: "none" } });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns a configuration error if the server key is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    const response = await postTestEndpoint();
    const body = await response.json() as { ok?: boolean; error?: string };

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.error).toContain("not configured");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns a generic JSON error when Gemini is unavailable", async () => {
    mockCreate.mockRejectedValueOnce(new Error("provider details and credentials must stay hidden"));

    const response = await postTestEndpoint();
    const body = await response.json() as { ok?: boolean; error?: string };

    expect(response.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.error).toContain("Gemini API request failed");
    expect(body.error).toContain("provider details");
    expect(JSON.stringify(body)).not.toContain("test-only-secret-not-a-real-key");
  });

  it("returns a retryable JSON response for Gemini high-demand outages", async () => {
    mockCreate.mockRejectedValueOnce(Object.assign(new Error("temporary provider details"), { status: 503 }));

    const response = await postTestEndpoint();
    const body = await response.json() as { ok?: boolean; error?: string };

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("30");
    expect(body.ok).toBe(false);
    expect(body.code).toBe("GEMINI_UNAVAILABLE");
    expect(body.error).toContain("Gemini API HTTP 503");
    expect(body.error).toContain("temporary provider details");
  });
});
