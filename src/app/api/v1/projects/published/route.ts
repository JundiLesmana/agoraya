import { NextResponse } from "next/server";
import { getDefaultDatabase } from "@/lib/db/client";
import type { Row } from "@/lib/db/types";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type ProjectRow = Row & {
  id: string;
  name: string;
  agency: string;
  location: string;
  sector: string;
  budget: string | number;
  startDate: string;
  endDate: string;
  fiscalYear: number;
  initialPhysicalProgress: string | number;
  initialFinancialProgress: string | number;
  status: string;
};

type ReportRow = Row & {
  projectId: string;
  periodYear: number;
  periodMonth: number;
  physicalProgress: string | number;
  financialProgress: string | number;
};

export async function GET(): Promise<Response> {
  try {
    const database = getDefaultDatabase();
    const projects = await database.query<ProjectRow>(
      `SELECT project.id::text AS id,
         project.package_name AS name,
         project.provider_name AS agency,
         project.location,
         project.sector,
         project.contract_value::text AS budget,
         project.start_date::text AS "startDate",
         project.end_date::text AS "endDate",
         project.fiscal_year AS "fiscalYear",
         project.initial_physical_progress::text AS "initialPhysicalProgress",
         project.initial_financial_progress::text AS "initialFinancialProgress",
         project.status
       FROM infrastructure_projects project
       WHERE EXISTS (
         SELECT 1
         FROM project_progress_reports report
         WHERE report.project_id = project.id
           AND report.tenant_id = project.tenant_id
           AND report.status = 'submitted'
       )
       ORDER BY project.fiscal_year DESC, project.package_name, project.id`,
    );

    if (!projects.length) return NextResponse.json({ projects: [] });

    const projectIds = projects.map((project) => project.id);
    const placeholders = projectIds
      .map((_, index) => `$${index + 1}`)
      .join(", ");
    const reports = await database.query<ReportRow>(
      `SELECT report.project_id::text AS "projectId",
         report.period_year AS "periodYear",
         report.period_month AS "periodMonth",
         report.physical_progress::text AS "physicalProgress",
         report.financial_progress::text AS "financialProgress"
       FROM project_progress_reports report
       INNER JOIN infrastructure_projects project
         ON project.id = report.project_id
         AND project.tenant_id = report.tenant_id
       WHERE report.project_id IN (${placeholders})
         AND report.status = 'submitted'
       ORDER BY report.period_year, report.period_month`,
      projectIds,
    );

    return NextResponse.json({
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        agency: project.agency,
        location: project.location,
        sector: project.sector,
        budget: Number(project.budget),
        startDate: project.startDate,
        endDate: project.endDate,
        fiscalYear: project.fiscalYear,
        initialPhysicalProgress: Number(project.initialPhysicalProgress),
        initialFinancialProgress: Number(project.initialFinancialProgress),
        status: project.status,
        reports: reports
          .filter((report) => report.projectId === project.id)
          .map((report) => ({
            year: report.periodYear,
            month: report.periodMonth,
            physicalProgress: Number(report.physicalProgress),
            financialProgress: Number(report.financialProgress),
          })),
      })),
    });
  } catch (error) {
    logger.error("public_projects.published_read_failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Data proyek terpublikasi belum dapat dimuat." },
      { status: 500 },
    );
  }
}