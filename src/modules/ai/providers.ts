import type { AiProvider, AiProviderName, AiResponse } from "./types";
import { ExternalServiceError } from "@/lib/errors";
import { getEnv } from "@/lib/env";

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

function extractGeminiText(data: unknown): string {
  const record = data as { readonly candidates?: readonly { readonly content?: { readonly parts?: readonly { readonly text?: unknown }[] } }[] } | null;
  const text = record?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new ExternalServiceError("Format tanggapan penyedia AI tidak valid atau kosong.");
  }
  return text;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof ExternalServiceError) {
    const status = error.statusCode;
    return status === 429 || status >= 500;
  }
  return true;
}

export class GeminiProvider implements AiProvider {
  readonly name: AiProviderName = "gemini";

  async complete(input: { prompt: string; context: Record<string, unknown> }): Promise<AiResponse> {
    const env = getEnv();
    const apiKey = (env.AI_API_KEY ?? "").trim();
    if (!apiKey) {
      throw new ExternalServiceError("Kunci API Gemini tidak dikonfigurasi pada server.");
    }

    const url = `${GEMINI_BASE_URL}?key=${encodeURIComponent(apiKey)}`;
    const body = JSON.stringify({
      contents: [{ parts: [{ text: input.prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
    });
    const options: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    };

    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        const response = await fetchWithTimeout(url, options, REQUEST_TIMEOUT_MS);
        if (response.status === 429 || response.status >= 500) {
          const bodyText = await response.text().catch(() => "");
          if (attempt === MAX_RETRIES) {
            throw new ExternalServiceError(`Penyedia AI gagal (HTTP ${response.status}).`, { cause: bodyText });
          }
          await sleep(RETRY_BASE_MS * (attempt + 1));
          continue;
        }
        if (!response.ok) {
          const bodyText = await response.text().catch(() => "");
          throw new ExternalServiceError(
            `Penyedia AI menanggapi dengan kesalahan (HTTP ${response.status}).`,
            { statusCode: response.status, cause: bodyText },
          );
        }
        const data = await response.json();
        const text = extractGeminiText(data);
        return { provider: "gemini", content: text, raw: undefined };
      } catch (error) {
        lastError = error;
        if (error instanceof ExternalServiceError && !isRetryable(error)) {
          throw error;
        }
        if (attempt === MAX_RETRIES) {
          break;
        }
        await sleep(RETRY_BASE_MS * (attempt + 1));
      }
    }

    throw lastError instanceof Error ? lastError : new ExternalServiceError("Gagal menyambung ke penyedia AI.");
  }
}

export const geminiProvider = new GeminiProvider();

export function getAiProvider(name: AiProviderName): AiProvider {
  switch (name) {
    case "gemini":
      return geminiProvider;
    default:
      throw new ExternalServiceError(`Penyedia AI "${name}" belum diimplementasikan untuk MVP.`);
  }
}
