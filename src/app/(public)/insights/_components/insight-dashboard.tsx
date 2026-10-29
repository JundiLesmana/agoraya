"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SourceBadge } from "@/components/source-badges";
import {
  DEFAULT_FILTERS,
  FilterControls,
  type InsightFilterValues,
} from "./filter-controls";
import { InfoBanner } from "./info-banner";
import { BudgetTrend } from "./budget-trend";
import { SekilasCards } from "./sekilas-cards";
import { TimelyServiceComparison } from "./timely-service-comparison";
import { WellbeingIndicators } from "./wellbeing-indicators";

type InsightTopic = "Layanan" | "Anggaran" | "Kesejahteraan";
const SERVICE_COMPARISON_CITIES = [
  "Kota Bandung",
  "Kota Bogor",
  "Kota Depok",
  "Kota Bekasi",
  "Kota Cimahi",
];

function getFiltersFromSearch(
  searchParams: URLSearchParams,
): InsightFilterValues {
  return {
    wilayah: searchParams.get("wilayah") ?? DEFAULT_FILTERS.wilayah,
    fokus: searchParams.get("fokus") ?? DEFAULT_FILTERS.fokus,
    periode: searchParams.get("periode") ?? DEFAULT_FILTERS.periode,
    topik: searchParams.get("topik") ?? DEFAULT_FILTERS.topik,
  };
}

function NoDataNotice({ children }: { children: string }) {
  return (
    <div className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-5">
      <p role="status" className="text-muted-foreground text-sm">
        {children}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Simulasi</span>
        <SourceBadge source="SIMULATED" label="Data contoh" />
      </div>
    </div>
  );
}

export function InsightDashboard() {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [filters, setFilters] = useState<InsightFilterValues>(() =>
    getFiltersFromSearch(new URLSearchParams(search)),
  );

  useEffect(() => {
    setFilters(getFiltersFromSearch(new URLSearchParams(search)));
  }, [search]);

  const allTopics = filters.topik === DEFAULT_FILTERS.topik;
  const showTopic = (topic: InsightTopic) =>
    allTopics || filters.topik === topic;
  const isWestJava = filters.wilayah === DEFAULT_FILTERS.wilayah;
  const isComparedCity = SERVICE_COMPARISON_CITIES.includes(filters.fokus);
  const hasBandungData = filters.fokus === "Kota Bandung";
  const has2024Data = filters.periode === "2024";

  return (
    <div className="space-y-5">
      <FilterControls
        filters={filters}
        onApply={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />
      <InfoBanner
        wilayah={filters.wilayah}
        periode={filters.periode}
        topik={filters.topik}
        updatedAt="10 Apr 2024, 08.00 WIB"
      />

      {isWestJava && hasBandungData && has2024Data ? (
        <SekilasCards filters={filters} topik={filters.topik} />
      ) : (
        <section aria-labelledby="sekilas-title" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="sekilas-title"
              className="text-foreground text-xl font-semibold"
            >
              Sekilas, apa yang berubah?
            </h2>
            <SourceBadge source="SIMULATED" label="Data contoh" />
          </div>
          <NoDataNotice>
            Ringkasan sekilas simulasi tersedia untuk Kota Bandung, Jawa Barat,
            periode 2024.
          </NoDataNotice>
        </section>
      )}

      {showTopic("Layanan") &&
        (isWestJava && isComparedCity && has2024Data ? (
          <TimelyServiceComparison fokus={filters.fokus} />
        ) : (
          <NoDataNotice>
            Perbandingan layanan contoh tersedia untuk lima kota di Jawa Barat
            pada periode 2024.
          </NoDataNotice>
        ))}

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {showTopic("Anggaran") &&
          (isWestJava && hasBandungData ? (
            <BudgetTrend fokus={filters.fokus} />
          ) : (
            <NoDataNotice>
              Tren anggaran contoh tersedia untuk Kota Bandung, Jawa Barat.
            </NoDataNotice>
          ))}
        {showTopic("Kesejahteraan") &&
          (isWestJava && hasBandungData && has2024Data ? (
            <WellbeingIndicators fokus={filters.fokus} />
          ) : (
            <NoDataNotice>
              Indikator kesejahteraan contoh tersedia untuk Kota Bandung, Jawa
              Barat, periode 2023–2024.
            </NoDataNotice>
          ))}
      </div>
    </div>
  );
}
