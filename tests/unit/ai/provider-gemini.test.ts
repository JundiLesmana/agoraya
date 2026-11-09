import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeminiProvider, getAiProvider } from "@/modules/ai/providers";
import { resetEnv } from "@/lib/env";
import type { AiProviderName } from "@/modules/ai/types";

beforeEach(() => {
  resetEnv();
  process.env.DATABASE_URL = "postgres://agoraya:localdev@127.0.0.1:5432/agoraya_local";
  process.env.AUTH_SECRET = "test-secret-for-unit-tests-at-least-32-chars!";
  process.env.AI_PROVIDER = "gemini";
  process.env.AI_API_KEY = "test-api-key";
});

afterEach(() => {
  delete process.env.AI_PROVIDER;
  delete process.env.AI_API_KEY;
  resetEnv();
  vi.restoreAllMocks();
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("modules/ai/providers (gemini)", () => {
  it("mengembalikan teks dari respons sukses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { candidates: [{ content: { parts: [{ text: "Halo dunia" }] } }] }));
    vi.stubGlobal("fetch", fetchMock as unknown);
    const provider = new GeminiProvider();
    const result = await provider.complete({ prompt: "hai", context: {} });
    expect(result.provider).toBe("gemini");
    expect(result.content).toBe("Halo dunia");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("generativelanguage.googleapis.com");
    expect(String(url)).toContain("key=");
    expect((options as RequestInit).signal).toBeDefined();
    expect((options as RequestInit).method).toBe("POST");
  });

  it("mencoba ulang pada 429 lalu berhasil", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(429, { error: { message: "rate limit" } }))
      .mockResolvedValueOnce(jsonResponse(429, { error: { message: "rate limit" } }))
      .mockResolvedValue(jsonResponse(200, { candidates: [{ content: { parts: [{ text: "oke" }] } }] }));
    vi.stubGlobal("fetch", fetchMock as unknown);
    const provider = new GeminiProvider();
    const result = await provider.complete({ prompt: "hai", context: {} });
    expect(result.content).toBe("oke");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("gagal setelah mencoba ulang pada 5xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(500, { error: { message: "server error" } }));
    vi.stubGlobal("fetch", fetchMock as unknown);
    const provider = new GeminiProvider();
    await expect(provider.complete({ prompt: "hai", context: {} })).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("tidak mencoba ulang pada 4xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(400, { error: { message: "bad request" } }));
    vi.stubGlobal("fetch", fetchMock as unknown);
    const provider = new GeminiProvider();
    await expect(provider.complete({ prompt: "hai", context: {} })).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mencoba ulang pada kesalahan jaringan lalu gagal", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("jaringan putus"));
    vi.stubGlobal("fetch", fetchMock as unknown);
    const provider = new GeminiProvider();
    await expect(provider.complete({ prompt: "hai", context: {} })).rejects.toThrow("jaringan putus");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("gagal secara eksplisit saat tidak ada API key", async () => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;
    resetEnv();
    const provider = new GeminiProvider();
    await expect(provider.complete({ prompt: "hai", context: {} })).rejects.toThrow(/tidak dikonfigurasi/);
  });

  it("getAiProvider mengembalikan gemini dan menolak yang lain", () => {
    expect(getAiProvider("gemini").name).toBe("gemini");
    for (const name of ["cerebras", "groq", "openrouter"] as AiProviderName[]) {
      expect(() => getAiProvider(name)).toThrow(/belum diimplementasikan/);
    }
  });
});
