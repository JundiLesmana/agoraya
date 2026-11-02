import { v2 as cloudinary } from "cloudinary";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  computeProgressDeviation,
  validatePhysicalProgressNonDecreasing,
} from "@/lib/progress";
import {
  infrastructureProjects,
  projectProgressAttachments,
  projectProgressReports,
  tenants,
} from "@/lib/db/schema";
import type { Session } from "@/lib/auth/session";
import type { ProgressReport } from "@/lib/progress";
import type { ProjectDetail } from "./types";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const FILE_TYPES = new Set(["image/jpeg", "image/png"]);
const FILE_EXTENSIONS = new Set(["jpg", "jpeg", "png"]);
const SIGNED_URL_TTL_SECONDS = 15 * 60;

const reportFields = z.object({
  project_id: z.string().uuid("ID proyek tidak valid."),
  periode_bulan: z.coerce.number().int().min(1).max(12),
  periode_tahun: z.coerce.number().int().min(2020).max(2100),
  progres_fisik: z.coerce.number().min(0).max(100),
  progres_keuangan: z.coerce.number().min(0).max(100),
  catatan: z.string().max(10000).default(""),
  mode: z.enum(["draft", "submit"]).default("submit"),
});

type Transaction = Parameters<
  Parameters<ReturnType<typeof db>["transaction"]>[0]
>[0];

interface UploadedAsset {
  readonly publicId: string;
  readonly assetId: string;
}

interface SubmitResult {
  readonly report: ProgressReport;
  readonly deviation: ReturnType<typeof computeProgressDeviation>;
}

class ProgressServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function isAuthorizedRole(session: Session): boolean {
  return session.roles.some((role) => role === "asn" || role === "staff");
}

async function withProjectContext<T>(
  session: Session,
  operation: (transaction: Transaction) => Promise<T>,
): Promise<T> {
  return db().transaction(async (transaction) => {
    await transaction.execute(
      sql`select set_config('app.tenant_id', ${session.tenantId}, true)`,
    );
    await transaction.execute(
      sql`select set_config('app.user_id', ${session.userId}, true)`,
    );
    return operation(transaction);
  });
}

function cloudinaryClient() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary belum dikonfigurasi untuk unggahan dokumentasi.",
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return cloudinary;
}

function signedDownloadUrl(publicId: string, mediaType: string): string {
  const client = cloudinaryClient();
  const extension = mediaType === "image/png" ? "png" : "jpg";
  return client.utils.private_download_url(publicId, extension, {
    resource_type: "image",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS,
  });
}

async function uploadImage(
  file: File,
  tenantId: string,
  projectId: string,
  reportId: string,
): Promise<UploadedAsset> {
  const client = cloudinaryClient();
  const fileBytes = Buffer.from(await file.arrayBuffer());
  const extension = file.type === "image/png" ? "png" : "jpg";
  const result = await client.uploader.upload(
    `data:${file.type};base64,${fileBytes.toString("base64")}`,
    {
      resource_type: "image",
      type: "authenticated",
      folder: `tenant/${tenantId}/project-progress/${projectId}/${reportId}`,
      public_id: crypto.randomUUID(),
      overwrite: false,
      unique_filename: false,
      allowed_formats: ["jpg", "jpeg", "png"],
      format: extension,
      transformation: [{ flags: "strip_profile" }],
      exif: false,
      image_metadata: false,
    },
  );
  if (!result.public_id || !result.asset_id) {
    throw new Error(
      "Cloudinary tidak mengembalikan identitas aset yang valid.",
    );
  }
  return { publicId: result.public_id, assetId: result.asset_id };
}

