import { z } from "zod";
import { reportStatuses } from "./types";

export const publicReportSchema = z
  .object({
    reportNumber: z.string().min(1).max(40),
    title: z.string().min(1).max(255),
    status: z.enum(reportStatuses),
    submittedAt: z.string().datetime(),
    category: z.string().min(1).max(100),
    city: z.string().min(1).max(100),
  })
  .strict();

export const recentReportsPageSchema = z
  .object({
    reports: z.array(publicReportSchema),
    total: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    hasMore: z.boolean(),
  })
  .strict();

export type PublicReport = z.infer<typeof publicReportSchema>;
export type RecentReportsPage = z.infer<typeof recentReportsPageSchema>;

// TODO: Replace these clearly labelled examples with data approved for public display.
export const PUBLIC_REPORT_EXAMPLES: readonly PublicReport[] = [
  {
    reportNumber: "LP-2026-007064-01",
    title: "Jalan berlubang di Jl. Melati",
    status: "in_progress",
    submittedAt: "2026-10-12T00:00:00.000Z",
    category: "Infrastruktur",
    city: "Kota Bandung",
  },
  {
    reportNumber: "LP-2026-007063-02",
    title: "Sampah menumpuk di tepi jalan",
    status: "verified",
    submittedAt: "2026-10-11T00:00:00.000Z",
    category: "Lingkungan",
    city: "Kota Bogor",
  },
  {
    reportNumber: "LP-2026-007062-03",
    title: "Lampu jalan mati",
    status: "resolved",
    submittedAt: "2026-10-10T00:00:00.000Z",
    category: "Infrastruktur",
    city: "Kota Semarang",
  },
  {
    reportNumber: "LP-2026-007061-01",
    title: "Jalan berlubang di Jl. Anggrek",
    status: "submitted",
    submittedAt: "2026-10-09T00:00:00.000Z",
    category: "Infrastruktur",
    city: "Kota Bandung",
  },
  {
    reportNumber: "LP-2026-007060-01",
    title: "Jalan berlubang di Jl. Kenanga",
    status: "submitted",
    submittedAt: "2026-10-08T00:00:00.000Z",
    category: "Infrastruktur",
    city: "Kota Bandung",
  },
  {
    reportNumber: "LP-2026-007059-01",
    title: "Saluran air tersumbat",
    status: "verified",
    submittedAt: "2026-10-07T00:00:00.000Z",
    category: "Lingkungan",
    city: "Kota Bogor",
  },
];

export function getRecentReportsPage(
  limit: number,
  offset: number,
): RecentReportsPage {
  const reports = PUBLIC_REPORT_EXAMPLES.slice(offset, offset + limit);

  return {
    reports,
    total: PUBLIC_REPORT_EXAMPLES.length,
    limit,
    offset,
    hasMore: offset + reports.length < PUBLIC_REPORT_EXAMPLES.length,
  };
}

export function formatRecentReportDate(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function getPublicReportStatusPresentation(
  status: PublicReport["status"],
) {
  switch (status) {
    case "submitted":
      return {
        label: "Diterima",
        className:
          "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300",
      };
    case "verified":
      return {
        label: "Terverifikasi",
        className:
          "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
      };
    case "in_progress":
      return {
        label: "Dalam tindak lanjut",
        className:
          "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
      };
    case "resolved":
    case "closed":
      return {
        label: "Selesai",
        className:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
      };
  }
}

export function getRecentReportPattern(
  reports: readonly PublicReport[],
): string | null {
  const counts = new Map<
    string,
    { category: string; city: string; count: number }
  >();

  for (const report of reports) {
    const key = `${report.category}\u0000${report.city}`;
    const current = counts.get(key);
    counts.set(key, {
      category: report.category,
      city: report.city,
      count: (current?.count ?? 0) + 1,
    });
  }

  const mostReported = [...counts.values()]
    .filter((group) => group.count > 1)
    .sort((left, right) => right.count - left.count)[0];

  if (!mostReported) return null;

  return `${mostReported.count} laporan ${mostReported.category} di ${mostReported.city} pada daftar ini.`;
}
