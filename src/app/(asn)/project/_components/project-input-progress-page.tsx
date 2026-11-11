"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProjectDetail } from "@/modules/project-progress/types";
import { ProjectSelector } from "./project-selector";
import { ProjectSummaryCard } from "./project-summary-card";
import { ProgressForm } from "./progress-form";
import { ProgressHistory } from "./progress-history";
import { DatasetSourcePicker } from "../../_components/dataset-source-picker";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { progressReportSchema, type ProgressReport } from "@/lib/progress";

interface ProjectInputProgressPageProps {
  readonly initialProjects: readonly ProjectDetail[];
}

export function ProjectInputProgressPage({
  initialProjects,
}: ProjectInputProgressPageProps) {
  const [selectedId, setSelectedId] = useState<string>(
    initialProjects[0]?.id ?? "",
  );
  const [history, setHistory] = useState<ProgressReport[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState<{
    kind: "info" | "success" | "error";
    text: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [sourceDatasetSubmissionId, setSourceDatasetSubmissionId] = useState<
    string | null
  >(null);
  const datasetSourceScope = useMemo(
    () => (selectedId ? { kind: "project" as const, projectId: selectedId } : null),
    [selectedId],
  );

  useEffect(() => {
    if (!selectedId) {
      setHistory([]);
      return;
    }

    let active = true;
    setSourceDatasetSubmissionId(null);
    setHistory([]);
    setHistoryLoading(true);
    setServerMessage(null);
    void (async () => {
      try {
        const response = await fetch(
          `/api/project-progress?project_id=${encodeURIComponent(selectedId)}`,
        );
        const payload: unknown = await response.json();
        if (!response.ok) {
          const error =
            payload && typeof payload === "object" && "error" in payload
              ? payload.error
              : null;
          throw new Error(
            typeof error === "string"
              ? error
              : "Gagal memuat riwayat progres proyek.",
          );
        }
        const rawHistory =
          payload && typeof payload === "object" && "history" in payload
            ? payload.history
            : null;
        const parsedHistory = progressReportSchema
          .array()
          .safeParse(rawHistory);
        if (!parsedHistory.success) {
          throw new Error(
            "Server mengembalikan riwayat progres yang tidak valid.",
          );
        }
        if (active) setHistory(parsedHistory.data);
      } catch (error) {
        if (active) {
          setServerMessage({
            kind: "error",
            text:
              error instanceof Error
                ? error.message
                : "Gagal memuat riwayat progres proyek.",
          });
        }
      } finally {
        if (active) setHistoryLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!serverMessage) return;
    const timer = setTimeout(() => setServerMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [serverMessage]);

  const project = useMemo(() => {
    return initialProjects.find((candidate) => candidate.id === selectedId);
  }, [initialProjects, selectedId]);

  const lastReport = history
    .filter(
      (report) =>
        report.status === "submitted" &&
        report.periodeTahun === project?.tahunAnggaran,
    )
    .sort(
      (a, b) =>
        b.periodeTahun - a.periodeTahun || b.periodeBulan - a.periodeBulan,
    )[0];
  const lastPhysical =
    lastReport?.progresFisik ?? project?.progresFisik ?? null;
  const lastKeuangan =
    lastReport?.progresKeuangan ?? project?.progresKeuangan ?? null;
  const currentProject =
    project && lastReport
      ? {
          ...project,
          progresFisik: lastReport.progresFisik,
          progresKeuangan: lastReport.progresKeuangan,
        }
      : project;

  const handleSelectProject = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleSave = useCallback(
    async (
      values: {
        periodeBulan: number;
        periodeTahun: number;
        progresFisik: number;
        progresKeuangan: number;
        catatan: string;
      },
      files: readonly File[],
      mode: "draft" | "submit",
    ) => {
      if (!project) {
        throw new Error("Silakan pilih proyek sebelum menyimpan progres.");
      }
      setSaving(true);
      setServerMessage(null);
      try {
        const formData = new FormData();
        formData.set("project_id", project.id);
        formData.set("periode_bulan", String(values.periodeBulan));
        formData.set("periode_tahun", String(values.periodeTahun));
        formData.set("progres_fisik", String(values.progresFisik));
        formData.set("progres_keuangan", String(values.progresKeuangan));
        formData.set("catatan", values.catatan);
        formData.set("mode", mode);
        if (sourceDatasetSubmissionId) {
          formData.set(
            "source_dataset_submission_id",
            sourceDatasetSubmissionId,
          );
        }
        files.forEach((file) => formData.append("dokumen", file));

        const response = await fetch("/api/project-progress", {
          method: "POST",
          body: formData,
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          const error =
            payload && typeof payload === "object" && "error" in payload
              ? payload.error
              : null;
          throw new Error(
            typeof error === "string"
              ? error
              : "Gagal menyimpan progres ke server.",
          );
        }

        const reportPayload =
          payload && typeof payload === "object" && "report" in payload
            ? payload.report
            : null;
        const parsedReport = progressReportSchema.safeParse(reportPayload);
        if (!parsedReport.success) {
          throw new Error(
            "Server mengembalikan data progres yang tidak valid.",
          );
        }
        const report = parsedReport.data;
        const warning =
          payload && typeof payload === "object" && "warning" in payload
            ? payload.warning
            : null;

        setHistory((prev) => [
          report,
          ...prev.filter((item) => item.id !== report.id),
        ]);
        setFormVersion((current) => current + 1);
        setServerMessage({
          kind: typeof warning === "string" ? "info" : "success",
          text:
            typeof warning === "string"
              ? warning
              : mode === "draft"
                ? "Progres disimpan sebagai draf."
                : "Progres berhasil diserahkan ke pimpinan.",
        });
      } catch (error) {
        setServerMessage({
          kind: "error",
          text:
            error instanceof Error
              ? error.message
              : "Gagal menyimpan progres ke server.",
        });
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [project, sourceDatasetSubmissionId],
  );

  return (
    <section className="space-y-6">
      {currentProject ? (
        <>
          <ProjectSelector
            projects={initialProjects}
            selectedId={selectedId}
            onSelect={handleSelectProject}
          />

          <ProjectSummaryCard
            project={currentProject}
            lastPhysical={lastPhysical}
            lastKeuangan={lastKeuangan}
            history={history}
          />

          <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
            <p className="text-sm font-semibold">Sumber data proyek</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Hubungkan laporan progres ke dataset yang sudah ditugaskan, atau
              lanjutkan tanpa memilih sumber dataset.
            </p>
            <DatasetSourcePicker
              scope={datasetSourceScope}
              value={sourceDatasetSubmissionId}
              onChange={setSourceDatasetSubmissionId}
              disabled={saving}
            />
          </div>

          <section className="border-t pt-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <span aria-hidden="true" className="text-primary">
                ●
              </span>{" "}
              Formulir input progres bulanan
            </h2>
            <p className="text-muted-foreground text-sm">
              Isi capaian fisik dan keuangan sesuai bukti lapangan. Progres
              fisik tidak boleh lebih rendah daripada laporan terkirim terakhir.
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              Perlu membandingkan proyek?{" "}
              <Link
                href="/asn/project/prioritization"
                className="text-primary inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
              >
                Buka prioritisasi
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
            </p>
          </section>

          <ProgressForm
            key={`${project?.id ?? selectedId}-${formVersion}`}
            project={currentProject}
            lastPhysicalProgress={lastPhysical}
            lastKeuanganProgress={lastKeuangan}
            onSave={handleSave}
            saving={saving}
          />

          <ProgressHistory history={history} />
          {historyLoading ? (
            <p role="status" className="text-muted-foreground text-sm">
              Memuat riwayat pelaporan...
            </p>
          ) : null}
        </>
      ) : initialProjects.length > 0 ? (
        <p
          role="status"
          className="text-muted-foreground rounded-lg border p-4 text-sm"
        >
          Pilih proyek untuk melihat ringkasan kontrak dan menginput progres.
        </p>
      ) : (
        <p
          role="status"
          className="text-muted-foreground rounded-lg border p-4 text-sm"
        >
          Belum ada proyek yang ditugaskan ke akun Anda.
        </p>
      )}

      {serverMessage ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-center gap-3 rounded-lg border p-4 text-sm",
            serverMessage.kind === "error"
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : serverMessage.kind === "info"
                ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100",
          )}
        >
          {serverMessage.kind !== "success" ? (
            <AlertTriangle aria-hidden="true" className="size-5" />
          ) : (
            <Check aria-hidden="true" className="size-5" />
          )}
          <span>{serverMessage.text}</span>
        </div>
      ) : null}
    </section>
  );
}
