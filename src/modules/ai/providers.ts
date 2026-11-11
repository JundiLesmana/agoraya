import { getEnv } from "@/lib/env";
import { ExternalServiceError } from "@/lib/errors";
import type { AiProvider, AiProviderName, AiResponse } from "./types";

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 1;
const RETRY_BASE_MS = 250;
const MAX_OUTPUT_TOKENS = 384;

interface ProviderConfig {
  readonly name: AiProviderName;
  readonly apiKey: string;
  readonly model: string;
  readonly endpoint: string;
}

function providerConfig(name: AiProviderName): ProviderConfig {
  const env = getEnv();
  const configs: Record<
    AiProviderName,
    {
      readonly apiKey: string | undefined;
      readonly model: string | undefined;
      readonly endpoint: string;
      readonly defaultModel: string;
    }
  > = {
    gemini: {
      endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
      apiKey: env.GEMINI_API_KEY ?? env.AI_API_KEY,
      model: env.GEMINI_MODEL,
      defaultModel: "gemini-3.5-flash-lite",
    },
    cerebras: {
      endpoint: "https://api.cerebras.ai/v1/chat/completions",
      apiKey: env.CEREBRAS_API_KEY ?? env.AI_API_KEY,
      model: env.CEREBRAS_MODEL,
      defaultModel: "qwen-3.8-27b",
    },
    groq: {
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: env.GROQ_API_KEY ?? env.AI_API_KEY,
      model: env.GROQ_MODEL,
      defaultModel: "openai/gpt-oss-20b",
    },
    openrouter: {
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: env.OPENROUTER_API_KEY ?? env.AI_API_KEY,
      model: env.OPENROUTER_MODEL,
      defaultModel: "google/gemini-3.5-flash-lite",
    },
  };
  const config = configs[name];
  if (!config.apiKey?.trim()) {
    throw new ExternalServiceError(
      `API key untuk provider AI "${name}" tidak dikonfigurasi.`,
    );
  }
  return {
    name,
    endpoint: config.endpoint,
    apiKey: config.apiKey.trim(),
    model: config.model?.trim() || config.defaultModel,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function extractGeminiText(data: unknown): string {
  const candidates = asRecord(data)?.candidates;
  const candidate = asRecord(
    Array.isArray(candidates) ? candidates[0] : undefined,
  );
  const content = asRecord(candidate?.content);
  const parts = Array.isArray(content?.parts) ? content.parts : [];
  const text = parts
    .map((part) => asRecord(part)?.text)
    .filter((part): part is string => typeof part === "string")
    .join("")
    .trim();
  if (!text) {
    throw new ExternalServiceError(
      "Provider AI mengembalikan respons kosong atau tidak valid.",
    );
  }
  return text;
}

function extractChatCompletionText(data: unknown): string {
  const choices = asRecord(data)?.choices;
  const firstChoice =
    Array.isArray(choices) && choices.length > 0
      ? asRecord(choices[0])
      : null;
  const message = asRecord(firstChoice?.message);
  const content = message?.content;
  const text =
    typeof content === "string"
      ? content.trim()
      : Array.isArray(content)
        ? content
            .map((part) => asRecord(part)?.text)
            .filter((part): part is string => typeof part === "string")
            .join("")
            .trim()
        : "";
  if (!text) {
    throw new ExternalServiceError(
      "Provider AI mengembalikan respons kosong atau tidak valid.",
    );
  }
  return text;
}

async function sendWithRetry(
  providerName: AiProviderName,
  url: string,
  options: RequestInit,
  extractText: (data: unknown) => string,
): Promise<AiResponse> {
  let lastNetworkError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, options);
      if (response.status === 429 || response.status >= 500) {
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_BASE_MS * (attempt + 1));
          continue;
        }
        throw new ExternalServiceError(
          `Provider AI "${providerName}" gagal (HTTP ${response.status}).`,
        );
      }
      if (!response.ok) {
        throw new ExternalServiceError(
          `Provider AI "${providerName}" menolak permintaan (HTTP ${response.status}).`,
        );
      }
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new ExternalServiceError(
          `Provider AI "${providerName}" mengembalikan format respons yang tidak valid.`,
        );
      }
      return {
        provider: providerName,
        content: extractText(payload),
      };
    } catch (error) {
      if (error instanceof ExternalServiceError) throw error;
      lastNetworkError = error;
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_MS * (attempt + 1));
      }
    }
  }
  throw new ExternalServiceError(
    `Tidak dapat menghubungi provider AI "${providerName}".`,
    { cause: lastNetworkError },
  );
}

export class GeminiProvider implements AiProvider {
  readonly name = "gemini" as const;

  async complete(input: {
    prompt: string;
    context: Record<string, unknown>;
  }): Promise<AiResponse> {
    void input.context;
    const config = providerConfig(this.name);
    const url = `${config.endpoint}/${encodeURIComponent(config.model)}:generateContent`;
    return sendWithRetry(
      this.name,
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input.prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            responseMimeType: "application/json",
          },
        }),
      },
      extractGeminiText,
    );
  }
}

class OpenAiCompatibleProvider implements AiProvider {
  constructor(
    readonly name: Exclude<AiProviderName, "gemini">,
  ) {}

  async complete(input: {
    prompt: string;
    context: Record<string, unknown>;
  }): Promise<AiResponse> {
    void input.context;
    const config = providerConfig(this.name);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    };
    if (this.name === "openrouter") {
      headers["HTTP-Referer"] = getEnv().NEXT_PUBLIC_APP_URL;
      headers["X-Title"] = "Agoraya";
    }
    return sendWithRetry(
      this.name,
      config.endpoint,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: "system",
              content:
                "Keluarkan hanya JSON valid sesuai instruksi. Jangan menambah saran atau keputusan.",
            },
            { role: "user", content: input.prompt },
          ],
          temperature: 0.1,
          max_tokens: MAX_OUTPUT_TOKENS,
          response_format: { type: "json_object" },
        }),
      },
      extractChatCompletionText,
    );
  }
}

export const geminiProvider = new GeminiProvider();
export const cerebrasProvider = new OpenAiCompatibleProvider("cerebras");
export const groqProvider = new OpenAiCompatibleProvider("groq");
export const openRouterProvider = new OpenAiCompatibleProvider("openrouter");

export function getAiProvider(name: AiProviderName): AiProvider {
  switch (name) {
    case "gemini":
      return geminiProvider;
    case "cerebras":
      return cerebrasProvider;
    case "groq":
      return groqProvider;
    case "openrouter":
      return openRouterProvider;
  }
}
