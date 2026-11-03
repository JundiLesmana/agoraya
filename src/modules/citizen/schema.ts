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
  .min(8, "Kata sandi minimal 8 karakter")
  .max(128, "Kata sandi terlalu panjang");

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = Math.ceil(MAX_IMAGE_SIZE / 3) * 4 + 64;
const imageDataUrlSchema = (label: string) => z
  .string()
  .min(1, `${label} harus diunggah`)
  .max(MAX_DATA_URL_LENGTH, `${label} maksimal 5 MB`)
  .refine((value) => {
    const match = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match) return false;
    const base64 = match[1];
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    return Math.floor((base64.length * 3) / 4) - padding <= MAX_IMAGE_SIZE;
  }, `${label} harus berupa JPG, PNG, atau WEBP maksimal 5 MB`);

const imageFileNameSchema = z.string().min(1).max(255);
const imageMimeTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]).optional();

export const registerCitizenSchema = z.strictObject({
  nik: nikSchema,
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  attachment: imageDataUrlSchema("Foto KTP"),
  attachmentFileName: imageFileNameSchema,
  attachmentMimeType: imageMimeTypeSchema,
  selfie: imageDataUrlSchema("Foto selfie"),
  selfieFileName: imageFileNameSchema,
  selfieMimeType: imageMimeTypeSchema,
}).superRefine((command, context) => {
  const imageTypes: Array<{
    data: string;
    mimeType: string | undefined;
    field: "attachmentMimeType" | "selfieMimeType";
  }> = [
    {
      data: command.attachment,
      mimeType: command.attachmentMimeType,
      field: "attachmentMimeType",
    },
    {
      data: command.selfie,
      mimeType: command.selfieMimeType,
      field: "selfieMimeType",
    },
  ];

  for (const image of imageTypes) {
    const dataUrlMimeType = /^data:(image\/(?:jpeg|png|webp));base64,/.exec(
      image.data,
    )?.[1];
    if (image.mimeType && image.mimeType !== dataUrlMimeType) {
      context.addIssue({
        code: "custom",
        path: [image.field],
        message: "Tipe berkas tidak sesuai dengan foto yang diunggah",
      });
    }
  }
});

export type RegisterCitizenCommand = z.infer<typeof registerCitizenSchema>;
