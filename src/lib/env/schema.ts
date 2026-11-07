import { z } from "zod";

export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url().optional(),
  CRON_SECRET: z.string().min(32).optional(),

  AUTH_SECRET: z.string().min(32),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),

  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().optional(),
  BREVO_SENDER_NAME: z.string().optional(),

  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  BPS_API_KEY: z.string().optional(),
  BPS_STATISTICS_INDICATORS: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z
      .string()
      .trim()
      .min(1)
      .max(500)
      .default("0000:413:0:0,0000:192:434:61,0000:1886:585:0,0000:847:0:0"),
  ),

  AI_PROVIDER: z.enum(["gemini", "cerebras", "groq", "openrouter"]).optional(),
  AI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;
