import { afterEach, describe, expect, it, vi } from "vitest";
import { fillPromptTemplate } from "@/modules/ai/prompts";
import { aiExplanationOutputSchema, aiStructuredResponseSchema } from "@/modules/ai/schemas";
import { checkGuardrails } from "@/modules/ai/guardrails";
import { getAiProvider, geminiProvider } from "@/modules/ai/providers";
import type { AiProviderName } from "@/modules/ai/types";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("modules/ai", () => {
  describe("getAiProvider", () => {
    it("mengembalikan adapter gemini untuk provider yang diimplementasikan", () => {
      const provider = getAiProvider("gemini");
      expect(provider.name).toBe("gemini");
      expect(provider).toBe(geminiProvider);
    });

    it("menolak provider yang belum diimplementasikan dengan error eksplisit", () => {
      for (const name of ["cerebras", "groq", "openrouter"] as AiProviderName[]) {
        expect(() => getAiProvider(name)).toThrow(/belum diimplementasikan/);
      }
    });
  });

  describe("prompt template", () => {
    it("fills prompt templates with context values", () => {
      expect(fillPromptTemplate("Hello {{name}} from {{city}}", { name: "Ayu", city: "Bandung" })).toBe("Hello Ayu from Bandung");
    });
  });

  describe("aiStructuredResponseSchema", () => {
    it("validates structured responses", () => {
      expect(aiStructuredResponseSchema.safeParse({ summary: "ok", confidence: 0.9, labels: ["a"] }).success).toBe(true);
      expect(aiStructuredResponseSchema.safeParse({ summary: "", confidence: 2, labels: [] }).success).toBe(false);
    });
  });

  describe("aiExplanationOutputSchema", () => {
    it("terima output yang valid", () => {
      expect(aiExplanationOutputSchema.safeParse({ summary: "ok", keyFactors: ["a"], limitations: ["b"] }).success).toBe(true);
    });

    it("tolak field ekstra (skor, bobot, rank, keputusan, atau aksi)", () => {
      expect(aiExplanationOutputSchema.safeParse({ summary: "ok", keyFactors: ["a"], limitations: ["b"], score: 90 }).success).toBe(false);
      expect(aiExplanationOutputSchema.safeParse({ summary: "ok", keyFactors: ["a"], limitations: ["b"], weight: 0.5 }).success).toBe(false);
      expect(aiExplanationOutputSchema.safeParse({ summary: "ok", keyFactors: ["a"], limitations: ["b"], rank: 1 }).success).toBe(false);
      expect(aiExplanationOutputSchema.safeParse({ summary: "ok", keyFactors: ["a"], limitations: ["b"], decision: "approve" }).success).toBe(false);
      expect(aiExplanationOutputSchema.safeParse({ summary: "ok", keyFactors: ["a"], limitations: ["b"], action: "setujui" }).success).toBe(false);
    });

    it("tolak ringkasan kosong dan melebihi batas panjang", () => {
      expect(aiExplanationOutputSchema.safeParse({ summary: "", keyFactors: ["a"], limitations: ["b"] }).success).toBe(false);
      expect(aiExplanationOutputSchema.safeParse({ summary: "x".repeat(2001), keyFactors: ["a"], limitations: ["b"] }).success).toBe(false);
    });

    it("tolak jumlah item di luar batas", () => {
      expect(aiExplanationOutputSchema.safeParse({ summary: "ok", keyFactors: [], limitations: ["b"] }).success).toBe(false);
      expect(aiExplanationOutputSchema.safeParse({ summary: "ok", keyFactors: Array(11).fill("x"), limitations: ["b"] }).success).toBe(false);
      expect(aiExplanationOutputSchema.safeParse({ summary: "ok", keyFactors: ["a"], limitations: Array(11).fill("x") }).success).toBe(false);
    });

    it("tolak item yang terlalu panjang", () => {
      expect(aiExplanationOutputSchema.safeParse({ summary: "ok", keyFactors: ["x".repeat(301)], limitations: ["b"] }).success).toBe(false);
    });
  });

  describe("guardrails", () => {
    it("detects pii and harmful content", () => {
      const result = checkGuardrails("Contact me at test@example.com and do violence");
      expect(result.allowed).toBe(false);
      expect(result.violations.map((v) => v.code)).toContain("pii_detected");
      expect(result.violations.map((v) => v.code)).toContain("harmful_content");
      expect(result.modifiedContent).toContain("[REDACTED]");
    });
  });
});
