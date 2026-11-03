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
const fileMimeTypeSchema = z
  .enum(["image/jpeg", "image/png", "application/pdf"])
  .optional();

export const registerAsnSchema = z.strictObject({
  nik: nikSchema,
  name: nameSchema,
  birthPlace: z.string().min(1, "Tempat lahir wajib diisi").max(255),
  birthDate: z.string().min(1, "Tanggal lahir wajib diisi"),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1),
  agencyName: z.string().min(1, "Nama instansi wajib diisi").max(255),
  nip: z.string().optional(),
  position: z.string().min(1, "Jabatan wajib diisi").max(255),
  unit: z.string().optional(),
  appointmentDate: z.string().optional(),
  address: z.string().min(1, "Alamat lengkap wajib diisi").max(500),
  rtRw: z.string().optional(),
  village: z.string().min(1, "Kelurahan wajib diisi").max(255),
  district: z.string().min(1, "Kecamatan wajib diisi").max(255),
  regency: z.string().min(1, "Kabupaten/Kota wajib diisi").max(255),
  province: z.string().min(1, "Provinsi wajib diisi").max(255),
  postalCode: z.string().optional(),
  ktp: imageDataUrlSchema("KTP"),
  ktpFileName: fileNameSchema,
  ktpMimeType: fileMimeTypeSchema,
  skPengangkatan: imageDataUrlSchema("SK Pengangkatan"),
  skPengangkatanFileName: fileNameSchema,
  skPengangkatanMimeType: fileMimeTypeSchema,
  selfie: imageDataUrlSchema("Foto diri").optional(),
  selfieFileName: fileNameSchema.optional(),
  selfieMimeType: z.enum(["image/jpeg", "image/png"]).optional(),
  agreement: z.literal(true, { message: "Persetujuan wajib dicentang" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi password tidak sama",
  path: ["confirmPassword"],
});

export type RegisterAsnCommand = z.infer<typeof registerAsnSchema>;
