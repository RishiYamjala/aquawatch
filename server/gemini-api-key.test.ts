import { describe, expect, it } from "vitest";

const apiKey = process.env.GEMINI_API_KEY;

describe("Gemini API key configuration", () => {
  it.skipIf(!apiKey)("authenticates with the Gemini models endpoint", async () => {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", {
      method: "GET",
      headers: {
        "x-goog-api-key": apiKey!,
        accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: { message?: string; status?: string } } | null;
      const providerError = `${body?.error?.message ?? ""} ${body?.error?.status ?? ""}`;
      const safeReason = /api key not valid|invalid api key/i.test(providerError)
        ? "Google reports that the API key is invalid."
        : /permission|access denied/i.test(providerError)
          ? "Google denied API access for this key."
          : "Google returned an error; provider details are withheld.";
      throw new Error(`Gemini model-list request returned HTTP ${response.status}. ${safeReason}`);
    }

    expect(response.status).toBe(200);
  });
});
