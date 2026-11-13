import { z } from "zod";
import { and, eq, or } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { hashPassword } from "@/modules/identity/password/service";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import {
  asnProfiles,
  asnRegistrationAttachments,
  asnRegistrationDetails,
  users,
} from "@/modules/identity/db";
import { kycRoster } from "@/modules/kyc/db";
import { tenants } from "@/lib/db/schema";

const nikSchema = z
  .string()
  .min(16, "NIK harus 16 digit")
  .max(16, "NIK harus 16 digit")
  .regex(/^\d{16}$/, "NIK harus 16 digit angka");

const emailSchema = z.string().email("Format email tidak valid").min(1).max(255);

const phoneSchema = z
  .string()
  .min(8, "Nomor telepon minimal 8 digit")
  .max(32, "Nomor telepon terlalu panjang")
  .regex(/^[\d+\s()-]+$/, "Nomor telepon tidak valid");

const nameSchema = z.string().min(2, "Nama minimal 2 karakter").max(255);
const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const timestamp = Date.parse(value);
    return (
      Number.isFinite(timestamp) &&
      new Date(timestamp).toISOString().slice(0, 10) === value
    );
  });

const passwordSchema = z
  .string()
  .min(12, "Kata sandi minimal 12 karakter")
  .max(128, "Kata sandi terlalu panjang")
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
    "Kata sandi harus kombinasi huruf, angka, dan simbol",
  );

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = Math.ceil(MAX_IMAGE_SIZE / 3) * 4 + 64;

const imageDataUrlSchema = (label: string) =>
  z
    .string()
    .min(1, `${label} harus diunggah`)
    .max(MAX_DATA_URL_LENGTH, `${label} maksimal 5 MB`)
    .refine((value) => {
      const match =
        /^data:(?:image\/(?:jpeg|png)|application\/pdf);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
          value,
        );
      if (!match) return false;
      const base64 = match[1];
      const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
      return Math.floor((base64.length * 3) / 4) - padding <= MAX_IMAGE_SIZE;
    }, `${label} harus berupa JPG, PNG, atau PDF maksimal 5 MB`);

const fileNameSchema = z.string().min(1).max(255);
const fileMimeTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

