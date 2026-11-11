import { AppError, ErrorCode } from "@/lib/errors";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { checkGuardrails } from "./guardrails";
import { getAiProvider } from "./providers";
import { aiExplanationOutputSchema, type AiExplanationOutput } from "./schemas";
import type { AiProvider } from "./types";
import { z } from "zod";

const criterionLabels = {
  physical_progress: "Progres fisik",
  financial_progress: "Progres keuangan",
  contract_value: "Nilai kontrak",
} as const;
type CriterionKey = keyof typeof criterionLabels;

export const criterionFactorInputSchema = z.strictObject({
  criterion: z.enum([
    "physical_progress",
    "financial_progress",
    "contract_value",
  ]),
  sourceValue: z.number().finite(),
  normalizedValue: z.number().finite().optional(),
  weight: z.number().finite().optional(),
  contribution: z.number().finite().optional(),
  source: z.strictObject({
    kind: z.enum(["submitted_report", "initial_field", "project_field"]),
    periodYear: z.number().int().min(2020).max(2100).optional(),
    periodMonth: z.number().int().min(1).max(12).optional(),
    submittedAt: z.string().datetime().optional(),
    field: z.string().min(1).max(80).optional(),
  }),
});

const explanationInputSchema = z.strictObject({
  criteriaVersion: z.string().min(1).max(40),
  algorithmVersion: z.string().min(1).max(40),
  fiscalYear: z.number().int().min(2020).max(2100),
  criteria: z.array(
    z.enum(["physical_progress", "financial_progress", "contract_value"]),
  ).max(3),
  items: z.array(
    z.strictObject({
      breakdown: z.array(criterionFactorInputSchema).max(3),
    }),
  ),
});

export type CriterionFactorInput = z.infer<
  typeof criterionFactorInputSchema
>;

export interface ProjectPriorityItemInput {
  readonly breakdown: readonly CriterionFactorInput[];
}

export interface ExplainProjectPriorityInput {
  readonly criteriaVersion: string;
  readonly algorithmVersion: string;
  readonly fiscalYear: number;
  readonly criteria: readonly CriterionKey[];
  readonly items: readonly ProjectPriorityItemInput[];
}

function buildExplanationPrompt(input: ExplainProjectPriorityInput): string {
  const metrics = new Map<
    CriterionKey,
    { count: number; sourceKinds: Set<string>; periods: Set<string> }
  >();
  for (const criterion of input.criteria) {
    metrics.set(criterion, {
      count: 0,
      sourceKinds: new Set(),
      periods: new Set(),
    });
  }
  for (const item of input.items) {
    for (const factor of item.breakdown) {
      const metric = metrics.get(factor.criterion);
      if (!metric) continue;
      metric.count += 1;
      metric.sourceKinds.add(factor.source.kind);
      if (
        factor.source.periodYear !== undefined &&
        factor.source.periodMonth !== undefined
      ) {
        metric.periods.add(
          `${factor.source.periodYear}/${String(factor.source.periodMonth).padStart(2, "0")}`,
        );
      }
    }
  }
  const criterionSummary = [...metrics.entries()]
    .map(([key, metric]) => {
      const periods = [...metric.periods].sort();
      const sources = [...metric.sourceKinds].sort().join(", ") || "tidak tersedia";
      const periodRange =
        periods.length > 0
          ? `${periods[0]}–${periods[periods.length - 1]}`
          : "tanpa periode laporan";
      return `- ${criterionLabels[key]}: ${metric.count}/${input.items.length} proyek memiliki data; sumber ${sources}; periode ${periodRange}.`;
    })
    .join("\n");

  return `Jelaskan secara netral proses prioritisasi proyek secara ringkas dalam bahasa Indonesia.
Ini hanya penjelasan pendukung: jangan membuat atau mengubah keputusan, rekomendasi tindakan, skor, bobot, peringkat, atau urutan proyek.
Jangan menyimpulkan nilai atau arah capaian yang tidak tercantum. Gunakan hanya ringkasan agregat ini; tidak ada nama maupun ID proyek.

Tahun fiskal: ${input.fiscalYear}
Versi algoritma deterministik: ${input.algorithmVersion} (kriteria ${input.criteriaVersion})
Jumlah proyek yang dirangkum: ${input.items.length}
Ketersediaan data agregat:
${criterionSummary || "- Tidak ada rincian kriteria."}

Balas hanya dengan objek JSON valid berisi:
- summary: maksimal 600 karakter.
- keyFactors: 1–4 butir, masing-masing maksimal 160 karakter.
- limitations: 1–4 butir, masing-masing maksimal 160 karakter.
Jangan menambahkan properti lain.`;
}

export async function explainProjectPriority(
  input: ExplainProjectPriorityInput,
  options: { readonly provider?: AiProvider } = {},
): Promise<AiExplanationOutput> {
  const env = getEnv();
  if (!env.AI_PROVIDER) {
    throw new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      "Fitur penjelasan AI tidak dikonfigurasi pada server. Atur AI_PROVIDER dan API key provider tersebut.",
      { statusCode: 503 },
    );
  }

  const validatedInput = explanationInputSchema.safeParse(input);
  if (!validatedInput.success) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Data ringkasan prioritisasi tidak valid untuk penjelasan AI.",
      { statusCode: 400 },
    );
  }
  const provider = options.provider ?? getAiProvider(env.AI_PROVIDER);
  const prompt = buildExplanationPrompt(validatedInput.data);
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

  const response = await provider.complete({
    prompt: guardrail.modifiedContent ?? prompt,
    context: {},
  });
  const content = response.content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  let output: unknown;
  try {
    output = JSON.parse(content);
  } catch {
    logger.warn("ai.explanation.invalid_output", {
      provider: response.provider,
      reason: "invalid_json",
    });
    throw new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      "Provider AI mengembalikan penjelasan dengan format yang tidak valid.",
      { statusCode: 502 },
    );
  }
  const parsed = aiExplanationOutputSchema.safeParse(output);
  if (!parsed.success) {
    logger.warn("ai.explanation.invalid_output", { provider: response.provider });
    throw new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      "Tanggapan penyedia AI tidak sesuai skema yang diharapkan.",
      { statusCode: 502 },
    );
  }

  logger.info("ai.explanation.completed", { provider: response.provider });
  return parsed.data;
}