async function deleteCloudinaryAssets(
  publicIds: readonly string[],
): Promise<void> {
  if (!publicIds.length) return;
  const client = cloudinaryClient();
  const results = await Promise.all(
    publicIds.map((publicId) =>
      client.uploader.destroy(publicId, {
        resource_type: "image",
        type: "authenticated",
        invalidate: true,
      }),
    ),
  );
  if (
    results.some(
      (result) => result.result !== "ok" && result.result !== "not found",
    )
  ) {
    throw new Error(
      "Cloudinary gagal menghapus satu atau lebih aset dokumentasi.",
    );
  }
}

function hasValidImageSignature(file: File, bytes: Uint8Array): boolean {
  if (file.type === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }
  return (
    file.type === "image/png" &&
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

async function validateFiles(files: readonly File[]): Promise<void> {
  if (files.length === 0) {
    throw new ProgressServiceError(
      "Minimal satu foto dokumentasi wajib diunggah.",
      400,
    );
  }
  if (files.length > MAX_FILES) {
    throw new ProgressServiceError(
      `Maksimal ${MAX_FILES} foto dokumentasi.`,
      400,
    );
  }
  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (
      !FILE_TYPES.has(file.type) ||
      !FILE_EXTENSIONS.has(extension) ||
      file.name.length > 255
    ) {
      throw new ProgressServiceError(
        `File ${file.name} bukan foto JPG/PNG yang valid.`,
        400,
      );
    }
    if (file.size < 1 || file.size > MAX_FILE_SIZE) {
      throw new ProgressServiceError(
        `Ukuran file ${file.name} harus maksimal 5 MB.`,
        400,
      );
    }
    const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    if (!hasValidImageSignature(file, signature)) {
      throw new ProgressServiceError(
        `Isi file ${file.name} bukan foto JPG/PNG yang valid.`,
        400,
      );
    }
  }
}

function periodIndex(year: number, month: number): number {
  return year * 12 + month;
}

function formatContractDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function toProjectDetail(
  project: {
    id: string;
    packageName: string;
    location: string;
    sector: string;
    contractValue: number;
    providerName: string;
    startDate: string;
    endDate: string;
    fiscalYear: number;
    initialPhysicalProgress: number;
    initialFinancialProgress: number;
    status: string;
    tenantName: string;
  },
  latest?: { physicalProgress: number; financialProgress: number },
): ProjectDetail {
  return {
    id: project.id,
    namaPaket: project.packageName,
    instansi: project.tenantName,
    lokasi: project.location,
    sektor: project.sector,
    nilaiKontrak: project.contractValue,
    penyedia: project.providerName,
    tanggalMulai: formatContractDate(project.startDate),
    tanggalSelesai: formatContractDate(project.endDate),
    tahunAnggaran: project.fiscalYear,
    progresFisik: latest?.physicalProgress ?? project.initialPhysicalProgress,
    progresKeuangan:
      latest?.financialProgress ?? project.initialFinancialProgress,
    status:
      project.status === "completed" || project.status === "complete"
        ? "Selesai"
        : project.status === "delayed" || project.status === "suspended"
          ? "Tertunda"
          : "Berjalan",
  };
}

function toProgressReport(
  report: typeof projectProgressReports.$inferSelect,
  attachments: readonly (typeof projectProgressAttachments.$inferSelect)[],
): ProgressReport {
  return {
    id: report.id,
    projectId: report.projectId,
    periodeBulan: report.periodMonth,
    periodeTahun: report.periodYear,
    progresFisik: report.physicalProgress,
    progresKeuangan: report.financialProgress,
    catatan: report.evaluationNotes,
    status: report.status,
    dokumen: attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.originalName,
      size: attachment.fileSize,
      type: attachment.mediaType,
      url: signedDownloadUrl(
        attachment.cloudinaryPublicId,
        attachment.mediaType,
      ),
    })),
    createdAt: report.createdAt,
    inputBy: report.reportedBy,
  };
}

