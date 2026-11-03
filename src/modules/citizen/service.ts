import { randomUUID, createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema/foundation";
import { kycRoster } from "@/modules/kyc/db";
import { citizenProfiles, citizenAttachments } from "@/modules/citizen/db";
import { hashPassword } from "@/modules/identity/password/service";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { ConflictError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { RegisterCitizenCommand } from "./schema";

function hashNik(nik: string): string {
  return createHash("sha256").update(nik).digest("hex");
}

function tenantSlug(nik: string): string {
  return `c-${nik}`;
}

export async function registerCitizen(command: RegisterCitizenCommand) {
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
  const profileId = randomUUID();
  const passwordHash = await hashPassword(command.password);

  let ktpUpload;
  let selfieUpload;
  try {
    [ktpUpload, selfieUpload] = await Promise.all([
      uploadToCloudinary({
        buffer: imageBuffer(command.attachment),
        tenantId,
        fileName: command.attachmentFileName,
        mimeType: command.attachmentMimeType ?? undefined,
      }),
      uploadToCloudinary({
        buffer: imageBuffer(command.selfie),
        tenantId,
        fileName: command.selfieFileName,
        mimeType: command.selfieMimeType ?? undefined,
      }),
    ]);
  } catch (error) {
    logger.error("citizen.register.upload_failed", {
      nikHash: hashNik(command.nik).slice(0, 8),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  return database.transaction(async (tx) => {
    await tx.insert(tenants).values({
      id: tenantId,
      name: `Warga ${command.name}`,
      slug: tenantSlug(command.nik),
      status: "active",
    });

    await tx.insert(users).values({
      id: userId,
      tenantId,
      email: command.email.toLowerCase(),
      name: command.name,
      nik: command.nik,
      passwordHash,
      status: "active",
    });

    await tx.insert(kycRoster).values({
      id: randomUUID(),
      tenantId,
      userId,
      nikHash: hashNik(command.nik),
      name: command.name,
      status: "pending",
    });

    await tx.insert(citizenProfiles).values({
      id: profileId,
      tenantId,
      userId,
      nik: command.nik,
      name: command.name,
      email: command.email.toLowerCase(),
      phone: command.phone,
      address: null,
      ktpAttachmentPublicId: ktpUpload.publicId,
      ktpAttachmentUrl: ktpUpload.secureUrl,
      selfieAttachmentPublicId: selfieUpload.publicId,
      selfieAttachmentUrl: selfieUpload.secureUrl,
      status: "pending",
    });

    await tx.insert(citizenAttachments).values([
      {
        id: randomUUID(),
        tenantId,
        citizenProfileId: profileId,
        cloudinaryPublicId: ktpUpload.publicId,
        cloudinarySecureUrl: ktpUpload.secureUrl,
        resourceType: ktpUpload.resourceType,
        attachmentType: "ktp",
        fileName: command.attachmentFileName,
        mimeType: ktpUpload.mimeType ?? null,
        size: ktpUpload.size ?? null,
      },
      {
        id: randomUUID(),
        tenantId,
        citizenProfileId: profileId,
        cloudinaryPublicId: selfieUpload.publicId,
        cloudinarySecureUrl: selfieUpload.secureUrl,
        resourceType: selfieUpload.resourceType,
        attachmentType: "selfie",
        fileName: command.selfieFileName,
        mimeType: selfieUpload.mimeType ?? null,
        size: selfieUpload.size ?? null,
      },
    ]);

    logger.info("citizen.registered", {
      tenantId,
      userId,
      profileId,
      nikHash: hashNik(command.nik).slice(0, 8),
    });

    return {
      tenantId,
      userId,
      profileId,
      nik: command.nik,
      email: command.email.toLowerCase(),
      ktpAttachmentUrl: ktpUpload.secureUrl,
      selfieAttachmentUrl: selfieUpload.secureUrl,
      status: "pending",
    };
  });
}
