"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { AlertTriangle, List, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { prioritizationCriterionKeys } from "@/modules/decision-engine/types";
import type { ProjectDetail } from "@/modules/project-progress/types";

interface ProjectPrioritizationWorkspaceProps {
  readonly assignableProjects: readonly ProjectDetail[];
}

const CRITERION_LABELS: Readonly<Record<string, string>> = {
  physical_progress: "Progres fisik",
  financial_progress: "Progres keuangan",
  contract_value: "Nilai kontrak",
};

const SOURCE_KIND_LABELS: Readonly<Record<string, string>> = {
  submitted_report: "Laporan diserahkan",
  initial_field: "Data awal proyek",
  project_field: "Data bidang proyek",
};

const INDONESIAN_MONTHS: Readonly<Record<number, string>> = {
  1: "Januari",
  2: "Februari",
  3: "Maret",
  4: "April",
  5: "Mei",
  6: "Juni",
  7: "Juli",
  8: "Agustus",
  9: "September",
  10: "Oktober",
  11: "November",
  12: "Desember",
};

const criterionBreakdownSchema = z.object({
  criterion: z.string(),
  sourceValue: z.number(),
  normalizedValue: z.number(),
  weight: z.number(),
  contribution: z.number(),
  source: z.unknown(),
});

const prioritizationRunSchema = z.object({
  runId: z.string().uuid(),
  fiscalYear: z.number().int(),
  criteriaVersion: z.string(),
  algorithmVersion: z.string(),
  createdAt: z.string().datetime(),
  projectCount: z.number().int().nonnegative(),
});

const prioritizationRunItemSchema = z.object({
  projectId: z.string().uuid(),
  rank: z.number().int().positive(),
  score: z.number(),
  inputSnapshot: z.unknown(),
  scoreBreakdown: z.array(criterionBreakdownSchema).optional().nullable(),
});

const prioritizationRunDetailSchema = z.object({
  run: z.object({
    runId: z.string().uuid(),
    fiscalYear: z.number().int(),
    criteriaVersion: z.string(),
    algorithmVersion: z.string(),
    createdAt: z.string().datetime(),
    projectCount: z.number().int().nonnegative(),
  }),
  items: z.array(prioritizationRunItemSchema),
});

const createRunResponseSchema = z.object({
  runId: z.string().uuid(),
  criteriaVersion: z.string(),
  algorithmVersion: z.string(),
  fiscalYear: z.number().int(),
  createdAt: z.string().datetime(),
  results: z.array(
    z.object({
      projectId: z.string().uuid(),
      rank: z.number().int().positive(),
      score: z.number(),
      breakdown: z.array(criterionBreakdownSchema),
    }),
  ),
});

const aiExplanationSchema = z.strictObject({
  summary: z.string().min(1).max(600),
  keyFactors: z.array(z.string().min(1).max(160)).min(1).max(4),
  limitations: z.array(z.string().min(1).max(160)).min(1).max(4),
});

type PrioritizationRun = z.infer<typeof prioritizationRunSchema>;
type PrioritizationRunDetail = z.infer<typeof prioritizationRunDetailSchema>;
type AiExplanation = z.infer<typeof aiExplanationSchema>;

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sourceKindLabel(kind: unknown): string {
  if (typeof kind === "string" && kind in SOURCE_KIND_LABELS) {
    const entry = Object.entries(SOURCE_KIND_LABELS).find(
      ([key]) => key === kind,
    );
    return entry?.[1] ?? "Tidak diketahui";
  }
  return "Tidak diketahui";
}

function criterionLabel(criterion: string): string {
  const entry = Object.entries(CRITERION_LABELS).find(
    ([key]) => key === criterion,
  );
  return entry?.[1] ?? criterion;
}

