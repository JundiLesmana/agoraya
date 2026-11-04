import { z } from "zod";

export const MAX_IDENTIFIER_LENGTH = 255;
export const MAX_PASSWORD_LENGTH = 256;

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1).max(MAX_IDENTIFIER_LENGTH),
});

export const resetPasswordTokenSchema = z
  .string()
  .length(64, "Token link reset tidak valid.")
  .regex(/^[a-f\d]{64}$/i, "Token link reset tidak valid.");

export const resetPasswordPasswordSchema = z
  .string()
  .min(12, "Kata sandi minimal 12 karakter.")
  .max(MAX_PASSWORD_LENGTH, "Kata sandi maksimal 256 karakter.")
  .regex(/\d/, "Kata sandi harus mengandung minimal 1 angka.")
  .regex(/[^a-zA-Z0-9]/, "Kata sandi harus mengandung minimal 1 simbol.");

export const resetPasswordSchema = z.object({
  token: resetPasswordTokenSchema,
  password: resetPasswordPasswordSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const PASSWORD_REQUIREMENTS = [
  { key: "length", label: "Minimal 12 karakter", test: (value: string) => value.length >= 12 },
  { key: "number", label: "Minimal 1 angka", test: (value: string) => /\d/.test(value) },
  { key: "symbol", label: "Minimal 1 simbol", test: (value: string) => /[^a-zA-Z0-9]/.test(value) },
];
