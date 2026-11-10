"use client";

import { useEffect, useState } from "react";
import { Database } from "lucide-react";
import { datasetSourcesResponseSchema } from "@/modules/asn-datasets/contract";
import type { DatasetSource } from "@/modules/asn-datasets/contract";

type DatasetSourceScope =
  | {
      readonly kind: "apbd";
      readonly agencyId: string;
      readonly regionId: string;
      readonly sectorId: string;
      readonly referenceYear: number;
    }
  | { readonly kind: "project"; readonly projectId: string };

function sourceQuery(scope: DatasetSourceScope): string {
  if (scope.kind === "project") {
    return new URLSearchParams({ projectId: scope.projectId }).toString();
  }
  return new URLSearchParams({
    assignmentType: "apbd",
    agencyId: scope.agencyId,
    regionId: scope.regionId,
    sectorId: scope.sectorId,
    referenceYear: String(scope.referenceYear),
  }).toString();
}

export function DatasetSourcePicker({
  scope,
  value,
  onChange,
  disabled = false,
}: {
  scope: DatasetSourceScope | null;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) {
  const [sources, setSources] = useState<DatasetSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!scope) {
      setSources([]);
      setError("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const response = await fetch(
          `/api/asn/datasets/sources?${sourceQuery(scope)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const raw: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof raw === "object" &&
            raw !== null &&
            "error" in raw &&
            typeof raw.error === "string"
              ? raw.error
              : "Sumber dataset tidak dapat dimuat.";
          throw new Error(message);
        }
        const parsed = datasetSourcesResponseSchema.parse(raw);
        if (!controller.signal.aborted) setSources(parsed.sources);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Sumber dataset tidak dapat dimuat.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [scope]);

  return (
    <label className="block space-y-1.5 text-sm">
      <span className="flex items-center gap-2 font-medium">
        <Database aria-hidden="true" className="size-4 text-primary" />
        Dataset sumber terkait
      </span>
      <select
        aria-label="Dataset sumber terkait"
        value={value ?? ""}
        disabled={disabled || loading || !scope || sources.length === 0}
        onChange={(event) => onChange(event.target.value || null)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
      >
        <option value="">
          {loading
            ? "Memuat dataset yang sesuai..."
            : sources.length
              ? "Tanpa dataset sumber"
              : "Belum ada dataset terkirim yang sesuai"}
        </option>
        {sources.map((source) => (
          <option key={source.id} value={source.id}>
            {source.title} · {source.category} · {source.sourceLabel}
          </option>
        ))}
      </select>
      {error ? (
        <span role="alert" className="text-destructive block text-xs">
          {error}
        </span>
      ) : (
        <span className="text-muted-foreground block text-xs">
          Pilihan hanya berisi dataset terkirim yang cocok dengan penugasan,
          tahun, urusan, dan proyek aktif.
        </span>
      )}
    </label>
  );
}
