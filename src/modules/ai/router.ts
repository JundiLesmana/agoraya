import { getEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { checkGuardrails } from "./guardrails";
import { evaluateAiOutput } from "./eval";
import { fillPromptTemplate, getPromptTemplate } from "./prompts";
import { aiStructuredResponseSchema } from "./schemas";
import { getAiProvider } from "./providers";
import type { AiProviderName, AiRequest, AiResponse } from "./types";

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 10;

function enforceRateLimit(provider: AiProviderName): void {
  const now = Date.now();
  const state = rateLimits.get(provider);
  if (!state || state.resetAt <= now) {
    rateLimits.set(provider, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  if (state.count >= LIMIT) {
    throw new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      "Batas permintaan AI tercapai. Coba lagi sebentar.",
      { statusCode: 429 },
    );
  }
  state.count += 1;
}

export async function routeAiRequest(
  request: AiRequest,
): Promise<{
  response: AiResponse;
  evaluation: ReturnType<typeof evaluateAiOutput>;
}> {
  const providerName = request.provider ?? getEnv().AI_PROVIDER;
  if (!providerName) {
    throw new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      "Provider AI belum dikonfigurasi.",
      { statusCode: 503 },
    );
  }
  enforceRateLimit(providerName);

  const promptTemplate = getPromptTemplate(request.promptId);
  if (!promptTemplate) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Template prompt AI tidak dikenal.",
      { statusCode: 400 },
    );
  }
  const prompt = fillPromptTemplate(promptTemplate.template, request.context);
  const guardrail = checkGuardrails(prompt);
  if (!guardrail.allowed) {
    logger.warn("ai.request.prompt_blocked", {
      provider: providerName,
      promptId: request.promptId,
      violations: guardrail.violations.map((violation) => violation.code),
    });
    throw new AppError(
      ErrorCode.UNPROCESSABLE_ENTITY,
      "Permintaan AI diblokir oleh pemeriksaan keamanan.",
      { statusCode: 400 },
    );
  }

  const provider = getAiProvider(providerName);
  const response = await provider.complete({
    prompt: guardrail.modifiedContent ?? prompt,
    context: {},
  });
  let output: unknown;
  try {
    output = JSON.parse(response.content);
  } catch {
    throw new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      "Provider AI mengembalikan format respons yang tidak valid.",
      { statusCode: 502 },
    );
  }
  const validated = aiStructuredResponseSchema.safeParse(output);
  if (!validated.success) {
    throw new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      "Respons provider AI tidak sesuai format yang diharapkan.",
      { statusCode: 502 },
    );
  }

  logger.info("ai.request.completed", {
    provider: response.provider,
    promptId: request.promptId,
  });
  const safeResponse: AiResponse = {
    provider: response.provider,
    content: JSON.stringify(validated.data),
  };
  return {
    response: safeResponse,
    evaluation: evaluateAiOutput({ prompt, response: safeResponse.content }),
  };
}