export const registerAsnSchema = z.strictObject({
  nik: nikSchema,
  name: nameSchema,
  birthPlace: z.string().min(1, "Tempat lahir wajib diisi").max(255),
  birthDate: dateOnlySchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1),
  employmentStatus: z.enum(["PNS", "PPPK"]),
  agencyName: z.string().min(1, "Nama instansi wajib diisi").max(255),
  agencyType: z.enum(["Instansi daerah", "Instansi pusat"]),
  nip: z.string().optional(),
  pppkNumber: z.string().optional(),
  rankGradePns: z.string().optional(),
  rankGradePppk: z.string().optional(),
  position: z.string().min(1, "Jabatan wajib diisi").max(255),
  positionType: z.enum(["Jabatan fungsional", "Jabatan struktural"]),
  unit: z.string().optional(),
  appointmentDate: dateOnlySchema.optional(),
  provinceTask: z.string().optional(),
  regencyTask: z.string().optional(),
  field: z.string().min(1).max(255),
  officeAddress: z.string().min(1).max(500),
  officialEmail: z.string().email().optional(),
  officePhone: phoneSchema.optional(),
  address: z.string().min(1, "Alamat lengkap wajib diisi").max(500),
  rtRw: z.string().regex(/^\d{3}\/\d{3}$/),
  village: z.string().min(1, "Kelurahan wajib diisi").max(255),
  district: z.string().min(1, "Kecamatan wajib diisi").max(255),
  regency: z.string().min(1, "Kabupaten/Kota wajib diisi").max(255),
  province: z.string().min(1, "Provinsi wajib diisi").max(255),
  postalCode: z.string().regex(/^\d{5}$/),
  domicileSameAsKtp: z.boolean(),
  domicileAddress: z.string().min(1).max(500),
  domicileRt: z.string().regex(/^\d{3}$/),
  domicileRw: z.string().regex(/^\d{3}$/),
  domicileVillage: z.string().min(1).max(255),
  domicileDistrict: z.string().min(1).max(255),
  domicileRegency: z.string().min(1).max(255),
  domicileProvince: z.string().min(1).max(255),
  domicilePostalCode: z.string().regex(/^\d{5}$/),
  ktp: imageDataUrlSchema("KTP"),
  ktpFileName: fileNameSchema,
  ktpMimeType: fileMimeTypeSchema,
  skPengangkatan: imageDataUrlSchema("SK Pengangkatan"),
  skPengangkatanFileName: fileNameSchema,
  skPengangkatanMimeType: fileMimeTypeSchema,
  idCard: imageDataUrlSchema("Kartu pegawai"),
  idCardFileName: fileNameSchema,
  idCardMimeType: fileMimeTypeSchema,
  selfie: imageDataUrlSchema("Foto diri").optional(),
  selfieFileName: fileNameSchema.optional(),
  selfieMimeType: z.enum(["image/jpeg", "image/png"]).optional(),
  agreement: z.literal(true, { message: "Persetujuan wajib dicentang" }),
}).superRefine((data, context) => {
  if (data.password !== data.confirmPassword) {
    context.addIssue({
      code: "custom",
      message: "Konfirmasi password tidak sama",
      path: ["confirmPassword"],
    });
  }

  const isPns = data.employmentStatus === "PNS";
  const employeeNumber = isPns ? data.nip : data.pppkNumber;
  const rankGrade = isPns ? data.rankGradePns : data.rankGradePppk;
  if (!employeeNumber || !/^\d{18}$/.test(employeeNumber)) {
    context.addIssue({
      code: "custom",
      message: "Nomor induk kepegawaian harus 18 digit angka",
      path: [isPns ? "nip" : "pppkNumber"],
    });
  }
  if (!rankGrade?.trim()) {
    context.addIssue({
      code: "custom",
      message: "Pangkat/golongan wajib diisi",
      path: [isPns ? "rankGradePns" : "rankGradePppk"],
    });
  }

  const uploadedImages: Array<{
    data: string;
    mimeType: string | undefined;
    field: "ktpMimeType" | "skPengangkatanMimeType" | "idCardMimeType" | "selfieMimeType";
  }> = [
    { data: data.ktp, mimeType: data.ktpMimeType, field: "ktpMimeType" },
    {
      data: data.skPengangkatan,
      mimeType: data.skPengangkatanMimeType,
      field: "skPengangkatanMimeType",
    },
    { data: data.idCard, mimeType: data.idCardMimeType, field: "idCardMimeType" },
    ...(data.selfie
      ? [
          {
            data: data.selfie,
            mimeType: data.selfieMimeType,
            field: "selfieMimeType" as const,
          },
        ]
      : []),
  ];

  for (const image of uploadedImages) {
    const dataUrlMimeType = /^data:(image\/(?:jpeg|png)|application\/pdf);base64,/.exec(
      image.data,
    )?.[1];
    if (image.mimeType && image.mimeType !== dataUrlMimeType) {
      context.addIssue({
        code: "custom",
        message: "Tipe berkas tidak sesuai dengan dokumen yang diunggah",
        path: [image.field],
      });
    }
    if (image.field === "selfieMimeType" && dataUrlMimeType === "application/pdf") {
      context.addIssue({
        code: "custom",
        message: "Foto diri harus berupa JPG atau PNG",
        path: ["selfie"],
      });
    }
  }

  if (
    Boolean(data.selfie) !== Boolean(data.selfieFileName) ||
    Boolean(data.selfie) !== Boolean(data.selfieMimeType)
  ) {
    context.addIssue({
      code: "custom",
      message: "Nama berkas dan foto diri harus dikirim bersama",
      path: ["selfieFileName"],
    });
  }
});

export type RegisterAsnCommand = z.infer<typeof registerAsnSchema>;

function dataUrlToBuffer(dataUrl: string): Buffer {
  const match = /^data:[^;]+;base64,(.*)$/.exec(dataUrl);
  if (!match) throw new ValidationError("Format data berkas tidak valid.");
  return Buffer.from(match[1], "base64");
}

async function resolveAsnTenantId(database: ReturnType<typeof db>): Promise<string> {
  const env = getEnv();
  if (env.ASN_KYC_TENANT_ID) return env.ASN_KYC_TENANT_ID;
  const [tenant] = await database
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.status, "active"))
    .limit(1);
  if (tenant) return tenant.id;
  const [created] = await database
    .insert(tenants)
    .values({ id: randomUUID(), name: "Agoraya", slug: "agoraya", status: "active" })
    .returning({ id: tenants.id });
  return created.id;
}