function latestInputPeriod(
  items: PrioritizationRunDetail["items"],
): string | null {
  let latest: { year: number; month: number } | null = null;
  for (const item of items) {
    const breakdowns = item.scoreBreakdown ?? [];
    for (const breakdown of breakdowns) {
      const source = breakdown.source as
        | {
            readonly kind?: unknown;
            readonly periodYear?: unknown;
            readonly periodMonth?: unknown;
          }
        | undefined;
      if (source?.kind !== "submitted_report") continue;
      const year =
        typeof source.periodYear === "number" ? source.periodYear : null;
      const month =
        typeof source.periodMonth === "number" ? source.periodMonth : null;
      if (year === null || month === null) continue;
      if (
        !latest ||
        year > latest.year ||
        (year === latest.year && month > latest.month)
      ) {
        latest = { year, month };
      }
    }
  }
  if (!latest) return null;
  const monthLabel = INDONESIAN_MONTHS[latest.month];
  if (!monthLabel) return null;
  return `${monthLabel} ${latest.year}`;
}

function hasUnverifiedProgress(
  items: PrioritizationRunDetail["items"],
): boolean {
  return items.some((item) =>
    (item.scoreBreakdown ?? []).some(
      (breakdown) =>
        (breakdown.source as { readonly kind?: unknown } | undefined)?.kind ===
        "submitted_report",
    ),
  );
}

function breakdownSources(items: PrioritizationRunDetail["items"]): string {
  const kinds = new Set<string>();
  for (const item of items) {
    for (const breakdown of item.scoreBreakdown ?? []) {
      const kind = (breakdown.source as { readonly kind?: unknown } | undefined)
        ?.kind;
      if (typeof kind === "string") kinds.add(kind);
    }
  }
  return [...kinds].map(sourceKindLabel).join(", ");
}

function errorMessageFromPayload(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }
  return fallback;
}

interface ProjectPrioritizationWorkspaceProps {
  readonly assignableProjects: readonly ProjectDetail[];
}

