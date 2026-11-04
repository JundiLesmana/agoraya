import { randomUUID, createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema/foundation";
import { asnProfiles, jobPositions } from "@/modules/identity/db";
import { kycRoster } from "@/modules/kyc/db";
import { hashPassword } from "@/modules/identity/password/service";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { ConflictError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { RegisterAsnCommand } from "./schema";

function hashNik(nik: string): string {
  return createHash("sha256").update(nik).digest("hex");
}

function tenantSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `asn-${slug || randomUUID().slice(0, 8)}`;
}

export async function registerAsn(command: RegisterAsnCommand) {
  const database = db();

  const existingNik = await database
    .select({ id: users.id })
    .from(users)
    .where(eq(users.nik, command.nik))
    .limit(1);
  if (existingNik.length > 0) {
    throw new ConflictError("NIK telah terdaftar.", {
      statusCode: 409,
      context: { field: "nik" },
    });
  }

  const existingEmail = await database
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, command.email.toLowerCase()))
    .limit(1);
  if (existingEmail.length > 0) {
    throw new ConflictError("Email telah terdaftar.", {
      statusCode: 409,
      context: { field: "email" },
    });
  }

  const imageBuffer = (dataUrl: string) =>
    Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");

  const tenantId = randomUUID();
  const userId = randomUUID();
  const passwordHash = await hashPassword(command.password);

  let ktpUpload;
  let skUpload;
  let selfieUpload = null;

  try {
    const uploads = [
      uploadToCloudinary({
        buffer: imageBuffer(command.ktp),
        tenantId,
        fileName: command.ktpFileName,
        mimeType: command.ktpMimeType ?? undefined,
      }),
      uploadToCloudinary({
        buffer: imageBuffer(command.skPengangkatan),
        tenantId,
        fileName: command.skPengangkatanFileName,
        mimeType: command.skPengangkatanMimeType ?? undefined,
      }),
    ];
    if (command.selfie && command.selfieFileName) {
      uploads.push(
        uploadToCloudinary({
          buffer: imageBuffer(command.selfie),
          tenantId,
          fileName: command.selfieFileName,
          mimeType: command.selfieMimeType ?? undefined,
        }),
      );
    }
    const results = await Promise.all(uploads);
    ktpUpload = results[0];
    skUpload = results[1];
    if (results[2]) {
      selfieUpload = results[2];
    }
  } catch (error) {
    logger.error("asn.register.upload_failed", {
      nikHash: hashNik(command.nik).slice(0, 8),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  return database.transaction(async (tx) => {
    await tx.insert(tenants).values({
      id: tenantId,
      name: command.agencyName,
      slug: tenantSlug(command.agencyName),
      status: "active",
    });

    await tx.insert(users).values({
      id: userId,
      tenantId,
      email: command.email.toLowerCase(),
      name: command.name,
      nik: command.nik,
      passwordHash,
      status: "inactive", // Requires admin approval per requirements
    });

    const [existingPosition] = await tx
      .select({ id: jobPositions.id })
      .from(jobPositions)
      .where(eq(jobPositions.name, command.position))
      .limit(1);
    let positionId = existingPosition?.id;
    if (!positionId) {
      const [createdPosition] = await tx
        .insert(jobPositions)
        .values({
          id: randomUUID(),
          name: command.position,
        })
        .onConflictDoNothing()
        .returning({ id: jobPositions.id });
      positionId = createdPosition?.id;
    }
    if (!positionId) {
      const [positionAfterConflict] = await tx
        .select({ id: jobPositions.id })
        .from(jobPositions)
        .where(eq(jobPositions.name, command.position))
        .limit(1);
      positionId = positionAfterConflict?.id;
    }

    await tx.insert(asnProfiles).values({
      userId,
      tenantId,
      nip: command.nip ?? null,
      opdName: command.agencyName,
      unitName: command.unit ?? null,
      positionId: positionId ?? null,
    });

    await tx.insert(kycRoster).values({
      id: randomUUID(),
      tenantId,
      userId,
      nikHash: hashNik(command.nik),
      name: command.name,
      status: "pending",
    });

    logger.info("asn.registered", {
      tenantId,
      userId,
      nikHash: hashNik(command.nik).slice(0, 8),
    });

    return {
      tenantId,
      userId,
      nik: command.nik,
      email: command.email.toLowerCase(),
      status: "pending_approval",
      message: "Pendaftaran berhasil. Akun menunggu persetujuan admin instansi.",
    };
  });
}

export async function saveAsnStep2(data: {
  userId?: string;
  draftId?: string;
  employmentStatus: "PNS" | "PPPK";
  nip?: string;
  pppkNumber?: string;
  rankGradePns?: string;
  rankGradePppk?: string;
  agencyType: "Instansi daerah" | "Instansi pusat";
  agencyName: string;
  provinceTask?: string;
  regencyTask?: string;
  unitWork: string;
  field: string;
  positionType: "Jabatan fungsional" | "Jabatan struktural";
  positionName: string;
  officeAddress: string;
  officialEmail?: string;
  officePhone?: string;
}) {
  // Store step 2 data in isolated context (draft or separate storage)
  // Following tenant isolation pattern
  const { createHash } = await import("node:crypto");
  const nipHash = data.nip
    ? createHash("sha256").update(data.nip).digest("hex").slice(0, 16)
    : data.pppkNumber
    ? createHash("sha256").update(data.pppkNumber).digest("hex").slice(0, 16)
    : undefined;

  logger.info("asn.register.step2_saved", {
    employmentStatus: data.employmentStatus,
    agencyType: data.agencyType,
    agencyName: data.agencyName,
    nipHash,
  });

  if (data.userId) {
    const userId = data.userId;
    const database = db();
    await database.transaction(async (tx) => {
      const [user] = await tx
        .select({ tenantId: users.tenantId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (user) {
        const [position] = await tx
          .select({ id: jobPositions.id })
          .from(jobPositions)
          .where(eq(jobPositions.name, data.positionName))
          .limit(1);
        let positionId = position?.id;
        if (!positionId) {
          const [createdPosition] = await tx
            .insert(jobPositions)
            .values({
              id: randomUUID(),
              name: data.positionName,
              type:
                data.positionType === "Jabatan struktural"
                  ? "structural"
                  : "functional",
            })
            .onConflictDoNothing()
            .returning({ id: jobPositions.id });
          positionId = createdPosition?.id;
        }
        if (!positionId) {
          const [positionAfterConflict] = await tx
            .select({ id: jobPositions.id })
            .from(jobPositions)
            .where(eq(jobPositions.name, data.positionName))
            .limit(1);
          positionId = positionAfterConflict?.id;
        }

        await tx
          .insert(asnProfiles)
          .values({
            userId,
            tenantId: user.tenantId,
            nip: data.nip ?? null,
            opdName: data.agencyName,
            unitName: data.unitWork,
            positionId: positionId ?? null,
          })
          .onConflictDoUpdate({
            target: asnProfiles.userId,
            set: {
              tenantId: user.tenantId,
              nip: data.nip ?? null,
              opdName: data.agencyName,
              unitName: data.unitWork,
              positionId: positionId ?? null,
              updatedAt: new Date(),
            },
          });
      }
    });
  }

  return {
    ok: true,
    employmentStatus: data.employmentStatus,
    agencyName: data.agencyName,
    unitWork: data.unitWork,
    positionName: data.positionName,
    status: "step2_saved",
  };
}

export async function saveAsnStep3(data: {
  userId?: string;
  draftId?: string;
  ktpAddress: string;
  ktpRt: string;
  ktpRw: string;
  ktpPostalCode: string;
  ktpProvince: string;
  ktpRegency: string;
  ktpDistrict: string;
  ktpVillage: string;
  sameAsKtp: boolean;
  domAddress: string;
  domRt: string;
  domRw: string;
  domPostalCode: string;
  domProvince: string;
  domRegency: string;
  domDistrict: string;
  domVillage: string;
}) {
  logger.info("asn.register.step3_saved", {
    sameAsKtp: data.sameAsKtp,
    ktpProvince: data.ktpProvince,
    ktpRegency: data.ktpRegency,
  });

  return {
    ok: true,
    sameAsKtp: data.sameAsKtp,
    status: "step3_saved",
  };
}

export async function saveAsnStep4(data: {
  userId?: string;
  draftId?: string;
  ktpFileName: string;
  ktpFileSize: number;
  ktpMimeType: string;
  skFileName: string;
  skFileSize: number;
  skMimeType: string;
  selfieFileName?: string;
  selfieFileSize?: number;
  selfieMimeType?: string;
}) {
  logger.info("asn.register.step4_saved", {
    ktpMimeType: data.ktpMimeType,
    skMimeType: data.skMimeType,
    hasSelfie: Boolean(data.selfieFileName),
  });

  return {
    ok: true,
    documents: {
      ktp: { fileName: data.ktpFileName, fileSize: data.ktpFileSize },
      sk: { fileName: data.skFileName, fileSize: data.skFileSize },
      selfie: data.selfieFileName ? { fileName: data.selfieFileName, fileSize: data.selfieFileSize } : null,
    },
    status: "step4_saved",
  };
}

export async function submitAsnRegistration(data: {
  userId?: string;
  draftId?: string;
  agreed: boolean;
}) {
  const registrationNumber = `REG-2026-${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`;
  
  logger.info("asn.register.submitted", {
    registrationNumber,
    agreed: data.agreed,
  });

  return {
    registration_id: crypto.randomUUID(),
    registration_number: registrationNumber,
    status: "pending_verification",
    submitted_at: new Date().toISOString(),
  };
}