export async function listAssignedProjects(
  session: Session,
): Promise<ProjectDetail[]> {
  if (!isAuthorizedRole(session)) return [];
  return withProjectContext(session, async (transaction) => {
    const projects = await transaction
      .select({
        id: infrastructureProjects.id,
        packageName: infrastructureProjects.packageName,
        location: infrastructureProjects.location,
        sector: infrastructureProjects.sector,
        contractValue: infrastructureProjects.contractValue,
        providerName: infrastructureProjects.providerName,
        startDate: infrastructureProjects.startDate,
        endDate: infrastructureProjects.endDate,
        fiscalYear: infrastructureProjects.fiscalYear,
        initialPhysicalProgress: infrastructureProjects.initialPhysicalProgress,
        initialFinancialProgress:
          infrastructureProjects.initialFinancialProgress,
        status: infrastructureProjects.status,
        tenantName: tenants.name,
      })
      .from(infrastructureProjects)
      .innerJoin(tenants, eq(infrastructureProjects.tenantId, tenants.id))
      .orderBy(
        desc(infrastructureProjects.fiscalYear),
        infrastructureProjects.packageName,
      );

    if (projects.length === 0) return [];
    const reports = await transaction
      .select({
        projectId: projectProgressReports.projectId,
        physicalProgress: projectProgressReports.physicalProgress,
        financialProgress: projectProgressReports.financialProgress,
        periodYear: projectProgressReports.periodYear,
        periodMonth: projectProgressReports.periodMonth,
      })
      .from(projectProgressReports)
      .where(
        and(
          inArray(
            projectProgressReports.projectId,
            projects.map((project) => project.id),
          ),
          eq(projectProgressReports.status, "submitted"),
        ),
      )
      .orderBy(
        desc(projectProgressReports.periodYear),
        desc(projectProgressReports.periodMonth),
      );
    const latestByProject = new Map<
      string,
      { physicalProgress: number; financialProgress: number }
    >();
    for (const report of reports) {
      if (!latestByProject.has(report.projectId)) {
        latestByProject.set(report.projectId, {
          physicalProgress: report.physicalProgress,
          financialProgress: report.financialProgress,
        });
      }
    }
    return projects.map((project) =>
      toProjectDetail(project, latestByProject.get(project.id)),
    );
  });
}

export async function getProjectProgress(
  session: Session,
  projectId: string,
): Promise<{ project: ProjectDetail; history: ProgressReport[] } | null> {
  if (!isAuthorizedRole(session)) return null;
  return withProjectContext(session, async (transaction) => {
    const [project] = await transaction
      .select({
        id: infrastructureProjects.id,
        packageName: infrastructureProjects.packageName,
        location: infrastructureProjects.location,
        sector: infrastructureProjects.sector,
        contractValue: infrastructureProjects.contractValue,
        providerName: infrastructureProjects.providerName,
        startDate: infrastructureProjects.startDate,
        endDate: infrastructureProjects.endDate,
        fiscalYear: infrastructureProjects.fiscalYear,
        initialPhysicalProgress: infrastructureProjects.initialPhysicalProgress,
        initialFinancialProgress:
          infrastructureProjects.initialFinancialProgress,
        status: infrastructureProjects.status,
        tenantName: tenants.name,
      })
      .from(infrastructureProjects)
      .innerJoin(tenants, eq(infrastructureProjects.tenantId, tenants.id))
      .where(eq(infrastructureProjects.id, projectId))
      .limit(1);
    if (!project) return null;

    const reports = await transaction
      .select()
      .from(projectProgressReports)
      .where(eq(projectProgressReports.projectId, projectId))
      .orderBy(
        desc(projectProgressReports.periodYear),
        desc(projectProgressReports.periodMonth),
      );
    const reportIds = reports.map((report) => report.id);
    const attachments = reportIds.length
      ? await transaction
          .select()
          .from(projectProgressAttachments)
          .where(inArray(projectProgressAttachments.reportId, reportIds))
      : [];
    const attachmentsByReport = new Map<string, typeof attachments>();
    for (const attachment of attachments) {
      const current = attachmentsByReport.get(attachment.reportId) ?? [];
      current.push(attachment);
      attachmentsByReport.set(attachment.reportId, current);
    }
    const history = reports.map((report) =>
      toProgressReport(report, attachmentsByReport.get(report.id) ?? []),
    );
    const latest = history.find((report) => report.status === "submitted");
    return {
      project: toProjectDetail(
        project,
        latest
          ? {
              physicalProgress: latest.progresFisik,
              financialProgress: latest.progresKeuangan,
            }
          : undefined,
      ),
      history,
    };
  });
}

