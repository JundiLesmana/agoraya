import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetEnv } from "@/lib/env";
import { getAiProvider, GeminiProvider } from "@/modules/ai/providers";
import type { AiProviderName } from "@/modules/ai/types";

beforeEach(() => {
  for (const key of [
    "AI_API_KEY",
    "GEMINI_API_KEY",
    "CEREBRAS_API_KEY",
    "GROQ_API_KEY",
    "OPENROUTER_API_KEY",
  ]) {
    delete process.env[key];
  }
  resetEnv();
  process.env.DATABASE_URL = "******127.0.0.1:5432/agoraya_local";
  process.env.AUTH_SECRET = "test-secret-for-unit-tests-at-least-32-chars!";
  process.env.AI_PROVIDER = "gemini";
  process.env.GEMINI_API_KEY = "test-api-key";
});

afterEach(() => {
  for (const key of [
    "AI_PROVIDER",
    "AI_API_KEY",
    "GEMINI_API_KEY",
    "CEREBRAS_API_KEY",
    "GROQ_API_KEY",
    "OPENROUTER_API_KEY",
  ]) {
    delete process.env[key];
  }
  resetEnv();
  vi.restoreAllMocks();
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("modules/ai/providers", () => {
  it("mengirim prompt JSON ringkas ke Gemini dan membaca respons", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        candidates: [{ content: { parts: [{ text: '{"summary":"ok"}' }] } }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock as unknown);
    const result = await new GeminiProvider().complete({
      prompt: "Jelaskan secara singkat.",
      context: {},
    });
    expect(result).toMatchObject({
      provider: "gemini",
      content: '{"summary":"ok"}',
    });
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("generativelanguage.googleapis.com");
    expect(String(url)).not.toContain("key=");
    expect((options as RequestInit).headers).toMatchObject({
      "x-goog-api-key": "test-api-key",
    });
    expect(JSON.parse(String((options as RequestInit).body))).toMatchObject({
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 384,
        responseMimeType: "application/json",
      },
    });
  });

  it("mencoba ulang satu kali pada 429 dan 5xx", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, {}))
      .mockResolvedValue(jsonResponse(200, {
        candidates: [{ content: { parts: [{ text: "oke" }] } }],
      }));
    vi.stubGlobal("fetch", fetchMock as unknown);
    await expect(
      new GeminiProvider().complete({ prompt: "hai", context: {} }),
    ).resolves.toMatchObject({ content: "oke" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("tidak mencoba ulang 4xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(400, {}));
    vi.stubGlobal("fetch", fetchMock as unknown);
    await expect(
      new GeminiProvider().complete({ prompt: "hai", context: {} }),
    ).rejects.toThrow(/HTTP 400/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mengimplementasikan semua adapter yang dikonfigurasi", () => {
    const providers: AiProviderName[] = [
      "gemini",
      "cerebras",
      "groq",
      "openrouter",
    ];
    for (const provider of providers) {
      expect(getAiProvider(provider).name).toBe(provider);
    }
  });

  it.each([
    ["cerebras", "CEREBRAS_API_KEY", "https://api.cerebras.ai/v1/chat/completions"],
    ["groq", "GROQ_API_KEY", "https://api.groq.com/openai/v1/chat/completions"],
    ["openrouter", "OPENROUTER_API_KEY", "https://openrouter.ai/api/v1/chat/completions"],
  ] as const)(
    "%s mengirim permintaan JSON ringkas ke endpoint yang sesuai",
    async (name, keyName, endpoint) => {
      process.env.AI_PROVIDER = name;
      process.env[keyName] = "provider-test-key";
      resetEnv();
      const fetchMock = vi.fn().mockResolvedValue(
        jsonResponse(200, {
          choices: [{ message: { content: '{"summary":"ok"}' } }],
        }),
      );
      vi.stubGlobal("fetch", fetchMock as unknown);
      const result = await getAiProvider(name).complete({
        prompt: "Jelaskan secara singkat.",
        context: {},
      });
      expect(result).toMatchObject({ provider: name, content: '{"summary":"ok"}' });
      expect(String(fetchMock.mock.calls[0][0])).toBe(endpoint);
      const options = fetchMock.mock.calls[0][1] as RequestInit;
      expect(options.headers).toMatchObject({
        Authorization: "Bearer provider-test-key",
      });
      const body = JSON.parse(String(options.body)) as {
        max_tokens: number;
        response_format: { type: string };
      };
      expect(body.max_tokens).toBe(384);
      expect(body.response_format.type).toBe("json_object");
    },
  );

  it("menolak provider terpilih tanpa API key", async () => {
    process.env.AI_PROVIDER = "groq";
    delete process.env.AI_API_KEY;
    delete process.env.GROQ_API_KEY;
    resetEnv();
    await expect(
      getAiProvider("groq").complete({ prompt: "test", context: {} }),
    ).rejects.toThrow(/AI_PROVIDER/);
  });
});
