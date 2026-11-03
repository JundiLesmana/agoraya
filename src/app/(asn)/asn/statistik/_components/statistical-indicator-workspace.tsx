"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileUp,
  LockKeyhole,
  Save,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  STATISTIC_SECTORS,
  statisticSaveResponseSchema,
  statisticWorkspaceResponseSchema,
  type StatisticAssignment,
  type StatisticEntryView,
  type StatisticPeriodType,
  type StatisticWorkspaceResponse,
} from "@/modules/statistics-input";
import {
  detectStatisticAnomalies,
  formatStatisticValue,
} from "@/modules/statistics-input";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

interface GridValue {
  readonly periodValue: string;
  readonly value: string;
  readonly explanation: string;
}

function periodRows(
  periodType: StatisticPeriodType,
  year: number,
): GridValue[] {
  const periods =
    periodType === "monthly"
      ? MONTHS.map((_, index) => String(index + 1).padStart(2, "0"))
      : periodType === "quarterly"
        ? ["Q1", "Q2", "Q3", "Q4"]
        : [String(year)];
  return periods.map((periodValue) => ({
    periodValue,
    value: "",
    explanation: "",
  }));
}

function periodLabel(periodType: StatisticPeriodType, value: string): string {
  if (periodType === "monthly") {
    const monthIndex = Number(value) - 1;
    return MONTHS.at(monthIndex) ?? value;
  }
  if (periodType === "quarterly") return `Triwulan ${value.slice(1)}`;
  return value;
}

function formatFileSize(fileSize: number): string {
  return (
    new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 1,
    }).format(fileSize / 1024) + " KB"
  );
}

function mergeEntryValues(
  periodType: StatisticPeriodType,
  year: number,
  entry: StatisticEntryView | null,
): GridValue[] {
  const rows = periodRows(periodType, year);
  return rows.map((row) => {
    const saved = entry?.values.find(
      (item) => item.periodValue === row.periodValue,
    );
    return saved
      ? {
          periodValue: row.periodValue,
          value: String(saved.value),
          explanation: saved.explanation,
        }
      : row;
  });
}

function responseError(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return "Permintaan tidak dapat diproses. Silakan coba kembali.";
}

