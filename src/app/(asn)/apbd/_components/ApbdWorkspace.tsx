"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Clock3,
  Plus,
  Save,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatasetSourcePicker } from "../../_components/dataset-source-picker";
import {
  APBD_PERIODS,
  apbdWorkspaceResponseSchema,
  type ApbdAssignment,
  type ApbdPeriodValue,
  type ApbdWorkspaceResponse,
} from "@/modules/apbd-budget/contract";
import {
  apbdCsvTemplate,
  calculateApbdTotals,
  formatApbdPercent,
  formatRupiahInteger,
  parseApbdCsv,
  parseRupiahInteger,
  serializeApbdCsv,
} from "@/modules/apbd-budget/domain";

type PeriodKey = (typeof APBD_PERIODS)[number]["value"];
type EditablePeriod = { pagu: string; realisasi: string };
type EditableItem = {
  id: string | null;
  code: string;
  programName: string;
  subactivityName: string;
  periods: Record<PeriodKey, EditablePeriod>;
};

function emptyPeriods(): Record<PeriodKey, EditablePeriod> {
  return {
    Q1: { pagu: "", realisasi: "" },
    Q2: { pagu: "", realisasi: "" },
    Q3: { pagu: "", realisasi: "" },
    Q4: { pagu: "", realisasi: "" },
  };
}

function isPeriodKey(value: string): value is PeriodKey {
  return APBD_PERIODS.some((period) => period.value === value);
}

function parseForDisplay(value: string): string | null {
  try {
    return parseRupiahInteger(value);
  } catch {
    return null;
  }
}

function toEditableItems(
  entry: ApbdWorkspaceResponse["entry"],
): EditableItem[] {
  return entry?.items.map((item) => {
    const periods = emptyPeriods();
    for (const { value } of APBD_PERIODS) {
      const saved = item.periods.find((period) => period.periodValue === value);
      periods[value] = {
        pagu: saved?.pagu ?? "",
        realisasi: saved?.realisasi ?? "",
      };
    }
    return {
      id: item.id,
      code: item.code,
      programName: item.programName,
      subactivityName: item.subactivityName,
      periods,
    };
  }) ?? [];
}

function toPeriodValues(
  periods: Record<PeriodKey, EditablePeriod>,
): ApbdPeriodValue[] {
  return APBD_PERIODS.map(({ value }) => ({
    periodType: "quarterly" as const,
    periodValue: value,
    pagu: parseRupiahInteger(periods[value].pagu),
    realisasi: parseRupiahInteger(periods[value].realisasi),
  }));
}