async function findAsnRegistration(
  database: ReturnType<typeof db>,
  tenantId: string,
  userId: string,
) {
  const [row] = await database
    .select({ id: asnRegistrationDetails.id })
    .from(asnRegistrationDetails)
    .where(
      and(
        eq(asnRegistrationDetails.userId, userId),
        eq(asnRegistrationDetails.tenantId, tenantId),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError("Pendaftaran ASN tidak ditemukan.");
  return row;
}

export async function saveAsnStep1(command: {
  readonly nik: string;
  readonly name: string;
  readonly birthPlace: string;
  readonly birthDate: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
}) {
  const database = db();
  const tenantId = await resolveAsnTenantId(database);

  const existing = await database
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.tenantId, tenantId),
        or(eq(users.nik, command.nik), eq(users.email, command.email)),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    throw new ConflictError("NIK atau email sudah terdaftar.");
  }

  const userId = randomUUID();
  const passwordHash = await hashPassword(command.password);

  return database.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        id: userId,
        tenantId,
        email: command.email,
        name: command.name,
        nik: command.nik,
        passwordHash,
        status: "inactive",
      })
      .returning({ id: users.id });

    await tx.insert(asnProfiles).values({
      userId: user.id,
      tenantId,
      nip: null,
      opdName: null,
      unitName: null,
    });

    logger.info("asn.step1.saved", { userId: user.id, tenantId, nik: command.nik });

    return { userId: user.id };
  });
}

