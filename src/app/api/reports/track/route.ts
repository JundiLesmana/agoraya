import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { ticketSubmissionDetails, tickets } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { reportStatuses } from "@/modules/reporting/types";

export const dynamic = "force-dynamic";

const reportNumberSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^LP-\d{8}-[A-F0-9]{8}-[A-F0-9]{3}$/);

const listQuerySchema = z.object({
  category: z
    .enum(["Infrastruktur", "Dugaan korupsi", "Lingkungan"])
    .optional(),
  status: z.enum(reportStatuses).optional(),
  search: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

const publicReportSelection = {
  reportNumber: ticketSubmissionDetails.reportNumber,
  title: tickets.title,
  description: tickets.description,
  category: tickets.category,
  status: tickets.status,
  submittedAt: tickets.submittedAt,
  responseDueAt: tickets.responseDueAt,
  firstRespondedAt: tickets.firstRespondedAt,
  resolvedAt: tickets.resolvedAt,
  closedAt: tickets.closedAt,
  subcategory: ticketSubmissionDetails.subcategory,
  province: ticketSubmissionDetails.province,
  city: ticketSubmissionDetails.city,
  address: ticketSubmissionDetails.address,
  reporterName: ticketSubmissionDetails.reporterName,
  showIdentity: ticketSubmissionDetails.showIdentity,
  attachmentNames: ticketSubmissionDetails.attachmentNames,
};

export async function GET(request: Request): Promise<Response> {
  const searchParams = new URL(request.url).searchParams;
  const requestedReportNumber = searchParams.get("reportNumber");

  if (requestedReportNumber === null) {
    const parsedQuery = listQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: "Parameter daftar laporan tidak valid." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    try {
      const { category, status, search, limit, offset } = parsedQuery.data;
      const filters = [eq(ticketSubmissionDetails.isPublic, true)];
      if (category) filters.push(eq(tickets.category, category));
      if (status) filters.push(eq(tickets.status, status));
      if (search) {
        const pattern = `%${search}%`;
        const searchFilter = or(
          ilike(ticketSubmissionDetails.reportNumber, pattern),
          ilike(tickets.title, pattern),
          ilike(ticketSubmissionDetails.city, pattern),
          ilike(ticketSubmissionDetails.address, pattern),
        );
        if (searchFilter) filters.push(searchFilter);
      }

      const rows = await db()
        .select(publicReportSelection)
        .from(ticketSubmissionDetails)
        .innerJoin(tickets, eq(ticketSubmissionDetails.ticketId, tickets.id))
        .where(and(...filters))
        .orderBy(desc(tickets.submittedAt))
        .limit(limit + 1)
        .offset(offset);
      const hasMore = rows.length > limit;
      const reports = rows.slice(0, limit).map((report) => {
        const { reporterName, showIdentity, ...publicReport } = report;
        return {
          ...publicReport,
          reporterName: showIdentity ? reporterName : null,
          identityVisible: showIdentity && Boolean(reporterName),
          attachmentNames: Array.isArray(report.attachmentNames)
            ? report.attachmentNames
            : [],
        };
      });

      return NextResponse.json(
        { reports, limit, offset, hasMore },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      logger.error("reports.public_list_failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: "Gagal memuat daftar laporan publik." },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const reportNumber = reportNumberSchema.safeParse(requestedReportNumber);
  if (!reportNumber.success) {
    return NextResponse.json(
      { error: "Masukkan nomor laporan dengan format yang benar." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const [report] = await db()
      .select(publicReportSelection)
      .from(ticketSubmissionDetails)
      .innerJoin(tickets, eq(ticketSubmissionDetails.ticketId, tickets.id))
      .where(
        and(
          eq(ticketSubmissionDetails.reportNumber, reportNumber.data),
          eq(ticketSubmissionDetails.isPublic, true),
        ),
      )
      .limit(1);

    if (!report) {
      return NextResponse.json(
        {
          error:
            "Laporan tidak ditemukan atau tidak tersedia untuk pelacakan publik.",
        },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const { reporterName, showIdentity, attachmentNames, ...publicReport } =
      report;
    return NextResponse.json(
      {
        report: {
          ...publicReport,
          reporterName: showIdentity ? reporterName : null,
          identityVisible: showIdentity && Boolean(reporterName),
          attachmentNames: Array.isArray(attachmentNames)
            ? attachmentNames
            : [],
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("reports.track_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Gagal memuat detail laporan." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
