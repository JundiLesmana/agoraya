import { AppError, ErrorCode } from "@/lib/errors";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { checkGuardrails } from "./guardrails";
import { getAiProvider } from "./providers";
import { aiExplanationOutputSchema, type AiExplanationOutput } from "./schemas";
import type { AiProvider } from "./types";

export interface CriterionFactorInput {
  readonly criterion: string;
  readonly sourceValue: number;
  readonly normalizedValue: number;
  readonly weight: number;
  readonly contribution: number;
  readonly source: {
    readonly kind: string;
    readonly periodYear?: number;
    readonly periodMonth?: number;
    readonly submittedAt?: string;
    readonly field?: string;
  };
}

export interface ProjectPriorityItemInput {
  readonly breakdown: readonly CriterionFactorInput[];
}

export interface ExplainProjectPriorityInput {
  readonly criteriaVersion: string;
  readonly algorithmVersion: string;
  readonly fiscalYear: number;
  readonly criteria: readonly { readonly key: string; readonly name?: string }[];
  readonly items: readonly ProjectPriorityItemInput[];
}

function buildExplanationPrompt(input: ExplainProjectPriorityInput): string {
  const criteriaList = input.criteria
    .map((c) => (c.name ? `${c.key} (${c.name})` : c.key))
    .join(", ") || "(tidak ada)";
  const itemLines = input.items
    .map((item, index) => {
      const factors = item.breakdown
        .map(
          (b) =>
            `- ${b.criterion}: nilai sumber ${b.sourceValue}, normalisasi ${b.normalizedValue}, bobot ${b.weight}, kontribusi ${b.contribution}, sumber ${b.source.kind}${
              b.source.periodYear !== undefined ? ` ${b.source.periodYear}/${b.source.periodMonth}` : ""
            }`,
        )
        .join("\n");
      return `Proyek ${index + 1}:\n${factors}`;
    })
    .join("\n\n");
  const sources = Array.from(
    new Set(
      input.items.flatMap((item) =>
        item.breakdown.map(
          (b) =>
            `${b.source.kind}${b.source.periodYear !== undefined ? ` ${b.source.periodYear}/${b.source.periodMonth}` : ""}`,
        ),
      ),
    ),
  ).join("; ") || "(tidak tersedia)";

  return `Berikan penjelasan ringkas (bahasa Indonesia) atas hasil prioritisasi proyek berikut.

PERINGATAN: JANGAN mencantumkan skor, bobot, peringkat, keputusan, rekomendasi tindakan, atau tindakan apa pun dalam penjelasan. Jelaskan hanya secara garis besar apa yang menjadi dasar prioritisasi dan batasannya.

Versi konfigurasi: ${input.criteriaVersion}
Algoritma: ${input.algorithmVersion}
Tahun fiskal/periode: ${input.fiscalYear}
Kriteria yang disetujui: ${criteriaList}
Sumber data/periode: ${sources}

Data ringkas per proyek:
${itemLines}

Keluarkan HANYA objek JSON dengan kunci berikut, tanpa teks tambahan di luar JSON:
- summary: penjelasan singkat maksimal 2000 karakter.
- keyFactors: daftar maksimal 10 faktor, masing-masing maksimal 300 karakter.
- limitations: daftar maksimal 10 batasan, masing-masing maksimal 300 karakter.

Jangan tambahkan kunci lain (tidak ada skor, bobot, rank, keputusan, atau aksi).`;
}

export async function explainProjectPriority(
  input: ExplainProjectPriorityInput,
  options: { readonly provider?: AiProvider } = {},
): Promise<AiExplanationOutput> {
  const env = getEnv();
  if (!env.AI_PROVIDER || !(env.AI_API_KEY ?? "").trim()) {
    throw new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      "Fitur penjelasan AI tidak dikonfigurasi pada server. Atur AI_PROVIDER dan AI_API_KEY.",
      { statusCode: 503 },
    );
  }

  const provider = options.provider ?? getAiProvider(env.AI_PROVIDER);
  const prompt = buildExplanationPrompt(input);
  const guardrail = checkGuardrails(prompt);
  if (!guardrail.allowed) {
    logger.warn("ai.explanation.prompt_blocked", {
      provider: provider.name,
      violations: guardrail.violations.map((v) => v.code),
    });
    throw new AppError(
      ErrorCode.UNPROCESSABLE_ENTITY,
      "Prompt penjelasan mengandung konten yang tidak diperbolehkan dan tidak dikirim ke penyedia AI.",
      { statusCode: 400 },
    );
  }

  const response = await provider.complete({ prompt: guardrail.modifiedContent ?? prompt, context: {} });
  const parsed = aiExplanationOutputSchema.safeParse(JSON.parse(response.content));
  if (!parsed.success) {
    logger.warn("ai.explanation.invalid_output", { provider: response.provider });
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Tanggapan penyedia AI tidak sesuai skema yang diharapkan.",
      { statusCode: 400 },
    );
  }

  logger.info("ai.explanation.completed", { provider: response.provider });
  return parsed.data;
}