export async function registerAsn(command: RegisterAsnCommand) {
  const database = db();
  const tenantId = await resolveAsnTenantId(database);

  const passwordHash = await hashPassword(command.password);
  const isPns = command.employmentStatus === "PNS";
  const employeeNumber = (isPns ? command.nip : command.pppkNumber) ?? "";
  const rankGrade = (isPns ? command.rankGradePns : command.rankGradePppk) ?? "";
  const [ktpRt, ktpRw] = command.rtRw.split("/");

  return database.transaction(async (tx) => {
    // Reuse an existing draft user (created at step 1) or create a new one.
    let userId: string;
    const [existingUser] = await tx
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          or(eq(users.nik, command.nik), eq(users.email, command.email)),
        ),
      )
      .limit(1);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const [created] = await tx
        .insert(users)
        .values({
          id: randomUUID(),
          tenantId,
          email: command.email,
          name: command.name,
          nik: command.nik,
          passwordHash,
          status: "inactive",
        })
        .returning({ id: users.id });
      userId = created.id;
    }

    await tx
      .insert(asnProfiles)
      .values({
        userId,
        tenantId,
        nip: command.nip ?? null,
        opdName: command.agencyName,
        unitName: command.unit ?? null,
      })
      .onConflictDoUpdate({
        target: asnProfiles.userId,
        set: {
          opdName: command.agencyName,
          unitName: command.unit ?? null,
        },
      });

    const [registration] = await tx
      .insert(asnRegistrationDetails)
      .values({
        id: randomUUID(),
        tenantId,
        userId,
        birthPlace: command.birthPlace,
        birthDate: command.birthDate,
        phone: command.phone,
        employmentStatus: command.employmentStatus,
        employeeNumber,
        rankGrade,
        appointmentDate: command.appointmentDate ?? null,
        agencyType: command.agencyType,
        provinceTask: command.provinceTask ?? null,
        regencyTask: command.regencyTask ?? null,
        field: command.field,
        officeAddress: command.officeAddress,
        officialEmail: command.officialEmail ?? null,
        officePhone: command.officePhone ?? null,
        ktpAddress: command.address,
        ktpRt,
        ktpRw,
        ktpPostalCode: command.postalCode,
        ktpProvince: command.province,
        ktpRegency: command.regency,
        ktpDistrict: command.district,
        ktpVillage: command.village,
        domicileSameAsKtp: command.domicileSameAsKtp,
        domicileAddress: command.domicileAddress,
        domicileRt: command.domicileRt,
        domicileRw: command.domicileRw,
        domicilePostalCode: command.domicilePostalCode,
        domicileProvince: command.domicileProvince,
        domicileRegency: command.domicileRegency,
        domicileDistrict: command.domicileDistrict,
        domicileVillage: command.domicileVillage,
      })
      .returning({ id: asnRegistrationDetails.id })
      .onConflictDoUpdate({
        target: asnRegistrationDetails.userId,
        set: {
          birthPlace: command.birthPlace,
          birthDate: command.birthDate,
          phone: command.phone,
          employmentStatus: command.employmentStatus,
          employeeNumber,
          rankGrade,
          appointmentDate: command.appointmentDate ?? null,
          agencyType: command.agencyType,
          provinceTask: command.provinceTask ?? null,
          regencyTask: command.regencyTask ?? null,
          field: command.field,
          officeAddress: command.officeAddress,
          officialEmail: command.officialEmail ?? null,
          officePhone: command.officePhone ?? null,
          ktpAddress: command.address,
          ktpRt,
          ktpRw,
          ktpPostalCode: command.postalCode,
          ktpProvince: command.province,
          ktpRegency: command.regency,
          ktpDistrict: command.district,
          ktpVillage: command.village,
          domicileSameAsKtp: command.domicileSameAsKtp,
          domicileAddress: command.domicileAddress,
          domicileRt: command.domicileRt,
          domicileRw: command.domicileRw,
          domicilePostalCode: command.domicilePostalCode,
          domicileProvince: command.domicileProvince,
          domicileRegency: command.domicileRegency,
          domicileDistrict: command.domicileDistrict,
          domicileVillage: command.domicileVillage,
        },
      });

    // Replace attachments for this registration (idempotent on re-submit).
    await tx
      .delete(asnRegistrationAttachments)
      .where(
        and(
          eq(asnRegistrationAttachments.registrationId, registration.id),
          eq(asnRegistrationAttachments.tenantId, tenantId),
        ),
      );

    const attachments = [
      {
        data: command.ktp,
        fileName: command.ktpFileName,
        mimeType: command.ktpMimeType,
        type: "ktp",
      },
      {
        data: command.skPengangkatan,
        fileName: command.skPengangkatanFileName,
        mimeType: command.skPengangkatanMimeType,
        type: "sk_pengangkatan",
      },
      {
        data: command.idCard,
        fileName: command.idCardFileName,
        mimeType: command.idCardMimeType,
        type: "id_card",
      },
      ...(command.selfie && command.selfieFileName
        ? [
            {
              data: command.selfie,
              fileName: command.selfieFileName,
              mimeType: command.selfieMimeType,
              type: "selfie",
            },
          ]
        : []),
    ];

    for (const attachment of attachments) {
      const buffer = dataUrlToBuffer(attachment.data);
      const uploaded = await uploadToCloudinary({
        buffer,
        tenantId,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        category: "asn",
        module: "registration",
      });
      await tx.insert(asnRegistrationAttachments).values({
        id: randomUUID(),
        tenantId,
        registrationId: registration.id,
        cloudinaryPublicId: uploaded.publicId,
        cloudinarySecureUrl: uploaded.secureUrl,
        resourceType: uploaded.resourceType,
        attachmentType: attachment.type,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        size: uploaded.size ?? undefined,
      });
    }

    // Hubungkan data pendaftaran ASN ke verifikasi KYC (kyc_roster).
    const nikHash = createHash("sha256").update(command.nik).digest("hex");
    const [existingRoster] = await tx
      .select({ id: kycRoster.id, status: kycRoster.status })
      .from(kycRoster)
      .where(
        and(eq(kycRoster.userId, userId), eq(kycRoster.tenantId, tenantId)),
      )
      .limit(1);

    let rosterId: string;
    let rosterStatus: string;
    if (!existingRoster) {
      const [roster] = await tx
        .insert(kycRoster)
        .values({
          id: randomUUID(),
          tenantId,
          userId,
          nikHash,
          name: command.name,
          status: "pending",
          submittedBy: userId,
        })
        .returning({ id: kycRoster.id, status: kycRoster.status });
      rosterId = roster.id;
      rosterStatus = roster.status;
    } else {
      rosterId = existingRoster.id;
      rosterStatus = existingRoster.status;
    }

    logger.info("asn.registered", {
      userId,
      tenantId,
      nik: command.nik,
      rosterId,
    });

    const [user] = await tx
      .select({
        id: users.id,
        email: users.email,
        nik: users.nik,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return {
      message: "Pendaftaran ASN berhasil. Berkas Anda sedang diverifikasi.",
      nik: user?.nik ?? command.nik,
      email: user?.email ?? command.email,
      status: user?.status ?? "inactive",
      rosterId,
      statusKyc: rosterStatus,
    };
  });
}