export function StatisticalIndicatorWorkspace() {
  const [workspace, setWorkspace] = useState<StatisticWorkspaceResponse | null>(
    null,
  );
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [regionId, setRegionId] = useState("");
  const [sectorId, setSectorId] =
    useState<StatisticAssignment["sectorId"]>("economy");
  const [indicatorId, setIndicatorId] = useState("");
  const [entry, setEntry] = useState<StatisticEntryView | null>(null);
  const [values, setValues] = useState<GridValue[]>([]);
  const [sourceName, setSourceName] = useState("");
  const [methodology, setMethodology] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const entryRequestId = useRef(0);

  const years = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) =>
        String(new Date().getFullYear() - index),
      ),
    [],
  );
  const regionOptions = useMemo(() => {
    const regions = new Map<string, string>();
    for (const assignment of workspace?.assignments ?? []) {
      regions.set(assignment.regionId, assignment.regionName);
    }
    return [...regions].map(([value, label]) => ({ value, label }));
  }, [workspace]);
  const sectorOptions = useMemo(() => {
    const allowed = new Set(
      (workspace?.assignments ?? [])
        .filter((assignment) => assignment.regionId === regionId)
        .map((assignment) => assignment.sectorId),
    );
    return STATISTIC_SECTORS.filter((sector) => allowed.has(sector.id)).map(
      ({ id, label }) => ({ value: id, label }),
    );
  }, [regionId, workspace]);
  const indicatorOptions = useMemo(
    () =>
      (workspace?.indicators ?? [])
        .filter((indicator) => indicator.sectorId === sectorId)
        .map((indicator) => ({
          value: indicator.id,
          label: indicator.name,
        })),
    [sectorId, workspace],
  );
  const selectedIndicator = workspace?.indicators.find(
    (indicator) => indicator.id === indicatorId,
  );
  const selectedAssignment = workspace?.assignments.find(
    (assignment) =>
      assignment.regionId === regionId && assignment.sectorId === sectorId,
  );
  const locked = entry?.status === "published";

  const loadEntry = useCallback(
    async (context: {
      readonly referenceYear: number;
      readonly regionId: string;
      readonly sectorId: StatisticAssignment["sectorId"];
      readonly indicatorId: string;
    }) => {
      const requestId = entryRequestId.current + 1;
      entryRequestId.current = requestId;
      setLoadingEntry(true);
      setError(null);
      try {
        const query = new URLSearchParams({
          referenceYear: String(context.referenceYear),
          regionId: context.regionId,
          sectorId: context.sectorId,
          indicatorId: context.indicatorId,
        });
        const response = await fetch(`/api/asn/statistik?${query}`);
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(responseError(payload));
        const parsed = statisticWorkspaceResponseSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error("Data ruang statistik yang diterima tidak valid.");
        }
        if (requestId !== entryRequestId.current) return;
        const nextEntry = parsed.data.entry;
        const indicator = parsed.data.indicators.find(
          (item) => item.id === context.indicatorId,
        );
        if (!indicator) {
          throw new Error("Definisi indikator tidak tersedia.");
        }
        setEntry(nextEntry);
        setValues(
          mergeEntryValues(
            indicator.periodType,
            context.referenceYear,
            nextEntry,
          ),
        );
        setSourceName(nextEntry?.sourceName ?? "");
        setMethodology(nextEntry?.methodology ?? "");
        setFiles([]);
      } catch (loadError) {
        if (requestId !== entryRequestId.current) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Data statistik tidak dapat dimuat.",
        );
      } finally {
        if (requestId === entryRequestId.current) setLoadingEntry(false);
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;
    async function loadWorkspace() {
      try {
        const response = await fetch("/api/asn/statistik");
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(responseError(payload));
        const parsed = statisticWorkspaceResponseSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error("Data ruang statistik yang diterima tidak valid.");
        }
        if (!active) return;
        setWorkspace(parsed.data);
        const firstAssignment = parsed.data.assignments[0];
        if (firstAssignment) {
          setRegionId(firstAssignment.regionId);
          setSectorId(firstAssignment.sectorId);
          const firstIndicator = parsed.data.indicators.find(
            (indicator) => indicator.sectorId === firstAssignment.sectorId,
          );
          if (firstIndicator) setIndicatorId(firstIndicator.id);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Data ruang statistik tidak dapat dimuat.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadWorkspace();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!regionOptions.some((option) => option.value === regionId)) {
      const firstAssignment = workspace?.assignments[0];
      if (firstAssignment) {
        setRegionId(firstAssignment.regionId);
        setSectorId(firstAssignment.sectorId);
      }
    }
  }, [regionId, regionOptions, workspace]);

  useEffect(() => {
    if (!sectorOptions.some((option) => option.value === sectorId)) {
      const firstSector = sectorOptions[0]?.value;
      if (firstSector) {
        const validSector = STATISTIC_SECTORS.find(
          (sector) => sector.id === firstSector,
        );
        if (validSector) setSectorId(validSector.id);
      }
    }
  }, [sectorId, sectorOptions]);

  useEffect(() => {
    if (!indicatorOptions.some((option) => option.value === indicatorId)) {
      setIndicatorId(indicatorOptions[0]?.value ?? "");
    }
  }, [indicatorId, indicatorOptions]);

  useEffect(() => {
    if (!selectedIndicator || !selectedAssignment || !year) return;
    void loadEntry({
      referenceYear: Number(year),
      regionId,
      sectorId,
      indicatorId: selectedIndicator.id,
    });
  }, [
    indicatorId,
    loadEntry,
    regionId,
    sectorId,
    selectedAssignment,
    selectedIndicator,
    year,
  ]);

  const anomalies = useMemo(() => {
    if (!selectedIndicator) return [];
    return detectStatisticAnomalies(
      selectedIndicator.periodType,
      values
        .filter((row) => row.value !== "" && Number.isFinite(Number(row.value)))
        .map((row) => ({
          periodValue: row.periodValue,
          value: Number(row.value),
          explanation: row.explanation,
        })),
    );
  }, [selectedIndicator, values]);
  const anomalyPeriods = useMemo(
    () => new Set(anomalies.map((anomaly) => anomaly.periodValue)),
    [anomalies],
  );

  function updateValue(
    periodValue: string,
    field: "value" | "explanation",
    nextValue: string,
  ) {
    setValues((current) =>
      current.map((row) =>
        row.periodValue === periodValue
          ? {
              ...row,
              value: field === "value" ? nextValue : row.value,
              explanation:
                field === "explanation" ? nextValue : row.explanation,
            }
          : row,
      ),
    );
  }

  async function save(status: "draft" | "published") {
    if (!selectedIndicator || !selectedAssignment) {
      setError("Indikator atau wilayah belum tersedia untuk akun ini.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const rows = values
        .filter((row) => row.value.trim() !== "")
        .map((row) => ({
          periodValue: row.periodValue,
          value: Number(row.value),
          explanation: row.explanation.trim(),
        }));
      if (rows.length === 0) {
        throw new Error("Isi minimal satu nilai realisasi sebelum menyimpan.");
      }
      if (status === "published" && !sourceName.trim()) {
        throw new Error("Sumber data wajib diisi sebelum publikasi.");
      }
      if (status === "published" && !methodology.trim()) {
        throw new Error("Metodologi wajib diisi sebelum publikasi.");
      }
      const formData = new FormData();
      formData.set(
        "payload",
        JSON.stringify({
          referenceYear: Number(year),
          regionId,
          sectorId,
          indicatorId: selectedIndicator.id,
          periodType: selectedIndicator.periodType,
          status,
          sourceName,
          methodology,
          values: rows,
        }),
      );
      for (const file of files) formData.append("documents", file);

      const response = await fetch("/api/asn/statistik", {
        method: "POST",
        body: formData,
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(responseError(payload));
      const result = statisticSaveResponseSchema.safeParse(payload);
      if (!result.success) {
        throw new Error("Respons penyimpanan statistik tidak valid.");
      }
      setNotice(
        status === "published"
          ? "Data berhasil dipublikasikan dan kini terkunci untuk perubahan biasa."
          : "Draf statistik berhasil disimpan.",
      );
      await loadEntry({
        referenceYear: Number(year),
        regionId,
        sectorId,
        indicatorId: selectedIndicator.id,
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Data statistik gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (chosen.length + (entry?.documents.length ?? 0) > 5) {
      setError("Maksimal 5 dokumen pendukung.");
      return;
    }
    if (
      chosen.some(
        (file) =>
          file.size > 10 * 1024 * 1024 || !/\.(pdf|xls|xlsx)$/i.test(file.name),
      )
    ) {
      setError(
        "Dokumen harus berformat PDF, XLS, atau XLSX dan maksimal 10 MB.",
      );
      return;
    }
    setError(null);
    setFiles((current) => [...current, ...chosen]);
  }

  if (loading) {
    return (
      <div className="space-y-5" aria-label="Memuat ruang input statistik">
        <div className="bg-muted h-5 w-56 animate-pulse rounded" />
        <div className="bg-muted h-10 w-80 animate-pulse rounded" />
        <div className="bg-muted h-52 animate-pulse rounded-xl" />
        <div className="bg-muted h-80 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div
        role="alert"
        className="border-destructive/30 bg-destructive/5 space-y-4 rounded-xl border p-6"
      >
        <h1 className="text-xl font-semibold">
          Ruang input statistik belum tersedia
        </h1>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button onClick={() => window.location.reload()}>Muat ulang</Button>
      </div>
    );
  }

  if (!workspace?.assignments.length) {
    return (
      <div className="space-y-5">
        <PageHeading />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <LockKeyhole
              className="text-muted-foreground size-8"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold">
              Akses wilayah belum ditetapkan
            </h2>
            <p className="text-muted-foreground max-w-xl text-sm">
              Belum ada wilayah dan sektor yang ditautkan ke akun Anda. Hubungi
              administrator untuk menyiapkan assignment operator statistik.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedRegion =
    regionOptions.find((option) => option.value === regionId)?.label ?? "";
  const activeYear = Number(year);

  return (
    <div className="space-y-6">
      <PageHeading />

      {error ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm"
        >
          {error}
        </div>
      ) : null}
      {notice ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300"
        >
          {notice}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <SectionTitle
            number="01"
            title="Konteks wilayah & pemilihan indikator"
          />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm font-medium">
            Tahun acuan
            <Select
              aria-label="Tahun acuan"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              disabled={saving}
              options={years.map((value) => ({
                value,
                label: `${value}${value === String(new Date().getFullYear()) ? " (Tahun Berjalan)" : ""}`,
              }))}
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Wilayah kerja
            <Select
              aria-label="Wilayah kerja yang diizinkan"
              value={regionId}
              onChange={(event) => setRegionId(event.target.value)}
              options={regionOptions}
              disabled={saving || regionOptions.length < 2}
            />
            <span className="text-muted-foreground block text-xs font-normal">
              Pilihan dibatasi sesuai assignment akses akun.
            </span>
          </label>
          <label className="space-y-2 text-sm font-medium">
            Kategori / sektor statistik
            <Select
              aria-label="Kategori sektor statistik"
              value={sectorId}
              onChange={(event) => {
                if (saving) return;
                const nextSector = STATISTIC_SECTORS.find(
                  (sector) => sector.id === event.target.value,
                );
                if (nextSector) setSectorId(nextSector.id);
              }}
              options={sectorOptions}
              disabled={saving}
            />
          </label>
          <label className="space-y-2 text-sm font-medium md:col-span-3">
            Cari / pilih indikator
            <Select
              aria-label="Pilih indikator statistik"
              value={indicatorId}
              onChange={(event) => setIndicatorId(event.target.value)}
              options={indicatorOptions}
              placeholder="Pilih indikator"
              disabled={saving}
            />
          </label>
        </CardContent>
      </Card>

      {selectedIndicator ? (
        <>
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <SectionTitle
                number="02"
                title="Metadata & spesifikasi indikator"
              />
              <Badge variant="outline">Metadata indikator</Badge>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <Metadata label="Nama indikator" value={selectedIndicator.name} />
              <Metadata label="Satuan" value={selectedIndicator.unit} />
              <Metadata
                label="Definisi konseptual"
                value={selectedIndicator.definition}
              />
              <Metadata
                label="Frekuensi pelaporan"
                value={selectedIndicator.frequency}
              />
              <Metadata label="Wilayah terotorisasi" value={selectedRegion} />
              <Metadata
                label="Sektor"
                value={
                  sectorOptions.find((item) => item.value === sectorId)
                    ?.label ?? ""
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <SectionTitle
                  number="03"
                  title={`Matriks entri deret waktu (${selectedIndicator.frequency})`}
                />
                <p className="text-muted-foreground text-xs">
                  Masukkan nilai realisasi untuk setiap periode. Nilai tersimpan
                  dalam draf hingga dipublikasikan.
                </p>
              </div>
              {entry?.status ? (
                <Badge
                  variant={
                    entry.status === "published" ? "default" : "secondary"
                  }
                >
                  {entry.status === "published" ? "Dipublikasikan" : "Draf"}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {anomalies.length ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" />
                  <span>
                    Perubahan nilai lebih dari 50% pada{" "}
                    {anomalies
                      .map((anomaly) =>
                        periodLabel(
                          selectedIndicator.periodType,
                          anomaly.periodValue,
                        ),
                      )
                      .join(", ")}{" "}
                    memerlukan catatan penjelasan.
                  </span>
                </div>
              ) : null}
              {loadingEntry ? (
                <div
                  className="bg-muted h-44 animate-pulse rounded-lg"
                  aria-label="Memuat data periode"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-y">
                        <th className="px-3 py-3 font-semibold">Periode</th>
                        <th className="px-3 py-3 font-semibold">
                          Nilai realisasi
                        </th>
                        <th className="px-3 py-3 font-semibold">
                          Status baris
                        </th>
                        <th className="px-3 py-3 font-semibold">
                          Catatan khusus / anomali
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {values.map((row) => {
                        const flagged = anomalyPeriods.has(row.periodValue);
                        return (
                          <tr
                            key={row.periodValue}
                            className="border-b align-top"
                          >
                            <th scope="row" className="px-3 py-3 font-medium">
                              <span className="block">
                                {periodLabel(
                                  selectedIndicator.periodType,
                                  row.periodValue,
                                )}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {activeYear}
                              </span>
                            </th>
                            <td className="px-3 py-3">
                              <label className="sr-only">
                                Nilai realisasi{" "}
                                {periodLabel(
                                  selectedIndicator.periodType,
                                  row.periodValue,
                                )}
                              </label>
                              <Input
                                aria-label={`Nilai realisasi ${periodLabel(selectedIndicator.periodType, row.periodValue)}`}
                                type="number"
                                min="0"
                                step="any"
                                value={row.value}
                                disabled={locked || loadingEntry || saving}
                                onChange={(event) =>
                                  updateValue(
                                    row.periodValue,
                                    "value",
                                    event.target.value,
                                  )
                                }
                                className="max-w-40"
                              />
                            </td>
                            <td className="px-3 py-3">
                              {row.value ? (
                                <Badge variant="outline" className="gap-1">
                                  <CheckCircle2
                                    aria-hidden="true"
                                    className="size-3"
                                  />
                                  Terisi
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Belum lengkap</Badge>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <Input
                                aria-label={`Catatan periode ${periodLabel(selectedIndicator.periodType, row.periodValue)}`}
                                value={row.explanation}
                                onChange={(event) =>
                                  updateValue(
                                    row.periodValue,
                                    "explanation",
                                    event.target.value,
                                  )
                                }
                                disabled={locked || loadingEntry || saving}
                                placeholder={
                                  flagged
                                    ? "Wajib: jelaskan perubahan >50%"
                                    : "Opsional"
                                }
                                className={
                                  flagged
                                    ? "border-amber-500 focus-visible:ring-amber-500"
                                    : ""
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {selectedIndicator ? (
                <p className="text-muted-foreground text-xs">
                  Nilai ditampilkan dengan satuan {selectedIndicator.unit}.
                  Contoh format:{" "}
                  {formatStatisticValue(1234.5, selectedIndicator.precision)}.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionTitle
                number="04"
                title="Sumber data, metodologi & dokumen pendukung"
              />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  Sumber data resmi <span className="text-destructive">*</span>
                  <Input
                    value={sourceName}
                    onChange={(event) => setSourceName(event.target.value)}
                    disabled={locked || saving}
                    maxLength={255}
                    placeholder="Contoh: BPS Provinsi Jawa Barat"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Metodologi pengumpulan{" "}
                  <span className="text-destructive">*</span>
                  <Textarea
                    value={methodology}
                    onChange={(event) => setMethodology(event.target.value)}
                    disabled={locked || saving}
                    maxLength={10000}
                    rows={4}
                    placeholder="Jelaskan metode, cakupan, dan periode pengumpulan data."
                  />
                </label>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="supporting-documents"
                  className="text-sm font-medium"
                >
                  Unggah dokumen pendukung{" "}
                  <span className="text-muted-foreground font-normal">
                    (PDF / Excel, maks. 5 berkas, 10 MB per berkas)
                  </span>
                </label>
                <div className="border-border bg-muted/20 rounded-lg border border-dashed p-5">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <FileUp
                      className="text-muted-foreground size-6"
                      aria-hidden="true"
                    />
                    <p className="text-sm">
                      Pilih dokumen verifikasi atau lampiran metodologi.
                    </p>
                    <Input
                      id="supporting-documents"
                      type="file"
                      accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      multiple
                      disabled={locked || saving}
                      onChange={handleFileChange}
                      className="max-w-md"
                    />
                    <p className="text-muted-foreground text-xs">
                      Isi berkas diperiksa di server sebelum diunggah.
                    </p>
                  </div>
                </div>
                {entry?.documents.map((document) => (
                  <div
                    key={document.id}
                    className="bg-muted/40 flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm"
                  >
                    <a
                      className="truncate underline underline-offset-2"
                      href={`/api/asn/statistik/documents/${document.id}`}
                    >
                      {document.originalName}
                    </a>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {formatFileSize(document.fileSize)} · tersimpan
                    </span>
                  </div>
                ))}
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="bg-muted/40 flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      className="text-destructive text-xs underline"
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <SectionTitle number="05" title="Riwayat input & jejak audit" />
              <Badge variant="outline">Log perubahan nilai</Badge>
            </CardHeader>
            <CardContent>
              {!entry?.history.length ? (
                <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
                  <Clock3 className="size-4" aria-hidden="true" />
                  Belum ada perubahan nilai yang tercatat.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b text-xs">
                        <th className="px-3 py-2 font-medium">Waktu</th>
                        <th className="px-3 py-2 font-medium">Petugas</th>
                        <th className="px-3 py-2 font-medium">Periode</th>
                        <th className="px-3 py-2 font-medium">
                          Nilai sebelumnya → baru
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.history.map((item, index) => (
                        <tr
                          key={`${item.changedAt}-${item.periodValue}-${index}`}
                          className="border-b last:border-0"
                        >
                          <td className="px-3 py-3">
                            {new Intl.DateTimeFormat("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(item.changedAt))}
                          </td>
                          <td className="px-3 py-3">{item.actorName}</td>
                          <td className="px-3 py-3">
                            {periodLabel(
                              selectedIndicator.periodType,
                              item.periodValue,
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {item.previousValue === null
                              ? "Nilai baru"
                              : formatStatisticValue(
                                  item.previousValue,
                                  selectedIndicator.precision,
                                )}{" "}
                            →{" "}
                            {formatStatisticValue(
                              item.newValue,
                              selectedIndicator.precision,
                            )}{" "}
                            {selectedIndicator.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-muted/30 flex flex-col-reverse justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
            <p className="text-muted-foreground max-w-2xl text-xs">
              Setiap perubahan angka dicatat dalam log audit. Data terpublikasi
              terkunci dan hanya dapat diubah melalui alur revisi.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              {locked ? (
                <Badge variant="outline" className="gap-1 px-3 py-2">
                  <LockKeyhole className="size-3.5" aria-hidden="true" />
                  Terkunci · perlu revisi
                </Badge>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => void save("draft")}
                    disabled={saving || loadingEntry}
                    loading={saving}
                  >
                    <Save aria-hidden="true" className="size-4" />
                    Simpan Draf
                  </Button>
                  <Button
                    onClick={() => void save("published")}
                    disabled={saving || loadingEntry}
                    loading={saving}
                  >
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                    Publikasikan
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function PageHeading() {
  return (
    <header className="space-y-2">
      <nav aria-label="Breadcrumb" className="text-muted-foreground text-xs">
        Data Pemerintah <span aria-hidden="true">›</span> Statistik{" "}
        <span aria-hidden="true">›</span>{" "}
        <span className="text-foreground">Input Indikator</span>
      </nav>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Input & riwayat indikator statistik
          </h1>
          <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
            Kelola data deret waktu, metadata, sumber, dan dokumen pendukung
            sebelum dipublikasikan.
          </p>
        </div>
        <Badge variant="outline">Ruang kerja operator</Badge>
      </div>
    </header>
  );
}

function SectionTitle({
  number,
  title,
}: {
  readonly number: string;
  readonly title: string;
}) {
  return (
    <CardTitle className="text-base">
      <span className="text-primary mr-2 text-xs font-bold">{number}.</span>
      {title}
    </CardTitle>
  );
}

function Metadata({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
