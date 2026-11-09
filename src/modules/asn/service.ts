import { z } from "zod";

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