export async function saveAsnStep2(command: {
  readonly userId?: string;
  readonly draftId?: string;
  readonly employmentStatus: "PNS" | "PPPK";
  readonly nip?: string;
  readonly pppkNumber?: string;
  readonly rankGradePns?: string;
  readonly rankGradePppk?: string;
  readonly agencyType: "Instansi daerah" | "Instansi pusat";
  readonly agencyName: string;
  readonly provinceTask?: string;
  readonly regencyTask?: string;
  readonly unitWork: string;
  readonly field: string;
  readonly positionType: "Jabatan fungsional" | "Jabatan struktural";
  readonly positionName: string;
  readonly officeAddress: string;
  readonly officialEmail?: string;
  readonly officePhone?: string;
  readonly birthPlace: string;
  readonly birthDate: string;
  readonly phone: string;
}) {
  const database = db();
  const tenantId = await resolveAsnTenantId(database);
  const userId = command.userId;
  if (!userId) throw new ValidationError("User ID wajib diisi.");

  const existing = await database
    .select({ id: asnRegistrationDetails.id })
    .from(asnRegistrationDetails)
    .where(
      and(
        eq(asnRegistrationDetails.userId, userId),
        eq(asnRegistrationDetails.tenantId, tenantId),
      ),
    )
    .limit(1);

  const isPns = command.employmentStatus === "PNS";
  const employeeNumber = (isPns ? command.nip : command.pppkNumber) ?? "";
  const rankGrade = (isPns ? command.rankGradePns : command.rankGradePppk) ?? "";
  const ktpRt = "";
  const ktpRw = "";

  let registrationId: string;
  if (existing.length > 0) {
    registrationId = existing[0].id;
    await database
      .update(asnRegistrationDetails)
      .set({
        employmentStatus: command.employmentStatus,
        employeeNumber,
        rankGrade,
        agencyType: command.agencyType,
        provinceTask: command.provinceTask ?? null,
        regencyTask: command.regencyTask ?? null,
        field: command.field,
        officeAddress: command.officeAddress,
        officialEmail: command.officialEmail ?? null,
        officePhone: command.officePhone ?? null,
        birthPlace: command.birthPlace ?? undefined,
        birthDate: command.birthDate ?? undefined,
        phone: command.phone ?? undefined,
        ktpRt,
        ktpRw,
      })
      .where(
        and(
          eq(asnRegistrationDetails.id, registrationId),
          eq(asnRegistrationDetails.tenantId, tenantId),
        ),
      );
  } else {
    const [created] = await database
      .insert(asnRegistrationDetails)
      .values({
        id: randomUUID(),
        tenantId,
        userId,
        birthPlace: command.birthPlace,
        birthDate: command.birthDate,
        phone: command.phone,
        employmentStatus: command.employmentStatus,
        employeeNumber,
        rankGrade,
        appointmentDate: null,
        agencyType: command.agencyType,
        provinceTask: command.provinceTask ?? null,
        regencyTask: command.regencyTask ?? null,
        field: command.field,
        officeAddress: command.officeAddress,
        officialEmail: command.officialEmail ?? null,
        officePhone: command.officePhone ?? null,
        ktpAddress: "",
        ktpRt,
        ktpRw,
        ktpPostalCode: "",
        ktpProvince: "",
        ktpRegency: "",
        ktpDistrict: "",
        ktpVillage: "",
        domicileSameAsKtp: false,
        domicileAddress: "",
        domicileRt: "",
        domicileRw: "",
        domicilePostalCode: "",
        domicileProvince: "",
        domicileRegency: "",
        domicileDistrict: "",
        domicileVillage: "",
      })
      .returning({ id: asnRegistrationDetails.id });
    registrationId = created.id;
  }

  await database
    .update(asnProfiles)
    .set({ opdName: command.agencyName, unitName: command.unitWork })
    .where(
      and(eq(asnProfiles.userId, userId), eq(asnProfiles.tenantId, tenantId)),
    );

  return { userId, registrationId };
}