function apiError(payload: unknown): string {
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

function makeContextQuery(
  year: string,
  agencyId: string,
  regionId: string,
  sectorId: string,
): string {
  return new URLSearchParams({
    referenceYear: year,
    agencyId,
    regionId,
    sectorId,
  }).toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatRowErrors(payload: unknown): string[] {
  if (!isRecord(payload) || !Array.isArray(payload.rowErrors)) return [];
  return payload.rowErrors.flatMap((rowError) =>
    isRecord(rowError) &&
    typeof rowError.row === "number" &&
    Array.isArray(rowError.messages)
      ? rowError.messages.map(
          (message) => `Baris ${rowError.row}: ${String(message)}`,
        )
      : [],
  );
}

export function ApbdWorkspace() {
  const [assignments, setAssignments] = useState<ApbdAssignment[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [agencyId, setAgencyId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [entry, setEntry] = useState<ApbdWorkspaceResponse["entry"]>(null);
  const [sourceDatasetSubmissionId, setSourceDatasetSubmissionId] = useState<
    string | null
  >(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [loadedContext, setLoadedContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revisionOfId, setRevisionOfId] = useState<string | null>(null);
  const [revisionReason, setRevisionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const loadedContextRef = useRef<string | null>(null);
  const locked = entry?.status === "published" && revisionOfId === null;

  const agencies = useMemo(() => {
    const values = new Map<string, string>();
    for (const assignment of assignments) {
      values.set(assignment.agencyId, assignment.agencyId);
    }
    return [...values].map(([value, label]) => ({ value, label }));
  }, [assignments]);
  const regions = useMemo(
    () =>
      assignments
        .filter((assignment) => assignment.agencyId === agencyId)
        .reduce<{ value: string; label: string }[]>((values, assignment) => {
          if (!values.some((value) => value.value === assignment.regionId)) {
            values.push({
              value: assignment.regionId,
              label: assignment.regionName,
            });
          }
          return values;
        }, []),
    [agencyId, assignments],
  );
  const sectors = useMemo(
    () =>
      assignments
        .filter(
          (assignment) =>
            assignment.agencyId === agencyId &&
            assignment.regionId === regionId,
        )
        .reduce<{ value: string; label: string }[]>((values, assignment) => {
          if (!values.some((value) => value.value === assignment.sectorId)) {
            values.push({
              value: assignment.sectorId,
              label: assignment.sectorId,
            });
          }
          return values;
        }, []),
    [agencyId, assignments, regionId],
  );
  const selectedAssignment = assignments.find(
    (assignment) =>
      assignment.agencyId === agencyId &&
      assignment.regionId === regionId &&
      assignment.sectorId === sectorId,
  );
  const currentContext = makeContextQuery(year, agencyId, regionId, sectorId);
  const contextReady = loadedContext === currentContext;
  const datasetSourceScope = useMemo(
    () =>
      contextReady && selectedAssignment
        ? {
            kind: "apbd" as const,
            agencyId,
            regionId,
            sectorId,
            referenceYear: Number(year),
          }
        : null,
    [agencyId, contextReady, regionId, sectorId, selectedAssignment, year],
  );
  const totals = useMemo(
    () =>
      calculateApbdTotals(
        items.map((item) => ({
          periods: APBD_PERIODS.map(({ value }) => ({
            pagu: parseForDisplay(item.periods[value].pagu),
            realisasi: parseForDisplay(item.periods[value].realisasi),
          })),
        })),
      ),
    [items],
  );
  const quarterCompletion = useMemo(
    () =>
      APBD_PERIODS.map((period) => {
        const complete = items.filter(
          (item) =>
            item.periods[period.value].pagu.trim() !== "" &&
            item.periods[period.value].realisasi.trim() !== "",
        ).length;
        return { ...period, complete };
      }),
    [items],
  );

  const loadContext = useCallback(
    async (
      context: {
        readonly year: string;
        readonly agencyId: string;
        readonly regionId: string;
        readonly sectorId: string;
      },
    ) => {
      const nextContextKey = makeContextQuery(
        context.year,
        context.agencyId,
        context.regionId,
        context.sectorId,
      );
      if (loadedContextRef.current !== nextContextKey) setImportErrors([]);
      setLoadingEntry(true);
      setError(null);
      setNotice(null);
      setRowErrors([]);
      setRevisionOfId(null);
      setLoadedContext(null);
      loadedContextRef.current = null;
      setEntry(null);
      setSourceDatasetSubmissionId(null);
      setItems([]);
      try {
        const query = makeContextQuery(
          context.year,
          context.agencyId,
          context.regionId,
          context.sectorId,
        );
        const response = await fetch(`/api/asn/apbd?${query}`, {
          cache: "no-store",
        });
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(apiError(payload));
        const parsed = apbdWorkspaceResponseSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error("Data APBD yang diterima tidak valid.");
        }
        setAssignments(parsed.data.assignments);
        setEntry(parsed.data.entry);
        setSourceDatasetSubmissionId(
          parsed.data.entry?.sourceDatasetSubmissionId ?? null,
        );
        setItems(toEditableItems(parsed.data.entry));
        loadedContextRef.current = nextContextKey;
        setLoadedContext(nextContextKey);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Data APBD gagal dimuat.",
        );
      } finally {
        setLoadingEntry(false);
      }
    },
    [],
  );

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/asn/apbd", { cache: "no-store" });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(payload));
      const parsed = apbdWorkspaceResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("Data penugasan APBD yang diterima tidak valid.");
      }
      const nextAssignments = parsed.data.assignments;
      setAssignments(nextAssignments);
      const initialAssignment = nextAssignments[0];
      if (initialAssignment) {
        setAgencyId(initialAssignment.agencyId);
        setRegionId(initialAssignment.regionId);
        setSectorId(initialAssignment.sectorId);
        await loadContext({
          year: String(new Date().getFullYear()),
          agencyId: initialAssignment.agencyId,
          regionId: initialAssignment.regionId,
          sectorId: initialAssignment.sectorId,
        });
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Data penugasan APBD gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadContext]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const updateText = (
    itemIndex: number,
    field: "code" | "programName" | "subactivityName",
    value: string,
  ) => {
    setItems((current) =>
      current.map((item, index) =>
        index === itemIndex ? { ...item, [field]: value } : item,
      ),
    );
  };

  const updateAmount = (
    itemIndex: number,
    period: PeriodKey,
    field: "pagu" | "realisasi",
    value: string,
  ) => {
    setItems((current) =>
      current.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              periods: {
                ...item.periods,
                [period]: { ...item.periods[period], [field]: value },
              },
            }
          : item,
      ),
    );
  };

  const normalizeAmount = (
    itemIndex: number,
    period: PeriodKey,
    field: "pagu" | "realisasi",
    value: string,
  ) => {
    try {
      updateAmount(itemIndex, period, field, parseRupiahInteger(value) ?? "");
      setError(null);
    } catch (parseError) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : "Format angka rupiah tidak valid.",
      );
    }
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        code: "",
        id: null,
        programName: "",
        subactivityName: "",
        periods: emptyPeriods(),
      },
    ]);
  };

  const save = async (status: "draft" | "published") => {
    if (!selectedAssignment || !contextReady) {
      setError("Pilih konteks yang termasuk dalam penugasan akun Anda.");
      return;
    }
    if (status === "published" && importErrors.length > 0) {
      setError("Perbaiki atau impor ulang CSV; baris yang tidak valid belum masuk ke tabel.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    setRowErrors([]);
    try {
      const payload = {
        referenceYear: Number(year),
        agencyId,
        regionId,
        sectorId,
        status,
        ...(revisionOfId
          ? { revisionOfId, revisionReason: revisionReason.trim() }
          : {}),
        sourceDatasetSubmissionId,
        items: items.map((item) => ({
          ...(item.id && !revisionOfId ? { id: item.id } : {}),
          code: item.code.trim(),
          programName: item.programName.trim(),
          subactivityName: item.subactivityName.trim(),
          periods: toPeriodValues(item.periods),
        })),
      };
      if (status === "published" && !window.confirm(
        "Publikasikan data ini ke portal warga? Data terbit tidak dapat diedit langsung; koreksi harus dibuat sebagai revisi.",
      )) {
        return;
      }
      const response = await fetch("/api/asn/apbd", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json();
      const savedRowErrors = formatRowErrors(result);
      if (!response.ok) {
        setRowErrors(savedRowErrors);
        throw new Error(apiError(result));
      }
      setRevisionOfId(null);
      setRevisionReason("");
      await loadContext({ year, agencyId, regionId, sectorId });
      setRowErrors(savedRowErrors);
      const auditWarning =
        typeof result === "object" &&
        result !== null &&
        "auditWarning" in result &&
        typeof result.auditWarning === "string"
          ? result.auditWarning
          : null;
      if (auditWarning) {
        setError(auditWarning);
      } else {
        setNotice(
          status === "published"
            ? "Data berhasil dipublikasikan ke portal warga."
            : "Draf APBD berhasil disimpan.",
        );
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Data APBD gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };

  const importCsv = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") || file.size > 2 * 1024 * 1024) {
      setError("Pilih CSV maksimal 2 MB. Simpan berkas Excel sebagai CSV terlebih dahulu.");
      return;
    }
    try {
      const parsed = parseApbdCsv(await file.text());
      const validationErrors = parsed.rowErrors.map(
        (rowError) => `Baris ${rowError.row}: ${rowError.message}`,
      );
      const importedItems: EditableItem[] = [];
      for (const rawItem of parsed.items) {
        if (!isRecord(rawItem) || typeof rawItem.code !== "string") continue;
        const itemCode = rawItem.code;
        const periods = Array.isArray(rawItem.periods) ? rawItem.periods : [];
        const mappedPeriods = emptyPeriods();
        for (const period of periods) {
          if (
            isRecord(period) &&
            typeof period.periodValue === "string" &&
            isPeriodKey(period.periodValue)
          ) {
            mappedPeriods[period.periodValue] = {
              pagu: typeof period.pagu === "string" ? period.pagu : "",
              realisasi:
                typeof period.realisasi === "string" ? period.realisasi : "",
            };
          }
        }
        const existing = items.find(
          (item) => item.code.toLocaleLowerCase("id-ID") === itemCode.toLocaleLowerCase("id-ID"),
        );
        importedItems.push({
          id: existing?.id ?? null,
          code: itemCode,
          programName:
            typeof rawItem.programName === "string" ? rawItem.programName : "",
          subactivityName:
            typeof rawItem.subactivityName === "string"
              ? rawItem.subactivityName
              : "",
          periods: mappedPeriods,
        });
      }
      if (!importedItems.length) {
        throw new Error("CSV tidak berisi baris yang dapat diimpor.");
      }
      const importedCodes = new Set(
        importedItems.map((item) => item.code.toLocaleLowerCase("id-ID")),
      );
      setItems((current) => [
        ...current.filter(
          (item) => !importedCodes.has(item.code.toLocaleLowerCase("id-ID")),
        ),
        ...importedItems,
      ]);
      setImportErrors(validationErrors);
      setError(null);
      setNotice(
        `${importedItems.length} baris CSV disiapkan untuk upsert. Baris yang tidak ada di berkas tetap dipertahankan.`,
      );
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "CSV tidak dapat diimpor.",
      );
    } finally {
      if (importInput.current) importInput.current.value = "";
    }
  };

  const downloadCsv = (templateOnly: boolean) => {
    try {
      const csv = templateOnly
        ? apbdCsvTemplate()
        : serializeApbdCsv(
            items.map((item) => ({
              code: item.code,
              programName: item.programName,
              subactivityName: item.subactivityName,
              periods: toPeriodValues(item.periods),
            })),
          );
      const url = URL.createObjectURL(
        new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = templateOnly
        ? "template-apbd.csv"
        : `apbd-${year}-${regionId}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Ekspor CSV gagal.",
      );
    }
  };

  const years = Array.from({ length: 10 }, (_, index) =>
    String(new Date().getFullYear() - index),
  );

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/asn/dashboard" className="hover:text-foreground">
              Data Pemerintah
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li>Anggaran</li>
          <li aria-hidden="true">&gt;</li>
          <li aria-current="page" className="font-medium text-foreground">
            Input Data
          </li>
        </ol>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Ruang kerja operator ASN</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Input Anggaran &amp; Realisasi APBD
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Kelola Pagu dan Realisasi per sub-kegiatan dan triwulan. Data hanya
            dapat diakses dalam lingkup penugasan instansi Anda.
          </p>
        </div>
        {entry && contextReady ? (
          <Badge variant={entry.status === "published" ? "default" : "outline"}>
            {entry.status === "published" ? "Terpublikasi" : "Draf"}
          </Badge>
        ) : null}
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Konteks &amp; Filter</CardTitle>
          <CardDescription>
            Pilihan instansi, wilayah, dan urusan dibatasi oleh hak akses akun.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1.5 text-sm font-medium">
            Tahun Anggaran
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 font-normal"
            >
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Instansi
            <select
              value={agencyId}
              onChange={(event) => {
                const nextAgency = event.target.value;
                const next = assignments.find(
                  (assignment) => assignment.agencyId === nextAgency,
                );
                setAgencyId(nextAgency);
                setRegionId(next?.regionId ?? "");
                setSectorId(next?.sectorId ?? "");
              }}
              disabled={loading || agencies.length === 0}
              className="h-10 w-full rounded-md border border-input bg-background px-3 font-normal disabled:opacity-60"
            >
              {agencies.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Wilayah
            <select
              value={regionId}
              onChange={(event) => {
                const nextRegion = event.target.value;
                const next = assignments.find(
                  (assignment) =>
                    assignment.agencyId === agencyId &&
                    assignment.regionId === nextRegion,
                );
                setRegionId(nextRegion);
                setSectorId(next?.sectorId ?? "");
              }}
              disabled={loading || regions.length === 0}
              className="h-10 w-full rounded-md border border-input bg-background px-3 font-normal disabled:opacity-60"
            >
              {regions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Sektor / Urusan
            <select
              value={sectorId}
              onChange={(event) => setSectorId(event.target.value)}
              disabled={loading || sectors.length === 0}
              className="h-10 w-full rounded-md border border-input bg-background px-3 font-normal disabled:opacity-60"
            >
              {sectors.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 xl:col-span-4">
            <Button
              variant="outline"
              disabled={
                loadingEntry ||
                !assignments.some(
                  (assignment) =>
                    assignment.agencyId === agencyId &&
                    assignment.regionId === regionId &&
                    assignment.sectorId === sectorId,
                )
              }
              onClick={() =>
                void loadContext({ year, agencyId, regionId, sectorId })
              }
            >
              Terapkan konteks
            </Button>
            {selectedAssignment ? (
              <span className="text-xs text-muted-foreground">
                Hak akses: {selectedAssignment.agencyId} ·{" "}
                {selectedAssignment.regionName} · {selectedAssignment.sectorId}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {!loading && assignments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="font-semibold">Belum ada penugasan APBD</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hubungi administrator agar wilayah, instansi, dan urusan yang
              menjadi tanggung jawab Anda diberikan akses.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <p>{error}</p>
          <Button
            className="mt-3"
            size="sm"
            variant="outline"
            onClick={() =>
              selectedAssignment
                ? void loadContext({ year, agencyId, regionId, sectorId })
                : void loadAssignments()
            }
          >
            Coba lagi
          </Button>
        </div>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          {notice}
        </p>
      ) : null}
      {rowErrors.length ? (
        <div role="alert" className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="font-semibold">Sebagian baris perlu diperiksa</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {rowErrors.map((rowError, index) => (
              <li key={`${index}-${rowError}`}>{rowError}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {importErrors.length ? (
        <div role="alert" className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="font-semibold">Baris CSV yang dilewati</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {importErrors.map((importError, index) => (
              <li key={`${index}-${importError}`}>{importError}</li>
            ))}
          </ul>
          <p className="mt-2 text-muted-foreground">
            Publikasi dinonaktifkan sampai CSV diperbaiki dan diimpor ulang.
          </p>
        </div>
      ) : null}
      {selectedAssignment && loadingEntry ? (
        <p role="status" className="text-sm text-muted-foreground">
          Memuat data untuk konteks terpilih…
        </p>
      ) : null}
      {selectedAssignment && !contextReady && !loadingEntry ? (
        <p role="status" className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          Terapkan konteks untuk memuat data yang sesuai dengan pilihan saat ini.
        </p>
      ) : null}

      {selectedAssignment && contextReady ? (
        <>
          <section aria-label="Ringkasan status APBD" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total Pagu",
                value: formatRupiahInteger(totals.pagu.toString()),
                description: `${year} · ${items.length} sub-kegiatan`,
              },
              {
                label: "Total Realisasi",
                value: formatRupiahInteger(totals.realisasi.toString()),
                description: "Akumulasi Triwulan I–IV",
              },
              {
                label: "Penyerapan",
                value: totals.absorption,
                description: "Realisasi dibanding total Pagu",
              },
              {
                label: "Kelengkapan Input",
                value: `${totals.completeness}%`,
                description: "Pagu dan Realisasi yang terisi",
              },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="break-all text-xl font-bold tabular-nums sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base">Tabel Input Data</CardTitle>
                <CardDescription>
                  Klik sel untuk mengubah nilai. Angka disimpan sebagai rupiah
                  bulat; gunakan pemisah ribuan titik atau koma.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCsv(true)}
                  disabled={locked || loadingEntry || !contextReady}
                >
                  <ArrowDownToLine className="size-4" aria-hidden="true" />
                  Unduh Template Excel (CSV)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => importInput.current?.click()}
                  disabled={locked || loadingEntry || !contextReady}
                >
                  <ArrowUpFromLine className="size-4" aria-hidden="true" />
                  Impor CSV
                </Button>
                <input
                  ref={importInput}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  aria-label="Pilih berkas CSV APBD"
                  onChange={(event) =>
                    void importCsv(event.currentTarget.files?.[0])
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCsv(false)}
                  disabled={items.length === 0 || loadingEntry || !contextReady}
                >
                  <ArrowDownToLine className="size-4" aria-hidden="true" />
                  Ekspor Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {locked ? (
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                  <p className="text-muted-foreground">
                    Data terpublikasi dikunci agar riwayat warga tetap utuh.
                    Koreksi dilakukan sebagai revisi baru.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRevisionOfId(entry.id);
                      setRevisionReason("");
                    }}
                  >
                    Buat revisi
                  </Button>
                </div>
              ) : null}
              {revisionOfId ? (
                <label className="mb-4 block space-y-1.5 text-sm font-medium">
                  Catatan revisi
                  <textarea
                    value={revisionReason}
                    onChange={(event) => setRevisionReason(event.target.value)}
                    maxLength={1000}
                    rows={2}
                    placeholder="Jelaskan alasan dan dasar koreksi (minimal 10 karakter)"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-normal"
                  />
                </label>
              ) : null}
              {quarterCompletion.length ? (
                <div className="mb-4 flex flex-wrap gap-2 text-xs">
                  {quarterCompletion.map((period) => (
                    <Badge key={period.value} variant="outline">
                      {period.label}: {period.complete}/{items.length} terisi
                    </Badge>
                  ))}
                </div>
              ) : null}
              {totals.warningCount > 0 ? (
                <div role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    {totals.warningCount} nilai realisasi melebihi Pagu periode.
                    Periksa sebelum dipublikasikan.
                  </span>
                </div>
              ) : null}
              {!contextReady && !loadingEntry ? (
                <p role="status" className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Terapkan konteks untuk memuat data yang sesuai dengan pilihan
                  saat ini.
                </p>
              ) : loadingEntry ? (
                <div
                  className="h-48 animate-pulse rounded-md bg-muted"
                  aria-label="Memuat tabel APBD"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[1240px] w-full border-collapse text-left text-sm">
                    <caption className="sr-only">
                      Input Pagu dan Realisasi per sub-kegiatan dan triwulan
                    </caption>
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th rowSpan={2} scope="col" className="p-3">Kode</th>
                        <th rowSpan={2} scope="col" className="p-3">Program</th>
                        <th rowSpan={2} scope="col" className="p-3">Sub-kegiatan</th>
                        {APBD_PERIODS.map((period) => (
                          <th
                            key={period.value}
                            scope="colgroup"
                            colSpan={2}
                            className="border-l p-3 text-center"
                          >
                            {period.label}
                          </th>
                        ))}
                        <th rowSpan={2} scope="col" className="border-l p-3">Total Pagu</th>
                        <th rowSpan={2} scope="col" className="p-3">Total Realisasi</th>
                        <th rowSpan={2} scope="col" className="p-3">Penyerapan</th>
                      </tr>
                      <tr className="border-b bg-muted/50">
                        {APBD_PERIODS.flatMap((period) => [
                          <th key={`${period.value}-pagu`} scope="col" className="border-l p-2">Pagu</th>,
                          <th key={`${period.value}-realisasi`} scope="col" className="p-2">Realisasi</th>,
                        ])}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={14}
                            className="p-10 text-center text-muted-foreground"
                          >
                            Belum ada sub-kegiatan pada konteks ini. Tambahkan
                            baris atau impor template CSV.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, index) => {
                          const itemPagu = APBD_PERIODS.reduce(
                            (sum, period) =>
                              sum +
                              BigInt(
                                parseForDisplay(
                                  item.periods[period.value].pagu,
                                ) ?? "0",
                              ),
                            0n,
                          );
                          const itemRealisasi = APBD_PERIODS.reduce(
                            (sum, period) =>
                              sum +
                              BigInt(
                                parseForDisplay(
                                  item.periods[period.value].realisasi,
                                ) ?? "0",
                              ),
                            0n,
                          );
                          const percent =
                            formatApbdPercent(itemRealisasi, itemPagu);
                          return (
                            <tr key={`${item.code}-${index}`} className="border-b align-top">
                              <td className="p-2">
                                <input
                                  aria-label={`Kode sub-kegiatan baris ${index + 1}`}
                                  value={item.code}
                                  disabled={locked}
                                  onChange={(event) =>
                                    updateText(index, "code", event.target.value)
                                  }
                                  maxLength={64}
                                  className="h-9 w-28 rounded border border-input bg-background px-2 disabled:bg-muted"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  aria-label={`Program baris ${index + 1}`}
                                  value={item.programName}
                                  disabled={locked}
                                  onChange={(event) =>
                                    updateText(index, "programName", event.target.value)
                                  }
                                  maxLength={160}
                                  className="h-9 w-44 rounded border border-input bg-background px-2 disabled:bg-muted"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  aria-label={`Sub-kegiatan baris ${index + 1}`}
                                  value={item.subactivityName}
                                  disabled={locked}
                                  onChange={(event) =>
                                    updateText(index, "subactivityName", event.target.value)
                                  }
                                  maxLength={240}
                                  className="h-9 w-52 rounded border border-input bg-background px-2 disabled:bg-muted"
                                />
                              </td>
                              {APBD_PERIODS.flatMap((period) =>
                                (["pagu", "realisasi"] as const).map((field) => (
                                  <td
                                    key={`${period.value}-${field}`}
                                    className={`p-2 ${field === "pagu" ? "border-l" : ""}`}
                                  >
                                    <input
                                      aria-label={`${field === "pagu" ? "Pagu" : "Realisasi"} ${period.label} ${item.code || `baris ${index + 1}`}`}
                                      value={item.periods[period.value][field]}
                                      disabled={locked}
                                      inputMode="numeric"
                                      onChange={(event) =>
                                        updateAmount(
                                          index,
                                          period.value,
                                          field,
                                          event.target.value,
                                        )
                                      }
                                      onBlur={(event) =>
                                        normalizeAmount(
                                          index,
                                          period.value,
                                          field,
                                          event.target.value,
                                        )
                                      }
                                      className="h-9 w-36 rounded border border-input bg-background px-2 text-right tabular-nums disabled:bg-muted"
                                      placeholder="—"
                                    />
                                  </td>
                                )),
                              )}
                              <td className="border-l p-3 text-right font-medium tabular-nums">
                                {formatRupiahInteger(itemPagu.toString())}
                              </td>
                              <td className="p-3 text-right font-medium tabular-nums">
                                {formatRupiahInteger(itemRealisasi.toString())}
                              </td>
                              <td className="p-3 text-right tabular-nums">
                                {percent}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {items.length}/500 baris · Angka kosong dihitung sebagai data
                  belum lengkap.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  disabled={locked || items.length >= 500 || loadingEntry || !contextReady}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Tambah sub-kegiatan
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Simpan &amp; Publikasi</CardTitle>
              <CardDescription>
                Draf dapat diperbarui. Data terpublikasi dikunci dan koreksinya
                membuat revisi baru tanpa menghapus riwayat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {entry ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="size-4" aria-hidden="true" />
                  Terakhir diperbarui {new Date(entry.updatedAt).toLocaleString("id-ID")} oleh {entry.updatedBy}
                </p>
              ) : null}
              <DatasetSourcePicker
                scope={datasetSourceScope}
                value={sourceDatasetSubmissionId}
                onChange={setSourceDatasetSubmissionId}
                disabled={locked || loadingEntry || saving || !contextReady}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void save("draft")}
                  disabled={locked || saving || loadingEntry || !selectedAssignment || !contextReady}
                >
                  <Save className="size-4" aria-hidden="true" />
                  {saving ? "Menyimpan…" : "Simpan Draf"}
                </Button>
                <Button
                  onClick={() => void save("published")}
                  disabled={locked || saving || loadingEntry || !selectedAssignment || !contextReady}
                >
                  <Send className="size-4" aria-hidden="true" />
                  Publikasikan ke Portal
                </Button>
                {entry?.status === "published" && locked ? (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Data terkunci
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Audit</CardTitle>
              <CardDescription>
                Riwayat perubahan Pagu dan Realisasi pada draf dan revisi ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!entry?.audit.length ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada perubahan angka yang tercatat.
                </p>
              ) : (
                <ol className="space-y-3">
                  {entry.audit.map((audit, index) => (
                    <li
                      key={`${audit.itemCode}-${audit.periodValue}-${audit.field}-${audit.changedAt}-${index}`}
                      className="border-l-2 border-primary/40 pl-3 text-sm"
                    >
                      <p>
                        <span className="font-medium">{audit.actorName}</span>{" "}
                        mengubah {audit.field} {audit.itemCode} · {audit.periodValue}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {audit.previousValue ?? "kosong"} → {audit.newValue ?? "kosong"} ·{" "}
                        {new Date(audit.changedAt).toLocaleString("id-ID")}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {!loading && selectedAssignment && !loadingEntry && !entry && items.length === 0 ? (
        <div role="status" className="sr-only">
          Belum ada data untuk konteks ini. Tambahkan sub-kegiatan untuk mulai.
        </div>
      ) : null}
    </main>
  );
}
