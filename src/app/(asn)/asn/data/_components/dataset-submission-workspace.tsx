"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Database,
  FileUp,
  Save,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  datasetWorkspaceResponseSchema,
  type DatasetAssignment,
  type DatasetSubmissionPayload,
  type DatasetSubmissionSummary,
} from "@/modules/asn-datasets/contract";

const STEPS = [
  "Identitas dataset",
  "Data & sumber",
  "Cakupan & periode",
  "Kamus data",
  "Pemeriksaan",
  "Simpan",
] as const;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const SUBMISSION_CHECKS = [
  "Saya telah memeriksa cakupan, satuan, periode, dan cara pengumpulan data.",
  "Saya memiliki kewenangan untuk mengirim dataset dalam penugasan yang dipilih.",
  "Saya memastikan data tidak berisi informasi pribadi atau rahasia.",
];
const EMPTY_FORM: Omit<DatasetSubmissionPayload, "assignmentType"> = {
  agencyId: "",
  regionId: "",
  regionName: "",
  sectorId: "",
  referenceYear: new Date().getFullYear(),
  projectId: undefined,
  title: "",
  summary: "",
  description: "",
  category: "Statistik",
  sourceOrganization: "",
  sourceUrl: "",
  licenseName: "",
  licenseUrl: "",
  tags: [],
  periodStart: undefined,
  periodEnd: undefined,
  frequency: "annual",
  mode: "draft",
};

function assignmentKey(assignment: DatasetAssignment): string {
  return [
    assignment.assignmentType,
    assignment.projectId ?? assignment.agencyId,
    assignment.regionId,
    assignment.sectorId,
    assignment.referenceYear,
  ].join(":");
}

function categoryForAssignment(
  assignmentType: DatasetAssignment["assignmentType"],
): DatasetSubmissionPayload["category"] {
  if (assignmentType === "apbd") return "Anggaran";
  if (assignmentType === "project") return "Proyek";
  return "Statistik";
}

function assignmentLabel(assignment: DatasetAssignment): string {
  if (assignment.assignmentType === "project") {
    return `${assignment.projectLabel ?? "Proyek"} · ${assignment.referenceYear}`;
  }
  const kind = assignment.assignmentType === "apbd" ? "APBD" : "Statistik";
  return `${kind} · ${assignment.regionName} · ${assignment.sectorId}`;
}

function messageFromResponse(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return "Permintaan dataset tidak dapat diproses.";
}

function csvHeaders(csvText: string): string[] {
  const firstLine = csvText.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  return firstLine
    .split(",")
    .map((column) => column.trim().replace(/^"|"$/g, "").replace(/""/g, '"'))
    .filter(Boolean);
}

function summaryForSubmission(submission: DatasetSubmissionSummary): string {
  const assignment =
    submission.assignmentType === "project"
      ? submission.projectLabel
      : `${submission.regionName ?? "Wilayah"} · ${submission.sectorId}`;
  return `${assignment ?? "Penugasan"} · ${submission.referenceYear} · ${submission.recordCount.toLocaleString("id-ID")} baris`;
}