export async function saveAsnStep3(command: {
  readonly userId?: string;
  readonly draftId?: string;
  readonly ktpAddress: string;
  readonly ktpRt: string;
  readonly ktpRw: string;
  readonly ktpPostalCode: string;
  readonly ktpProvince: string;
  readonly ktpRegency: string;
  readonly ktpDistrict: string;
  readonly ktpVillage: string;
  readonly sameAsKtp: boolean;
  readonly domAddress: string;
  readonly domRt: string;
  readonly domRw: string;
  readonly domPostalCode: string;
  readonly domProvince: string;
  readonly domRegency: string;
  readonly domDistrict: string;
  readonly domVillage: string;
}) {
  const database = db();
  const tenantId = await resolveAsnTenantId(database);
  const userId = command.userId;
  if (!userId) throw new ValidationError("User ID wajib diisi.");

  const registration = await findAsnRegistration(database, tenantId, userId);

  await database
    .update(asnRegistrationDetails)
    .set({
      ktpAddress: command.ktpAddress,
      ktpRt: command.ktpRt,
      ktpRw: command.ktpRw,
      ktpPostalCode: command.ktpPostalCode,
      ktpProvince: command.ktpProvince,
      ktpRegency: command.ktpRegency,
      ktpDistrict: command.ktpDistrict,
      ktpVillage: command.ktpVillage,
      domicileSameAsKtp: command.sameAsKtp,
      domicileAddress: command.domAddress,
      domicileRt: command.domRt,
      domicileRw: command.domRw,
      domicilePostalCode: command.domPostalCode,
      domicileProvince: command.domProvince,
      domicileRegency: command.domRegency,
      domicileDistrict: command.domDistrict,
      domicileVillage: command.domVillage,
    })
    .where(
      and(
        eq(asnRegistrationDetails.id, registration.id),
        eq(asnRegistrationDetails.tenantId, tenantId),
      ),
    );

  return { userId, registrationId: registration.id };
}

export async function saveAsnStep4(command: {
  readonly userId?: string;
  readonly draftId?: string;
  readonly ktpFileName: string;
  readonly ktpFileSize: number;
  readonly ktpMimeType: "image/jpeg" | "image/png" | "application/pdf";
  readonly skFileName: string;
  readonly skFileSize: number;
  readonly skMimeType: "image/jpeg" | "image/png" | "application/pdf";
  readonly selfieFileName?: string;
  readonly selfieFileSize?: number;
  readonly selfieMimeType?: "image/jpeg" | "image/png";
}) {
  const database = db();
  const tenantId = await resolveAsnTenantId(database);
  const userId = command.userId;
  if (!userId) throw new ValidationError("User ID wajib diisi.");

  const registration = await findAsnRegistration(database, tenantId, userId);

  const updateAttachment = async (
    type: string,
    fileName: string,
    mimeType: string | undefined,
    size: number | undefined,
  ) => {
    await database
      .update(asnRegistrationAttachments)
      .set({ fileName, mimeType: mimeType ?? null, size: size ?? null })
      .where(
        and(
          eq(asnRegistrationAttachments.registrationId, registration.id),
          eq(asnRegistrationAttachments.attachmentType, type),
          eq(asnRegistrationAttachments.tenantId, tenantId),
        ),
      );
  };

  await updateAttachment(
    "ktp",
    command.ktpFileName,
    command.ktpMimeType,
    command.ktpFileSize,
  );
  await updateAttachment(
    "sk_pengangkatan",
    command.skFileName,
    command.skMimeType,
    command.skFileSize,
  );
  if (command.selfieFileName) {
    await updateAttachment(
      "selfie",
      command.selfieFileName,
      command.selfieMimeType,
      command.selfieFileSize ?? undefined,
    );
  }

  return { userId, registrationId: registration.id };
}

export async function submitAsnRegistration(command: {
  readonly userId?: string;
  readonly draftId?: string;
  readonly agreed: true;
}) {
  const database = db();
  const tenantId = await resolveAsnTenantId(database);
  const userId = command.userId;
  if (!userId) throw new ValidationError("User ID wajib diisi.");
  if (!command.agreed) throw new ValidationError("Persetujuan wajib dicentang.");

  const registration = await findAsnRegistration(database, tenantId, userId);

  const [user] = await database
    .select({ id: users.id, nik: users.nik, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) throw new NotFoundError("Pengguna tidak ditemukan.");
  if (!user.nik) throw new ValidationError("NIK pengguna tidak tersedia.");

  const nikHash = createHash("sha256").update(user.nik).digest("hex");

  const [roster] = await database
    .insert(kycRoster)
    .values({
      id: randomUUID(),
      tenantId,
      userId,
      nikHash,
      name: user.name,
      status: "pending",
      submittedBy: userId,
    })
    .returning({ id: kycRoster.id, status: kycRoster.status });

  logger.info("asn.registration.submitted", {
    userId,
    tenantId,
    registrationId: registration.id,
    rosterId: roster.id,
  });

  return {
    registrationId: registration.id,
    rosterId: roster.id,
    status: roster.status,
    nik: user.nik,
  };
}
