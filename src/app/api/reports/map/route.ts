import { NextResponse } from "next/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { ticketSubmissionDetails, tickets, tenants } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { reportStatuses } from "@/modules/reporting/types";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
  category: z
    .enum(["Infrastruktur", "Dugaan korupsi", "Lingkungan"])
    .optional(),
  status: z.enum(reportStatuses).optional(),
  followUp: z.enum(["unhandled", "all"]).default("unhandled"),
  search: z.string().trim().max(100).optional(),
});

const publicFilters = [
  eq(ticketSubmissionDetails.isPublic, true),
  eq(tenants.status, "active"),
];
const categoryValues: Record<string, readonly string[]> = {
  Infrastruktur: ["Infrastruktur", "infrastruktur", "ilumniasi"],
  "Dugaan korupsi": ["Dugaan korupsi", "dugaan korupsi"],
  Lingkungan: ["Lingkungan", "lingkungan"],
};

function publicCategory(value: string): string {
  return (
    Object.entries(categoryValues).find(([, values]) =>
      values.includes(value),
    )?.[0] ?? value
  );
}

export async function GET(request: Request): Promise<Response> {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parameter peta laporan tidak valid." },
      { status: 400 },
    );
  }

  const { limit, offset, category, status, followUp, search } = parsed.data;
  const filters = [...publicFilters];
  if (category)
    filters.push(inArray(tickets.category, categoryValues[category]));
  if (status) filters.push(eq(tickets.status, status));
  if (followUp === "unhandled") {
    filters.push(isNull(tickets.firstRespondedAt));
  }
  if (search) {
    const pattern = `%${search}%`;
    const searchFilter = or(
      ilike(ticketSubmissionDetails.reportNumber, pattern),
      ilike(tickets.title, pattern),
      ilike(ticketSubmissionDetails.city, pattern),
    );
    if (searchFilter) filters.push(searchFilter);
  }

  try {
    const database = db();
    const [totalResult] = await database
      .select({ total: count() })
      .from(ticketSubmissionDetails)
      .innerJoin(tickets, eq(ticketSubmissionDetails.ticketId, tickets.id))
      .innerJoin(tenants, eq(tickets.tenantId, tenants.id))
      .where(and(...filters));
    const rows = await database
      .select({
        reportNumber: ticketSubmissionDetails.reportNumber,
        title: tickets.title,
        category: tickets.category,
        status: tickets.status,
        submittedAt: tickets.submittedAt,
        createdAt: tickets.createdAt,
        city: ticketSubmissionDetails.city,
        province: ticketSubmissionDetails.province,
        source: tickets.provenanceSource,
        latitude: sql<string | null>`${tickets.location}->>'latitude'`,
        longitude: sql<string | null>`${tickets.location}->>'longitude'`,
      })
      .from(ticketSubmissionDetails)
      .innerJoin(tickets, eq(ticketSubmissionDetails.ticketId, tickets.id))
      .innerJoin(tenants, eq(tickets.tenantId, tenants.id))
      .where(and(...filters))
      .orderBy(
        ...(followUp === "unhandled"
          ? [
              sql`${tickets.responseDueAt} ASC NULLS LAST`,
              asc(tickets.submittedAt),
              asc(tickets.createdAt),
            ]
          : [desc(tickets.submittedAt), desc(tickets.createdAt)]),
      )
      .limit(limit + 1)
      .offset(offset);
    const hasMore = rows.length > limit;
    return NextResponse.json(
      {
        reports: rows.slice(0, limit).map((report) => {
          const latitude =
            report.latitude != null ? Number(report.latitude) : null;
          const longitude =
            report.longitude != null ? Number(report.longitude) : null;
          const hasValidCoordinates =
            latitude != null &&
            Number.isFinite(latitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude != null &&
            Number.isFinite(longitude) &&
            longitude >= -180 &&
            longitude <= 180;
          return {
            reportNumber: report.reportNumber,
            title: report.title,
            category: publicCategory(report.category),
            status: report.status,
            submittedAt: (report.submittedAt ?? report.createdAt).toISOString(),
            city: report.city,
            province: report.province,
            source: report.source,
            latitude: hasValidCoordinates ? latitude : undefined,
            longitude: hasValidCoordinates ? longitude : undefined,
          };
        }),
        total: totalResult?.total ?? 0,
        limit,
        offset,
        hasMore,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    logger.error("reports.public_map_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Gagal memuat data peta laporan publik." },
      { status: 500 },
    );
  }
}