export async function handleSubmit(
  request: Request,
  session: Session,
): Promise<Response> {
  if (!isAuthorizedRole(session)) {
    return NextResponse.json(
      { error: "Anda tidak berwenang menginput progres proyek." },
      { status: 403 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Format data progres tidak valid." },
      { status: 400 },
    );
  }

  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  const parsed = reportFields.safeParse(values);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Data progres tidak valid.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const rawFiles = formData.getAll("dokumen");
  if (rawFiles.some((value) => !(value instanceof File))) {
    return NextResponse.json(
      { error: "Lampiran harus berupa file foto." },
      { status: 400 },
    );
  }
  const files = rawFiles.filter(
    (value): value is File => value instanceof File,
  );
  try {
    await validateFiles(files);
  } catch (error) {
    if (error instanceof ProgressServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    throw error;
  }

  const {
    project_id: projectId,
    periode_bulan: periodMonth,
    periode_tahun: periodYear,
    progres_fisik: physicalProgress,
    progres_keuangan: financialProgress,
    catatan: evaluationNotes,
    mode,
  } = parsed.data;
  const uploadedAssets: string[] = [];
  let replacedAssets: string[] = [];

  let result: SubmitResult;
  try {
    result = await withProjectContext(session, async (transaction) => {
      const [project] = await transaction
        .select({
          id: infrastructureProjects.id,
          initialPhysicalProgress:
            infrastructureProjects.initialPhysicalProgress,
        })
        .from(infrastructureProjects)
        .where(eq(infrastructureProjects.id, projectId))
        .for("update")
        .limit(1);
      if (!project) {
        throw new ProgressServiceError(
          "Anda tidak berwenang menginput progres untuk proyek ini.",
          403,
        );
      }

      const reports = await transaction
        .select()
        .from(projectProgressReports)
        .where(eq(projectProgressReports.projectId, projectId));
      const samePeriod = reports.find(
        (report) =>
          report.periodYear === periodYear &&
          report.periodMonth === periodMonth,
      );
      if (samePeriod?.status === "submitted") {
        throw new ProgressServiceError(
          "Laporan untuk periode ini sudah dipublikasikan.",
          409,
        );
      }
      if (samePeriod && samePeriod.reportedBy !== session.userId) {
        throw new ProgressServiceError(
          "Anda tidak berwenang mengubah draf petugas lain.",
          403,
        );
      }

      const thisPeriod = periodIndex(periodYear, periodMonth);
      const submitted = reports.filter(
        (report) =>
          report.status === "submitted" && report.id !== samePeriod?.id,
      );
      const previous = submitted
        .filter(
          (report) =>
            periodIndex(report.periodYear, report.periodMonth) < thisPeriod,
        )
        .sort(
          (a, b) =>
            periodIndex(b.periodYear, b.periodMonth) -
            periodIndex(a.periodYear, a.periodMonth),
        )[0];
      const next = submitted
        .filter(
          (report) =>
            periodIndex(report.periodYear, report.periodMonth) > thisPeriod,
        )
        .sort(
          (a, b) =>
            periodIndex(a.periodYear, a.periodMonth) -
            periodIndex(b.periodYear, b.periodMonth),
        )[0];
      const lowerBound =
        previous?.physicalProgress ?? project.initialPhysicalProgress;
      const validation = validatePhysicalProgressNonDecreasing({
        currentPhysicalProgress: physicalProgress,
        lastPhysicalProgress: lowerBound,
      });
      if (!validation.valid) {
        throw new ProgressServiceError(
          validation.error ?? "Progres fisik tidak boleh menurun.",
          409,
        );
      }
      if (next && physicalProgress > next.physicalProgress) {
        throw new ProgressServiceError(
          `Progres fisik tidak boleh melebihi pelaporan berikutnya (${next.physicalProgress}%).`,
          409,
        );
      }

      const reportId = samePeriod?.id ?? crypto.randomUUID();
      const now = new Date();
      if (samePeriod) {
        replacedAssets = (
          await transaction
            .select({ publicId: projectProgressAttachments.cloudinaryPublicId })
            .from(projectProgressAttachments)
            .where(eq(projectProgressAttachments.reportId, reportId))
        ).map((asset) => asset.publicId);
        await transaction
          .delete(projectProgressAttachments)
          .where(eq(projectProgressAttachments.reportId, reportId));
        await transaction
          .update(projectProgressReports)
          .set({
            physicalProgress,
            financialProgress,
            evaluationNotes,
            status: mode === "submit" ? "submitted" : "draft",
            submittedAt: mode === "submit" ? now : null,
            updatedAt: now,
          })
          .where(eq(projectProgressReports.id, reportId));
      } else {
        await transaction.insert(projectProgressReports).values({
          id: reportId,
          tenantId: session.tenantId,
          projectId,
          reportedBy: session.userId,
          periodMonth,
          periodYear,
          physicalProgress,
          financialProgress,
          evaluationNotes,
          status: mode === "submit" ? "submitted" : "draft",
          submittedAt: mode === "submit" ? now : null,
        });
      }

      const uploaded = [];
      for (const file of files) {
        const asset = await uploadImage(
          file,
          session.tenantId,
          projectId,
          reportId,
        );
        uploadedAssets.push(asset.publicId);
        uploaded.push({ file, asset });
      }
      await transaction.insert(projectProgressAttachments).values(
        uploaded.map(({ file, asset }) => ({
          tenantId: session.tenantId,
          reportId,
          cloudinaryPublicId: asset.publicId,
          cloudinaryAssetId: asset.assetId,
          originalName: file.name,
          mediaType: file.type,
          fileSize: file.size,
          uploadedBy: session.userId,
        })),
      );

      const [savedReport] = await transaction
        .select()
        .from(projectProgressReports)
        .where(eq(projectProgressReports.id, reportId))
        .limit(1);
      const savedAttachments = await transaction
        .select()
        .from(projectProgressAttachments)
        .where(eq(projectProgressAttachments.reportId, reportId));
      if (!savedReport)
        throw new Error("Laporan progres tersimpan tetapi tidak dapat dibaca.");
      return {
        report: toProgressReport(savedReport, savedAttachments),
        deviation: computeProgressDeviation(
          physicalProgress,
          financialProgress,
        ),
      };
    });
  } catch (error) {
    if (uploadedAssets.length) {
      try {
        await deleteCloudinaryAssets(uploadedAssets);
      } catch {
        throw new Error(
          "Gagal menyimpan progres dan membersihkan unggahan Cloudinary.",
          {
            cause: error,
          },
        );
      }
    }
    if (error instanceof ProgressServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "Laporan untuk periode ini sudah ada." },
        { status: 409 },
      );
    }
    throw error;
  }

  try {
    await deleteCloudinaryAssets(replacedAssets);
  } catch (error) {
    logger.error("project_progress.replaced_asset_cleanup_failed", {
      projectId,
      reportPeriod: `${periodYear}-${periodMonth}`,
      error:
        error instanceof Error ? error.message : "Unknown Cloudinary error",
    });
    return NextResponse.json(
      {
        ...result,
        warning:
          "Laporan tersimpan, tetapi sebagian berkas lama belum terhapus.",
      },
      { status: 201 },
    );
  }
  return NextResponse.json(result, { status: 201 });
}
