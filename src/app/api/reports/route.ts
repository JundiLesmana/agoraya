import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ticketSubmissionDetails, tickets, tenants } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const categories = ["Infrastruktur", "Dugaan korupsi", "Lingkungan"] as const;
const subcategories: Record<(typeof categories)[number], string[]> = {
  Infrastruktur: [
    "Jalan rusak",
    "Jembatan rusak",
    "Lampu jalan",
    "Fasilitas umum",
    "Lainnya",
  ],
  "Dugaan korupsi": [
    "Penyalahgunaan anggaran",
    "Pungutan liar",
    "Penyalahgunaan wewenang",
    "Lainnya",
  ],
  Lingkungan: [
    "Sampah menumpuk",
    "Pencemaran",
    "Saluran tersumbat",
    "Kerusakan ruang hijau",
    "Lainnya",
  ],
};
const submissionSchema = z
  .object({
    category: z.enum(categories),
    subcategory: z.string().trim().min(1).max(100),
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().min(50).max(10_000),
    province: z.string().trim().min(1).max(100),
    city: z.string().trim().min(1).max(100),
    location: z.string().trim().min(1).max(2_000),
    name: z.string().trim().max(255),
    email: z.string().trim().email().max(255),
    phone: z
      .string()
      .trim()
      .refine((value) =>
        /^(?:\+62|62|0)8[1-9]\d{6,11}$/.test(value.replace(/[\s()-]/g, "")),
      ),
    isPublic: z.boolean(),
    showIdentity: z.boolean(),
    attachments: z.array(z.string().trim().min(1).max(255)).max(5),
  })
  .refine(
    (values) => subcategories[values.category].includes(values.subcategory),
    {
      path: ["subcategory"],
      message: "Subkategori tidak sesuai dengan kategori laporan.",
    },
  )
  .refine(
    (values) =>
      values.isPublic && values.showIdentity ? values.name.length > 0 : true,
    { path: ["name"], message: "Nama wajib diisi jika identitas ditampilkan." },
  );

async function getReportingTenantId(): Promise<string | null> {
  const database = db();
  const configuredTenantId = process.env.REPORTING_TENANT_ID?.trim();
  if (configuredTenantId) {
    if (!z.string().uuid().safeParse(configuredTenantId).success) return null;
    const [tenant] = await database
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.id, configuredTenantId))
      .limit(1);
    return tenant?.id ?? null;
  }

  if (process.env.NODE_ENV === "production") return null;

  const [tenant] = await database
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, "agoraya-local-testing"))
    .limit(1);
  return tenant?.id ?? null;
}

function isAsnRole(roles: readonly string[]): boolean {
  return roles.some((role) =>
    ["asn", "staff", "admin", "superadmin"].includes(role),
  );
}

export async function GET(): Promise<Response> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "Autentikasi diperlukan." },
        { status: 401 },
      );
    }
    if (!isAsnRole(session.roles)) {
      return NextResponse.json(
        { error: "Akses ASN diperlukan." },
        { status: 403 },
      );
    }

    const rows = await db()
      .select({
        id: tickets.id,
        title: tickets.title,
        description: tickets.description,
        category: tickets.category,
        status: tickets.status,
        submittedAt: tickets.submittedAt,
        responseDueAt: tickets.responseDueAt,
        reportNumber: ticketSubmissionDetails.reportNumber,
        subcategory: ticketSubmissionDetails.subcategory,
        province: ticketSubmissionDetails.province,
        city: ticketSubmissionDetails.city,
        address: ticketSubmissionDetails.address,
        reporterName: ticketSubmissionDetails.reporterName,
        reporterEmail: ticketSubmissionDetails.reporterEmail,
        reporterPhone: ticketSubmissionDetails.reporterPhone,
        isPublic: ticketSubmissionDetails.isPublic,
        showIdentity: ticketSubmissionDetails.showIdentity,
        attachments: ticketSubmissionDetails.attachmentNames,
      })
      .from(tickets)
      .innerJoin(
        ticketSubmissionDetails,
        eq(ticketSubmissionDetails.ticketId, tickets.id),
      )
      .where(eq(tickets.tenantId, session.tenantId))
      .orderBy(desc(tickets.submittedAt));

    return NextResponse.json({ reports: rows });
  } catch (error) {
    logger.error("reports.list_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Gagal memuat laporan dari basis data." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Isi laporan tidak valid." },
      { status: 400 },
    );
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Periksa kembali kategori dan kelengkapan laporan." },
      { status: 400 },
    );
  }

  try {
    const tenantId = await getReportingTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant tujuan laporan belum dikonfigurasi." },
        { status: 503 },
      );
    }

    const database = db();
    const now = new Date();
    const id = randomUUID();
    const reportNumber = `LP-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${id.slice(0, 12).toUpperCase()}`;
    const responseDueAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const input = parsed.data;

    await database.transaction(async (transaction) => {
      await transaction.insert(tickets).values({
        id,
        tenantId,
        citizenId: null,
        category: input.category,
        title: input.title,
        description: input.description,
        status: "submitted",
        urgency: "medium",
        location: {
          province: input.province,
          city: input.city,
          address: input.location,
        },
        submittedAt: now,
        responseDueAt,
        createdAt: now,
        updatedAt: now,
      });

      await transaction.insert(ticketSubmissionDetails).values({
        ticketId: id,
        reportNumber,
        subcategory: input.subcategory,
        province: input.province,
        city: input.city,
        address: input.location,
        reporterName:
          input.isPublic && input.showIdentity ? input.name || null : null,
        reporterEmail: input.email,
        reporterPhone: input.phone.replace(/[\s()-]/g, ""),
        isPublic: input.isPublic,
        showIdentity: input.isPublic && input.showIdentity,
        attachmentNames: input.attachments,
        createdAt: now,
        updatedAt: now,
      });
    });

    return NextResponse.json(
      { reportNumber, submittedAt: now.toISOString() },
      { status: 201 },
    );
  } catch (error) {
    const dbError = error as { code?: string; detail?: string; cause?: { message?: string; code?: string; detail?: string } };
    logger.error("reports.submit_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode: dbError.code ?? dbError.cause?.code,
      errorDetail: dbError.detail ?? dbError.cause?.detail,
      errorCause: dbError.cause?.message,
    });
    return NextResponse.json(
      { error: "Laporan gagal disimpan. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