export function DatasetSubmissionWorkspace() {
  const [assignments, setAssignments] = useState<DatasetAssignment[]>([]);
  const [submissions, setSubmissions] = useState<DatasetSubmissionSummary[]>(
    [],
  );
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState("");
  const [form, setForm] = useState<DatasetSubmissionPayload>({
    ...EMPTY_FORM,
    assignmentType: "statistics",
  });
  const [csvText, setCsvText] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [step, setStep] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImportingBps, setIsImportingBps] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [checks, setChecks] = useState<string[]>([]);

  const currentAssignment = useMemo(
    () =>
      assignments.find(
        (assignment) => assignmentKey(assignment) === selectedAssignmentKey,
      ) ?? null,
    [assignments, selectedAssignmentKey],
  );
  const headers = useMemo(() => csvHeaders(csvText), [csvText]);
  const drafts = submissions.filter(
    (submission) => submission.status === "draft",
  );
  const submitted = submissions.filter(
    (submission) => submission.status === "submitted",
  );

  const loadWorkspace = useCallback(async (submissionId?: string) => {
    const url = submissionId
      ? `/api/asn/datasets/workspace?submissionId=${encodeURIComponent(submissionId)}`
      : "/api/asn/datasets/workspace";
    const response = await fetch(url);
    const raw: unknown = await response.json();
    if (!response.ok) throw new Error(messageFromResponse(raw));
    const result = datasetWorkspaceResponseSchema.parse(raw);
    setAssignments(result.assignments);
    setSubmissions(result.submissions);
    if (result.assignments.length && !submissionId) {
      setSelectedAssignmentKey((current) =>
        result.assignments.some(
          (assignment) => assignmentKey(assignment) === current,
        )
          ? current
          : assignmentKey(result.assignments[0]),
      );
    }
    if (result.detail) {
      const detailAssignment = result.assignments.find(
        (assignment) =>
          assignment.assignmentType === result.detail?.assignmentType &&
          assignment.projectId === result.detail.projectId &&
          assignment.agencyId === result.detail.agencyId &&
          assignment.regionId === result.detail.regionId &&
          assignment.sectorId === result.detail.sectorId,
      );
      if (detailAssignment) {
        setSelectedAssignmentKey(assignmentKey(detailAssignment));
      }
      setForm({
        submissionId: result.detail.id,
        assignmentType: result.detail.assignmentType,
        agencyId: result.detail.agencyId ?? "",
        regionId: result.detail.regionId ?? "",
        regionName: result.detail.regionName ?? "",
        sectorId: result.detail.sectorId,
        referenceYear: result.detail.referenceYear,
        ...(result.detail.projectId
          ? { projectId: result.detail.projectId }
          : {}),
        title: result.detail.title,
        summary: result.detail.summary,
        description: result.detail.description,
        category: result.detail.category,
        sourceOrganization: result.detail.sourceOrganization,
        sourceUrl: result.detail.sourceUrl ?? "",
        licenseName: result.detail.licenseName,
        licenseUrl: result.detail.licenseUrl ?? "",
        tags: result.detail.tags,
        ...(result.detail.periodStart
          ? { periodStart: result.detail.periodStart }
          : {}),
        ...(result.detail.periodEnd
          ? { periodEnd: result.detail.periodEnd }
          : {}),
        frequency: result.detail.frequency,
        mode: "draft",
      });
      setCsvText(result.detail.csvData);
      setIsEditing(true);
      setStep(0);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void loadWorkspace()
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Data penugasan dataset gagal dimuat.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadWorkspace]);

  function updateForm<K extends keyof DatasetSubmissionPayload>(
    key: K,
    value: DatasetSubmissionPayload[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectAssignment(key: string) {
    const assignment = assignments.find(
      (candidate) => assignmentKey(candidate) === key,
    );
    if (!assignment) return;
    setSelectedAssignmentKey(key);
    setForm((current) => ({
      ...EMPTY_FORM,
      submissionId: current.submissionId,
      assignmentType: assignment.assignmentType,
      agencyId: assignment.agencyId,
      regionId: assignment.regionId,
      regionName: assignment.regionName,
      sectorId: assignment.sectorId,
      referenceYear: assignment.referenceYear,
      ...(assignment.projectId ? { projectId: assignment.projectId } : {}),
      category: categoryForAssignment(assignment.assignmentType),
      mode: current.mode,
    }));
    setChecks([]);
  }

  function startNewSubmission() {
    setForm({
      ...EMPTY_FORM,
      assignmentType: currentAssignment?.assignmentType ?? "statistics",
      ...(currentAssignment
        ? {
            agencyId: currentAssignment.agencyId,
            regionId: currentAssignment.regionId,
            regionName: currentAssignment.regionName,
            sectorId: currentAssignment.sectorId,
            referenceYear: currentAssignment.referenceYear,
            ...(currentAssignment.projectId
              ? { projectId: currentAssignment.projectId }
              : {}),
            category: categoryForAssignment(currentAssignment.assignmentType),
          }
        : {}),
    });
    setCsvText("");
    setCsvFileName("");
    setStep(0);
    setChecks([]);
    setError("");
    setNotice("");
    setIsEditing(true);
  }

  async function editDraft(draft: DatasetSubmissionSummary) {
    setError("");
    try {
      await loadWorkspace(draft.id);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Draf dataset tidak dapat dimuat.",
      );
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (
      !file.name.toLocaleLowerCase("id-ID").endsWith(".csv") ||
      file.size < 1 ||
      file.size > MAX_FILE_BYTES
    ) {
      setError("Pilih berkas CSV berukuran 1 byte sampai 5 MB.");
      return;
    }
    try {
      const text = await file.text();
      setCsvText(text);
      setCsvFileName(file.name);
      setError("");
    } catch {
      setError("Berkas CSV tidak dapat dibaca sebagai teks.");
    }
  }

  async function importBps() {
    if (
      !currentAssignment ||
      currentAssignment.assignmentType !== "statistics"
    ) {
      setError("Pilih penugasan Statistik sebelum mengimpor data BPS.");
      return;
    }
    setIsImportingBps(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/asn/datasets/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agencyId: currentAssignment.agencyId,
          regionId: currentAssignment.regionId,
          sectorId: currentAssignment.sectorId,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(messageFromResponse(payload));
      const imported = payload as { imported?: boolean; message?: string };
      if (!imported.imported) {
        throw new Error(imported.message ?? "Sinkronisasi BPS tidak berhasil.");
      }
      setNotice(imported.message ?? "Dataset BPS berhasil dikirim.");
      await loadWorkspace();
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Gagal mengimpor data dari BPS.",
      );
    } finally {
      setIsImportingBps(false);
    }
  }

  async function saveSubmission(mode: "draft" | "submit") {
    if (!currentAssignment) {
      setError("Pilih penugasan yang menjadi tanggung jawab Anda.");
      return;
    }
    if (
      mode === "submit" &&
      SUBMISSION_CHECKS.some((check) => !checks.includes(check))
    ) {
      setError("Lengkapi semua pemeriksaan sebelum mengirim dataset.");
      setStep(4);
      return;
    }
    const payload = { ...form, mode };
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/asn/datasets/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payload, csvText }),
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(messageFromResponse(result));
      const saved = result as { status: "draft" | "submitted"; title: string };
      setNotice(
        saved.status === "submitted"
          ? "Dataset terkirim ke penugasan terkait dan siap ditinjau."
          : "Draf dataset berhasil disimpan.",
      );
      if (saved.status === "submitted") {
        setIsEditing(false);
        setForm({
          ...EMPTY_FORM,
          assignmentType: currentAssignment.assignmentType,
          agencyId: currentAssignment.agencyId,
          regionId: currentAssignment.regionId,
          regionName: currentAssignment.regionName,
          sectorId: currentAssignment.sectorId,
          referenceYear: currentAssignment.referenceYear,
          ...(currentAssignment.projectId
            ? { projectId: currentAssignment.projectId }
            : {}),
          category: categoryForAssignment(currentAssignment.assignmentType),
        });
        setCsvText("");
        setCsvFileName("");
      } else {
        const savedResult = result as { submissionId?: string };
        if (savedResult.submissionId) {
          setForm((current) => ({
            ...current,
            submissionId: savedResult.submissionId,
          }));
        }
      }
      await loadWorkspace();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Dataset gagal disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function closeEditor() {
    setIsEditing(false);
    setError("");
    setNotice("");
  }

  return (
    <section
      className="space-y-4"
      aria-labelledby="asn-dataset-workspace-title"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-muted-foreground text-xs">
            Beranda › Data Pemerintah › Katalog Dataset &amp; Metadata
          </p>
          <h1
            id="asn-dataset-workspace-title"
            className="mt-1 text-2xl font-bold tracking-tight"
          >
            Katalog Dataset &amp; Metadata Terbuka
          </h1>
          <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
            Input manual atau sinkronkan agregat BPS. Setiap dataset terikat
            pada instansi, wilayah, urusan, tahun, dan tanggung jawab akun.
          </p>
        </div>
        {!isEditing ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={importBps}
              disabled={
                isLoading ||
                isImportingBps ||
                !currentAssignment ||
                currentAssignment.assignmentType !== "statistics"
              }
            >
              <Database aria-hidden="true" className="size-4" />
              {isImportingBps ? "Mengimpor BPS..." : "Impor BPS"}
            </Button>
            <Button
              onClick={startNewSubmission}
              disabled={isLoading || !assignments.length}
            >
              <FileUp aria-hidden="true" className="size-4" />
              Tambah Dataset
            </Button>
          </div>
        ) : null}
      </header>

      {error ? (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {notice}
        </p>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="text-muted-foreground p-5 text-sm">
            Memuat penugasan dan dataset...
          </CardContent>
        </Card>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-sm">
            Belum ada penugasan statistik, APBD, atau proyek pada akun ini.
            Hubungi administrator untuk menetapkan tanggung jawab dataset.
          </CardContent>
        </Card>
      ) : isEditing ? (
        <Card>
          <CardHeader className="space-y-3 border-b">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs">
                  Ruang ASN / Dataset &amp; Metadata / Tambah Dataset
                </p>
                <CardTitle className="mt-1 text-xl">
                  {form.submissionId
                    ? "Lanjutkan Draf Dataset"
                    : "Tambah Dataset"}
                </CardTitle>
                <p className="text-muted-foreground mt-1 text-sm">
                  Lengkapi metadata, sumber data, cakupan, dan pemeriksaan
                  sebelum mengirim dataset ke penugasan.
                </p>
              </div>
              <Button variant="outline" onClick={closeEditor}>
                <ArrowLeft aria-hidden="true" className="size-4" />
                Kembali ke Katalog
              </Button>
            </div>
            <ol
              className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6"
              aria-label="Tahapan dataset"
            >
              {STEPS.map((label, index) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => setStep(index)}
                    aria-current={step === index ? "step" : undefined}
                    className={`w-full border-t-2 pt-2 text-left text-xs ${
                      step === index
                        ? "border-primary text-primary font-semibold"
                        : index < step
                          ? "border-emerald-500 text-emerald-700"
                          : "border-muted text-muted-foreground"
                    }`}
                  >
                    <span className="mr-1 tabular-nums">{index + 1}.</span>
                    {label}
                  </button>
                </li>
              ))}
            </ol>
          </CardHeader>
          <CardContent className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:p-6">
            <div className="space-y-5">
              {step === 0 ? (
                <section
                  className="space-y-4"
                  aria-labelledby="dataset-identity"
                >
                  <h2 id="dataset-identity" className="font-semibold">
                    01 · Identitas &amp; deskripsi dataset
                  </h2>
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium">Penugasan *</span>
                    <select
                      value={selectedAssignmentKey}
                      onChange={(event) => selectAssignment(event.target.value)}
                      className="bg-background h-10 w-full rounded-md border px-3"
                    >
                      {assignments.map((assignment) => (
                        <option
                          key={assignmentKey(assignment)}
                          value={assignmentKey(assignment)}
                        >
                          {assignmentLabel(assignment)}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted-foreground text-xs">
                      Kategori dataset ditetapkan dari jenis penugasan agar
                      tidak salah masuk ke APBD atau proyek.
                    </span>
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium">Judul dataset *</span>
                    <Input
                      value={form.title}
                      maxLength={255}
                      onChange={(event) =>
                        updateForm("title", event.target.value)
                      }
                      placeholder="Contoh: Realisasi Anggaran Pendidikan Tahun 2026"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium">Ringkasan singkat *</span>
                    <Input
                      value={form.summary}
                      maxLength={500}
                      onChange={(event) =>
                        updateForm("summary", event.target.value)
                      }
                      placeholder="Ringkasan isi dataset"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium">Deskripsi dataset *</span>
                    <Textarea
                      value={form.description}
                      maxLength={4000}
                      onChange={(event) =>
                        updateForm("description", event.target.value)
                      }
                      placeholder="Tujuan, cakupan, metodologi, dan batasan dataset"
                      className="min-h-28"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium">Kategori</span>
                      <Input value={form.category} readOnly />
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium">Tag metadata</span>
                      <Input
                        value={form.tags.join(", ")}
                        onChange={(event) =>
                          updateForm(
                            "tags",
                            event.target.value
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter(Boolean)
                              .slice(0, 20),
                          )
                        }
                        placeholder="Pendidikan, APBD, 2026"
                      />
                    </label>
                  </div>
                </section>
              ) : null}

              {step === 1 ? (
                <section className="space-y-4" aria-labelledby="dataset-source">
                  <h2 id="dataset-source" className="font-semibold">
                    02 · Produsen &amp; sumber data
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium">Produsen data *</span>
                      <Input
                        value={form.sourceOrganization}
                        maxLength={255}
                        onChange={(event) =>
                          updateForm("sourceOrganization", event.target.value)
                        }
                        placeholder="Nama instansi / produsen data"
                      />
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium">URL sumber</span>
                      <Input
                        type="url"
                        value={form.sourceUrl ?? ""}
                        onChange={(event) =>
                          updateForm("sourceUrl", event.target.value)
                        }
                        placeholder="https://..."
                      />
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium">Lisensi data *</span>
                      <Input
                        value={form.licenseName}
                        maxLength={160}
                        onChange={(event) =>
                          updateForm("licenseName", event.target.value)
                        }
                        placeholder="Contoh: Data terbuka pemerintah daerah"
                      />
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium">URL lisensi</span>
                      <Input
                        type="url"
                        value={form.licenseUrl ?? ""}
                        onChange={(event) =>
                          updateForm("licenseUrl", event.target.value)
                        }
                        placeholder="https://..."
                      />
                    </label>
                  </div>
                  <div className="space-y-2 rounded-lg border border-dashed p-4">
                    <label className="block space-y-1.5 text-sm">
                      <span className="font-medium">
                        Berkas sumber (CSV UTF-8) *
                      </span>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(event) =>
                          void handleFile(event.target.files?.[0])
                        }
                        className="file:bg-background block w-full text-sm file:mr-3 file:rounded-md file:border file:px-3 file:py-2"
                      />
                    </label>
                    {csvFileName ? (
                      <p className="text-muted-foreground text-xs">
                        {csvFileName} ·{" "}
                        {(new Blob([csvText]).size / 1024).toFixed(1)} KB
                      </p>
                    ) : null}
                    <label className="block space-y-1.5 text-sm">
                      <span className="font-medium">
                        Atau input manual data CSV *
                      </span>
                      <Textarea
                        value={csvText}
                        onChange={(event) => {
                          setCsvText(event.target.value);
                          setCsvFileName("");
                        }}
                        placeholder={"kode_wilayah,tahun,nilai\n3201,2026,100"}
                        className="min-h-32 font-mono text-xs"
                      />
                    </label>
                    <p className="text-muted-foreground text-xs">
                      Maksimal 5 MB, 100 kolom, dan 10.000 baris. Nilai mentah
                      hanya dapat dibaca oleh operator sesuai penugasannya.
                    </p>
                  </div>
                </section>
              ) : null}

              {step === 2 ? (
                <section
                  className="space-y-4"
                  aria-labelledby="dataset-coverage"
                >
                  <h2 id="dataset-coverage" className="font-semibold">
                    03 · Cakupan, periode &amp; frekuensi
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium">Tahun referensi *</span>
                      <Input
                        type="number"
                        min={2000}
                        max={2100}
                        value={form.referenceYear}
                        onChange={(event) =>
                          updateForm(
                            "referenceYear",
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium">Wilayah / cakupan *</span>
                      <Input
                        value={
                          currentAssignment?.assignmentType === "project"
                            ? currentAssignment.regionName
                            : `${form.regionName} (${form.regionId})`
                        }
                        readOnly
                      />
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium">Periode mulai</span>
                      <Input
                        type="date"
                        value={form.periodStart ?? ""}
                        onChange={(event) =>
                          updateForm(
                            "periodStart",
                            event.target.value || undefined,
                          )
                        }
                      />
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium">Periode akhir</span>
                      <Input
                        type="date"
                        value={form.periodEnd ?? ""}
                        onChange={(event) =>
                          updateForm(
                            "periodEnd",
                            event.target.value || undefined,
                          )
                        }
                      />
                    </label>
                    <label className="space-y-1.5 text-sm sm:col-span-2">
                      <span className="font-medium">
                        Frekuensi pemutakhiran *
                      </span>
                      <select
                        value={form.frequency}
                        onChange={(event) =>
                          updateForm(
                            "frequency",
                            event.target
                              .value as DatasetSubmissionPayload["frequency"],
                          )
                        }
                        className="bg-background h-10 w-full rounded-md border px-3"
                      >
                        <option value="monthly">Bulanan</option>
                        <option value="quarterly">Triwulanan</option>
                        <option value="annual">Tahunan</option>
                        <option value="irregular">Tidak berkala</option>
                      </select>
                    </label>
                  </div>
                  <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
                    Data ini akan ditautkan hanya pada penugasan{" "}
                    {currentAssignment
                      ? assignmentLabel(currentAssignment)
                      : "yang dipilih"}{" "}
                    dan tahun yang dipilih.
                  </p>
                </section>
              ) : null}

              {step === 3 ? (
                <section
                  className="space-y-4"
                  aria-labelledby="dataset-dictionary"
                >
                  <h2 id="dataset-dictionary" className="font-semibold">
                    04 · Kamus data, lisensi &amp; akses
                  </h2>
                  {headers.length ? (
                    <div className="overflow-x-auto rounded-md border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-2">Nama kolom</th>
                            <th className="p-2">Tipe data</th>
                            <th className="p-2">Deskripsi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {headers.map((header) => (
                            <tr key={header} className="border-t">
                              <th scope="row" className="p-2 font-medium">
                                {header}
                              </th>
                              <td className="text-muted-foreground p-2">
                                Otomatis dari isi CSV
                              </td>
                              <td className="p-2">
                                Kolom {header} pada dataset{" "}
                                {form.title || "baru"}.
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p role="status" className="rounded-lg border p-4 text-sm">
                      Masukkan berkas atau teks CSV pada langkah sebelumnya
                      untuk membentuk kamus data otomatis.
                    </p>
                  )}
                  <p className="text-muted-foreground rounded-md border p-3 text-xs">
                    Kamus data dibuat dari header dan isi berkas oleh parser
                    server. Data tidak dipublikasikan langsung; pengajuan
                    disimpan untuk ditinjau dan tetap dibatasi oleh hak
                    penugasan.
                  </p>
                </section>
              ) : null}

              {step === 4 ? (
                <section className="space-y-3" aria-labelledby="dataset-review">
                  <h2 id="dataset-review" className="font-semibold">
                    05 · Pemeriksaan sebelum pengajuan
                  </h2>
                  {SUBMISSION_CHECKS.map((label) => (
                    <label
                      key={label}
                      className="flex gap-3 rounded-md border p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checks.includes(label)}
                        onChange={(event) =>
                          setChecks((current) =>
                            event.target.checked
                              ? [...current, label]
                              : current.filter((value) => value !== label),
                          )
                        }
                        className="mt-0.5"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                  <p className="text-muted-foreground rounded-md border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900 dark:bg-amber-950/30">
                    Data yang dikirim terkunci. Koreksi dilakukan melalui draf
                    baru pada penugasan yang sama.
                  </p>
                </section>
              ) : null}

              {step === 5 ? (
                <section className="space-y-4" aria-labelledby="dataset-submit">
                  <h2 id="dataset-submit" className="font-semibold">
                    06 · Ringkasan &amp; pengiriman
                  </h2>
                  <dl className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Judul</dt>
                      <dd className="font-medium">
                        {form.title || "Belum diisi"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Kategori</dt>
                      <dd>{form.category}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Penugasan</dt>
                      <dd>
                        {currentAssignment
                          ? assignmentLabel(currentAssignment)
                          : "Belum dipilih"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Periode</dt>
                      <dd>
                        {form.periodStart || "—"} sampai {form.periodEnd || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Baris data</dt>
                      <dd>
                        {Math.max(
                          0,
                          csvText.trim().split(/\r?\n/).filter(Boolean).length -
                            1,
                        ).toLocaleString("id-ID")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Format</dt>
                      <dd>CSV · {headers.length} kolom</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => void saveSubmission("draft")}
                      disabled={isSaving}
                    >
                      <Save aria-hidden="true" className="size-4" />
                      {isSaving ? "Menyimpan..." : "Simpan Draf"}
                    </Button>
                    <Button
                      onClick={() => void saveSubmission("submit")}
                      disabled={isSaving}
                    >
                      <Send aria-hidden="true" className="size-4" />
                      {isSaving ? "Mengirim..." : "Ajukan Dataset"}
                    </Button>
                  </div>
                </section>
              ) : null}

              <div className="flex justify-between border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  disabled={step === 0}
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Sebelumnya
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button
                    onClick={() =>
                      setStep((current) =>
                        Math.min(STEPS.length - 1, current + 1),
                      )
                    }
                  >
                    Lanjut
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>

            <aside className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Kelengkapan pengajuan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-2xl font-bold">{step + 1} dari 6</p>
                  {STEPS.map((label, index) => (
                    <p key={label} className="flex items-center gap-2 text-xs">
                      {index < step ? (
                        <Check
                          aria-hidden="true"
                          className="size-3 text-emerald-600"
                        />
                      ) : (
                        <span className="text-muted-foreground">
                          {index + 1}.
                        </span>
                      )}
                      <span className={index === step ? "font-semibold" : ""}>
                        {label}
                      </span>
                    </p>
                  ))}
                </CardContent>
              </Card>
              <Card className="bg-blue-50/60 dark:bg-blue-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Alur menuju publikasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p>01 · Operator ASN menyiapkan metadata dan sumber.</p>
                  <p>02 · Penugasan dan cakupan diverifikasi di server.</p>
                  <p>
                    03 · Dataset masuk ke APBD/proyek terkait dan menunggu
                    tinjauan.
                  </p>
                </CardContent>
              </Card>
            </aside>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-col gap-3 rounded-lg border bg-white p-3 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline">
                {assignments.length} penugasan dataset
              </Badge>
              <Badge variant="secondary">{drafts.length} draf</Badge>
              <Badge variant="secondary">{submitted.length} terkirim</Badge>
            </div>
            <label className="flex items-center gap-2 text-xs sm:min-w-[26rem]">
              <span className="text-muted-foreground shrink-0">
                Penugasan aktif
              </span>
              <select
                aria-label="Pilih penugasan dataset"
                value={selectedAssignmentKey}
                onChange={(event) => selectAssignment(event.target.value)}
                className="bg-background h-9 min-w-0 flex-1 rounded-md border px-3 text-xs"
              >
                {assignments.map((assignment) => (
                  <option
                    key={assignmentKey(assignment)}
                    value={assignmentKey(assignment)}
                  >
                    {assignmentLabel(assignment)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <details className="rounded-lg border bg-white px-3 py-2 text-sm dark:bg-slate-900">
            <summary className="cursor-pointer text-xs font-medium">
              Dataset saya · Draf &amp; terkirim
            </summary>
            <div className="space-y-2 pt-3">
              {drafts.length + submitted.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  Belum ada dataset pada penugasan akun Anda.
                </p>
              ) : (
                [...drafts, ...submitted].slice(0, 5).map((submission) => (
                  <div
                    key={submission.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">
                        {submission.title}
                      </p>
                      <p className="text-muted-foreground text-[10px]">
                        {summaryForSubmission(submission)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        submission.status === "submitted"
                          ? "default"
                          : "outline"
                      }
                    >
                      {submission.status === "submitted" ? "Terkirim" : "Draf"}
                    </Badge>
                    {submission.status === "draft" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void editDraft(submission)}
                      >
                        Lanjutkan
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
              {drafts.length + submitted.length > 5 ? (
                <p className="text-muted-foreground text-xs">
                  Menampilkan 5 dari {drafts.length + submitted.length}{" "}
                  pengajuan.
                </p>
              ) : null}
              <p className="text-muted-foreground text-xs">
                Data yang dikirim hanya dapat diakses dalam konteks tanggung
                jawab ini. Pengiriman tidak akan mengubah angka APBD atau
                progres proyek secara otomatis.
              </p>
            </div>
          </details>
        </div>
      )}
    </section>
  );
}
