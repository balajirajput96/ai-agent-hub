import { afterEach, describe, expect, it, vi } from "vitest";
import { checkIntegrationsHealth } from "./services/agentTools";

const originalFetch = globalThis.fetch;
const originalGitHubToken = process.env.GITHUB_TOKEN;
const originalHuggingFaceToken = process.env.HUGGINGFACE_API_KEY;
const originalHuggingFaceFallbackToken = process.env.HF_TOKEN;

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.GITHUB_TOKEN = originalGitHubToken;
  process.env.HUGGINGFACE_API_KEY = originalHuggingFaceToken;
  process.env.HF_TOKEN = originalHuggingFaceFallbackToken;
});

describe("checkIntegrationsHealth", () => {
  it("verifies the authenticated GitHub endpoint when a token is configured", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    process.env.HUGGINGFACE_API_KEY = "";
    process.env.HF_TOKEN = "";
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes("huggingface.co"))
        return new Response("{}", { status: 401 });
      return new Response(JSON.stringify({ login: "test-user" }), {
        status: 200,
      });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const health = await checkIntegrationsHealth();

    expect(health.github).toEqual({
      status: "connected",
      tokenConfigured: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/rate_limit",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "token test-token" }),
      })
    );
  });
});