export function ProjectPrioritizationWorkspace({
  assignableProjects,
}: ProjectPrioritizationWorkspaceProps) {
  const currentYear = new Date().getFullYear();

  const fiscalYearOptions = useMemo(() => {
    const years = new Set<number>();
    for (const project of assignableProjects) {
      years.add(project.tahunAnggaran);
    }
    years.add(currentYear);
    return [...years]
      .sort((first, second) => second - first)
      .map((year) => ({ value: String(year), label: String(year) }));
  }, [assignableProjects, currentYear]);

  const initialFiscalYear = useMemo(() => {
    const hasCurrentYear = assignableProjects.some(
      (project) => project.tahunAnggaran === currentYear,
    );
    if (hasCurrentYear) {
      return String(currentYear);
    }
    if (assignableProjects.length > 0) {
      const years = assignableProjects.map((p) => p.tahunAnggaran);
      return String(Math.max(...years));
    }
    return String(currentYear);
  }, [assignableProjects, currentYear]);

  const [fiscalYear, setFiscalYear] = useState(initialFiscalYear);

  useEffect(() => {
    if (assignableProjects.length > 0) {
      const hasCurrent = assignableProjects.some(
        (p) => String(p.tahunAnggaran) === fiscalYear,
      );
      if (!hasCurrent) {
        const years = assignableProjects.map((p) => p.tahunAnggaran);
        setFiscalYear(String(Math.max(...years)));
      }
    }
  }, [assignableProjects, fiscalYear]);

  const fiscalYearProjects = useMemo(
    () =>
      assignableProjects.filter(
        (project) =>
          project.tahunAnggaran === Number(fiscalYear),
      ),
    [assignableProjects, fiscalYear],
  );

  const [runs, setRuns] = useState<readonly PrioritizationRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PrioritizationRunDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<AiExplanation | null>(
    null,
  );
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<{
    readonly kind: "info" | "success";
    readonly text: string;
  } | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
    new Set(),
  );

  const detailRequestId = useRef(0);
  const explanationRequestId = useRef(0);
  const firstLoad = useRef(true);
  const projectById = useMemo(
    () => new Map(assignableProjects.map((project) => [project.id, project])),
    [assignableProjects],
  );

  const loadRuns = useCallback(async () => {
    setError(null);
    setRunsLoading(true);
    try {
      const response = await fetch("/api/v1/projects/prioritization/runs", {
        cache: "no-store",
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          errorMessageFromPayload(
            payload,
            "Gagal memuat daftar run prioritisasi.",
          ),
        );
      }
      const parsed = z
        .object({ runs: z.array(prioritizationRunSchema) })
        .safeParse(payload);
      if (!parsed.success) {
        throw new Error(
          "Server mengembalikan daftar run prioritisasi yang tidak valid.",
        );
      }
      if (firstLoad.current && parsed.data.runs.length > 0) {
        firstLoad.current = false;
        setSelectedRunId(parsed.data.runs[0].runId);
      }
      setRuns(parsed.data.runs);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat daftar run prioritisasi.",
      );
    } finally {
      setRunsLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (runId: string) => {
    const requestId = ++detailRequestId.current;
    setDetailLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/projects/prioritization/runs/${encodeURIComponent(runId)}`,
        { cache: "no-store" },
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          errorMessageFromPayload(payload, "Gagal memuat detail run."),
        );
      }
      const parsed = prioritizationRunDetailSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("Server mengembalikan detail run yang tidak valid.");
      }
      if (requestId !== detailRequestId.current) return;
      setDetail(parsed.data);
    } catch (loadError) {
      if (requestId !== detailRequestId.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat detail run.",
      );
    } finally {
      if (requestId === detailRequestId.current) {
        setDetailLoading(false);
      }
    }
  }, []);

  const createRun = useCallback(
    async (nextFiscalYear: number, nextProjectIds: readonly string[]) => {
      setCreating(true);
      setError(null);
      setCreateMessage(null);
      try {
        const response = await fetch("/api/v1/projects/prioritization/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fiscalYear: nextFiscalYear,
            projectIds: nextProjectIds.length > 0 ? nextProjectIds : undefined,
          }),
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            errorMessageFromPayload(payload, "Gagal menjalankan prioritisasi."),
          );
        }
        const parsed = createRunResponseSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error(
            "Server mengembalikan hasil prioritisasi yang tidak valid.",
          );
        }
        void loadRuns();
        setSelectedRunId(parsed.data.runId);
        setCreateMessage({
          kind: "success",
          text: "Run prioritisasi berhasil dibuat. Silakan tinjau hasilnya di atas.",
        });
      } catch (createError) {
        setError(
          createError instanceof Error
            ? createError.message
            : "Gagal menjalankan prioritisasi.",
        );
      } finally {
        setCreating(false);
      }
    },
    [loadRuns],
  );

  const explainSelectedRun = useCallback(async (runId: string) => {
    const requestId = ++explanationRequestId.current;
    setExplaining(true);
    setAiExplanation(null);
    setExplanationError(null);
    try {
      const response = await fetch(
        `/api/v1/projects/prioritization/runs/${encodeURIComponent(runId)}/explanation`,
        { method: "POST", cache: "no-store" },
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          errorMessageFromPayload(
            payload,
            "Penjelasan AI belum dapat dimuat.",
          ),
        );
      }
      const parsed = aiExplanationSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("Respons penjelasan AI tidak sesuai format.");
      }
      if (requestId === explanationRequestId.current) {
        setAiExplanation(parsed.data);
      }
    } catch (requestError) {
      if (requestId === explanationRequestId.current) {
        setExplanationError(
          requestError instanceof Error
            ? requestError.message
            : "Penjelasan AI belum dapat dimuat.",
        );
      }
    } finally {
      if (requestId === explanationRequestId.current) setExplaining(false);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    if (!selectedRunId) {
      setDetail(null);
      return;
    }
    setDetail(null);
    explanationRequestId.current += 1;
    setAiExplanation(null);
    setExplanationError(null);
    setExplaining(false);
    void loadDetail(selectedRunId);
  }, [selectedRunId, loadDetail]);

  const handleToggleProject = useCallback(
    (projectId: string, checked: boolean) => {
      setSelectedProjectIds((previous) => {
        const next = new Set(previous);
        if (checked) next.add(projectId);
        else next.delete(projectId);
        return next;
      });
    },
    [],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void createRun(Number(fiscalYear), [...selectedProjectIds]);
    },
    [createRun, fiscalYear, selectedProjectIds],
  );

  const selectedDetail = detail;
  const detailItems = selectedDetail?.items ?? [];
  const latestPeriod = selectedDetail ? latestInputPeriod(detailItems) : null;
  const unverifiedProgress = selectedDetail
    ? hasUnverifiedProgress(detailItems)
    : false;

  return (
    <section className="space-y-6">
      {runsLoading && runs.length === 0 ? (
        <div className="space-y-4" aria-label="Memuat daftar run prioritisasi">
          <div className="bg-muted h-4 w-56 animate-pulse rounded" />
          <div className="bg-muted h-32 w-full animate-pulse rounded-xl" />
        </div>
      ) : null}

      {error && (
        <div className="border-destructive/30 bg-destructive/5 rounded-xl border p-4">
          <p className="text-destructive text-sm">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              void loadRuns();
            }}
          >
            Coba lagi
          </Button>
        </div>
      )}

      {runs.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Pilih riwayat run:
              </span>
            </div>
            <Select
              id="prioritization-run-select"
              value={selectedRunId ?? ""}
              onChange={(event) => setSelectedRunId(event.target.value || null)}
              placeholder="Pilih run..."
              options={runs.map((run) => ({
                value: run.runId,
                label: `Tahun ${run.fiscalYear} · ${run.projectCount} proyek · ${new Date(run.createdAt).toLocaleDateString("id-ID")}`,
              }))}
            />
            <Button
              type="button"
              onClick={() => {
                setError(null);
                void loadRuns();
              }}
            >
              Segarkan
            </Button>
          </div>

          <section aria-labelledby="prioritization-detail-heading">
            <h2
              id="prioritization-detail-heading"
              className="text-lg font-semibold"
            >
              Detail Hasil Prioritasi
            </h2>

            {detailLoading && !detail ? (
              <div className="space-y-3" aria-label="Memuat detail run">
                <div className="bg-muted h-4 w-48 animate-pulse rounded" />
                <div className="bg-muted h-12 w-64 animate-pulse rounded" />
                <div className="bg-muted h-32 w-full animate-pulse rounded-xl" />
              </div>
            ) : null}

            {selectedDetail && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tahun Anggaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {selectedDetail.run.fiscalYear}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Versi Kriteria</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-mono text-sm">
                        {selectedDetail.run.criteriaVersion}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Versi Algoritma</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-mono text-sm">
                        {selectedDetail.run.algorithmVersion}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Tanggal Dibuat</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        {formatDateTime(selectedDetail.run.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Jumlah Proyek</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {selectedDetail.run.projectCount}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Input Terbaru</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{latestPeriod ?? "-"}</p>
                    </CardContent>
                  </Card>
                </div>

                {unverifiedProgress && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        aria-hidden="true"
                        className="mt-0.5 size-5 shrink-0"
                      />
                      <div>
                        <p className="text-sm font-semibold">
                          Progres input belum tentu terverifikasi
                        </p>
                        <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                          Beberapa data progres berasal dari laporan yang
                          diserahkan (status <b>submitted</b>) dan belum tentu
                          diverifikasi secara independen.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <section className="mt-4 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Penjelasan berbantuan AI
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        AI merangkum dasar data dan batasannya; skor dan
                        peringkat tetap dihitung oleh algoritma deterministik.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={explaining || detailItems.length === 0}
                      loading={explaining}
                      onClick={() => void explainSelectedRun(selectedDetail.run.runId)}
                    >
                      <Sparkles aria-hidden="true" className="mr-2 size-4" />
                      {explaining ? "Menganalisis..." : "Jelaskan hasil dengan AI"}
                    </Button>
                  </div>
                  {explanationError ? (
                    <div
                      role="alert"
                      className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm"
                    >
                      <p>{explanationError}</p>
                      <p className="mt-1 text-xs">
                        Hasil deterministik tetap tersedia. Pastikan AI_PROVIDER
                        dan API key provider terpilih telah dikonfigurasi.
                      </p>
                    </div>
                  ) : null}
                  {aiExplanation ? (
                    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20">
                      <CardContent className="space-y-4 pt-5">
                        <div>
                          <Badge variant="secondary">Penjelasan AI</Badge>
                          <p className="mt-2 text-sm leading-6">
                            {aiExplanation.summary}
                          </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <h4 className="text-xs font-semibold">
                              Faktor yang tercermin dalam data
                            </h4>
                            <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-xs">
                              {aiExplanation.keyFactors.map((factor) => (
                                <li key={factor}>{factor}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold">
                              Batasan analisis
                            </h4>
                            <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-xs">
                              {aiExplanation.limitations.map((limitation) => (
                                <li key={limitation}>{limitation}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <p className="text-muted-foreground border-t pt-3 text-xs">
                          Penjelasan dibuat saat diminta dan tidak disimpan.
                          Ini bukan keputusan atau rekomendasi tindakan; tinjau
                          data sumber sebelum mengambil keputusan secara manual.
                        </p>
                      </CardContent>
                    </Card>
                  ) : null}
                </section>

                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Perbandingan skor prioritas</CardTitle>
                    <p className="text-muted-foreground text-xs">
                      Skor gabungan dari progres fisik, progres keuangan, dan
                      nilai kontrak. Batang menunjukkan skor pada skala 0–100.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detailItems.map((item) => {
                      const project = projectById.get(item.projectId);
                      const visualScore = Math.min(
                        100,
                        Math.max(0, item.score),
                      );
                      return (
                        <div
                          key={item.projectId}
                          className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,1.4fr)_4rem] sm:items-center"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {project?.namaPaket ?? `Proyek peringkat ${item.rank}`}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {project
                                ? `${project.instansi} · ${project.lokasi}`
                                : "Detail proyek tidak lagi tersedia pada penugasan akun ini"}
                            </p>
                          </div>
                          <div
                            className="bg-secondary h-2.5 overflow-hidden rounded-full"
                            role="progressbar"
                            aria-label={`Skor ${project?.namaPaket ?? `proyek peringkat ${item.rank}`}`}
                            aria-valuenow={visualScore}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${visualScore}%` }}
                            />
                          </div>
                          <span className="text-right text-sm font-semibold tabular-nums">
                            {item.score.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <caption className="text-muted-foreground mb-2 text-left text-xs">
                      Per barang: peringkat, skor total, dan kontribusi per
                      kriteria.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" className="text-left text-xs">
                          Peringkat
                        </th>
                        <th scope="col" className="text-left text-xs">
                          Proyek
                        </th>
                        <th scope="col" className="text-right text-xs">
                          Skor
                        </th>
                        {prioritizationCriterionKeys.map((criterion) => (
                          <th
                            key={criterion}
                            scope="col"
                            className="text-right text-xs"
                          >
                            {criterionLabel(criterion)}
                          </th>
                        ))}
                        <th scope="col" className="text-left text-xs">
                          Sumber data
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailItems.map((item) => (
                        <tr key={item.projectId} className="border-b">
                          <td className="text-left">
                            <Badge variant="secondary">{item.rank}</Badge>
                          </td>
                          <td className="text-left">
                            <span className="block font-medium">
                              {projectById.get(item.projectId)?.namaPaket ??
                                `Proyek peringkat ${item.rank}`}
                            </span>
                            <span className="text-muted-foreground block text-xs">
                              {projectById.get(item.projectId)
                                ? `${projectById.get(item.projectId)?.instansi} · ${projectById.get(item.projectId)?.lokasi}`
                                : "Proyek tidak lagi tersedia pada penugasan akun ini"}
                            </span>
                          </td>
                          <td className="text-right font-medium">
                            {item.score.toFixed(2)}
                          </td>
                          {prioritizationCriterionKeys.map((criterion) => {
                            const breakdown =
                              item.scoreBreakdown?.find(
                                (entry) => entry.criterion === criterion,
                              ) ?? null;
                            return (
                              <td key={criterion} className="text-right">
                                {breakdown ? (
                                  <>
                                    {breakdown.contribution.toFixed(2)}
                                    <span className="text-muted-foreground block text-xs">
                                      w {breakdown.weight.toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  "–"
                                )}
                              </td>
                            );
                          })}
                          <td className="text-left text-xs">
                            {breakdownSources([item])}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Card className="mt-4 border border-amber-100 bg-amber-50/50 dark:border-amber-900/20 dark:bg-amber-950/10">
                  <CardHeader>
                    <CardTitle className="text-amber-900 dark:text-amber-100">
                      Keterangan hasil
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Hasil perankingan ini adalah <b>rekomendasi pendukung</b>{" "}
                      untuk pertimbangan ASN, bukan persetujuan, penolakan,
                      perubahan anggaran, atau keputusan otomatis. Keputusan
                      lanjutan tetap ditetapkan secara manual oleh pengguna.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </section>
        </section>
      ) : runs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border py-16 text-center">
          <List aria-hidden="true" className="text-muted-foreground size-12" />
          <p className="text-muted-foreground">
            Belum ada riwayat run prioritisasi.
          </p>
          <p className="text-muted-foreground text-sm">
            Buat run baru pada formulir di bawah untuk menghasilkan perankingan.
          </p>
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Buat Run Prioritasi Baru</h2>
        <p className="text-muted-foreground text-sm">
          Pilih tahun anggaran dan, secara opsional, proyek yang akan diurutkan.
          ID tenant, bobot, skor, dan nilai kriteria dikelola oleh sistem dan
          tidak dikirim dari halaman ini.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="prioritization-fiscal-year">Tahun Anggaran</Label>
              <Select
                id="prioritization-fiscal-year"
                value={fiscalYear}
                onChange={(event) => {
                  setFiscalYear(event.target.value);
                  setSelectedProjectIds(new Set());
                }}
                options={fiscalYearOptions}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prioritization-projects">
                Pilih Proyek (Opsional)
              </Label>
              <p className="text-muted-foreground text-xs">
                Kosongkan semua untuk menggunakan proyek yang dapat diakses oleh
                akun Anda.
              </p>
              <div
                id="prioritization-projects"
                className="border-input max-h-48 space-y-2 overflow-y-auto rounded border p-2"
              >
                {fiscalYearProjects.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Tidak ada proyek berjalan yang ditugaskan pada tahun ini.
                  </p>
                ) : (
                  fiscalYearProjects.map((project) => {
                    const checked = selectedProjectIds.has(project.id);
                    return (
                      <label
                        key={project.id}
                        className="flex cursor-pointer items-center gap-2 text-sm select-none"
                      >
                        <input
                          type="checkbox"
                          value={project.id}
                          checked={checked}
                          onChange={(event) =>
                            handleToggleProject(
                              project.id,
                              event.target.checked,
                            )
                          }
                        />
                        {project.namaPaket} — {project.instansi} · {project.lokasi}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <Button
            type="submit"
            disabled={creating || fiscalYearProjects.length === 0}
            loading={creating}
          >
            {creating
              ? "Sedang menjalankan prioritisasi..."
              : "Jalankan prioritisasi"}
          </Button>
        </form>
        {createMessage && (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {createMessage.text}
          </p>
        )}
      </section>
    </section>
  );
}