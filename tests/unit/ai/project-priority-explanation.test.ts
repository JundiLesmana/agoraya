import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetEnv } from "@/lib/env";
import { explainProjectPriority } from "@/modules/ai/project-priority-explanation";
import { getAiProvider } from "@/modules/ai/providers";
import type { AiProvider } from "@/modules/ai/types";
import type { ExplainProjectPriorityInput } from "@/modules/ai/project-priority-explanation";

vi.mock("@/modules/ai/providers", () => ({
  getAiProvider: vi.fn(),
  geminiProvider: { name: "gemini", complete: vi.fn() },
}));

const fakeComplete = vi.fn();
const fakeProvider = { name: "gemini" as const, complete: fakeComplete } as unknown as AiProvider;

const baseInput: ExplainProjectPriorityInput = {
  criteriaVersion: "1.0.0",
  algorithmVersion: "weighted-sum-v1",
  fiscalYear: 2026,
  criteria: [{ key: "physical_progress", name: "Progres Fisik" }],
  items: [
    {
      breakdown: [
        {
          criterion: "physical_progress",
          sourceValue: 80,
          normalizedValue: 80,
          weight: 0.4,
          contribution: 32,
          source: { kind: "submitted_report", periodYear: 2026, periodMonth: 10 },
        },
      ],
    },
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
  resetEnv();
  process.env.DATABASE_URL = "postgres://agoraya:localdev@127.0.0.1:5432/agoraya_local";
  process.env.AUTH_SECRET = "test-secret-for-unit-tests-at-least-32-chars!";
  process.env.AI_PROVIDER = "gemini";
  process.env.AI_API_KEY = "test-api-key";
  vi.mocked(getAiProvider).mockReturnValue(fakeProvider);
});

afterEach(() => {
  delete process.env.AI_PROVIDER;
  delete process.env.AI_API_KEY;
  resetEnv();
});

describe("modules/ai/project-priority-explanation", () => {
  it("mengembalikan output yang valid dari provider dan tidak memuat field skor/rank", async () => {
    fakeComplete.mockResolvedValue({
      provider: "gemini",
      content: JSON.stringify({ summary: "Proyek prioritas berdasarkan progres fisik.", keyFactors: ["progres fisik tinggi"], limitations: ["data hanya satu periode"] }),
    });
    const result = await explainProjectPriority(baseInput);
    expect(result).toEqual({
      summary: "Proyek prioritas berdasarkan progres fisik.",
      keyFactors: ["progres fisik tinggi"],
      limitations: ["data hanya satu periode"],
    });
    expect(fakeComplete).toHaveBeenCalledTimes(1);
    const prompt = fakeComplete.mock.calls[0][0].prompt;
    expect(prompt).not.toMatch(/\b[\w.-]+@[\w.-]+\.\w{2,}\b/);
    expect(prompt).not.toContain("AI_API_KEY");
    expect(prompt).not.toContain("payload");
    expect(prompt).not.toMatch(/\b\d{10,15}\b/);
  });

  it("tolak output yang mengandung skor, bobot, rank, keputusan, atau aksi", async () => {
    fakeComplete.mockResolvedValue({
      provider: "gemini",
      content: JSON.stringify({ summary: "ok", keyFactors: ["a"], limitations: ["b"], score: 90 }),
    });
    await expect(explainProjectPriority(baseInput)).rejects.toThrow();
    expect(fakeComplete).toHaveBeenCalledTimes(1);
  });

  it("gagal secara eksplisit saat provider tidak dikonfigurasi", async () => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;
    resetEnv();
    await expect(explainProjectPriority(baseInput)).rejects.toMatchObject({ statusCode: 503 });
    expect(fakeComplete).not.toHaveBeenCalled();
  });

  it("gagal secara eksplisit saat provider gagal, tidak ada echo atau sukses palsu", async () => {
    fakeComplete.mockRejectedValue(new Error("jaringan putus"));
    await expect(explainProjectPriority(baseInput)).rejects.toThrow("jaringan putus");
    expect(fakeComplete).toHaveBeenCalledTimes(1);
  });

  it("tidak mengirim prompt yang mengandung PII ke penyedia AI", async () => {
    const piiInput: ExplainProjectPriorityInput = { ...baseInput, criteria: [{ key: "physical_progress", name: "kontak@email.com" }] };
    fakeComplete.mockResolvedValue({
      provider: "gemini",
      content: JSON.stringify({ summary: "ok", keyFactors: ["a"], limitations: ["b"] }),
    });
    await expect(explainProjectPriority(piiInput)).rejects.toThrow();
    expect(fakeComplete).not.toHaveBeenCalled();
  });

  it("menggunakan provider yang dikonfigurasi melalui env", async () => {
    fakeComplete.mockResolvedValue({
      provider: "gemini",
      content: JSON.stringify({ summary: "ok", keyFactors: ["a"], limitations: ["b"] }),
    });
    await explainProjectPriority(baseInput);
    expect(vi.mocked(getAiProvider)).toHaveBeenCalledWith("gemini");
  });
});
