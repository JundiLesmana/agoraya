import { z } from "zod";

const optionalEnv = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    schema.optional(),
  );

export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: optionalEnv(z.string().url()),
  CRON_SECRET: optionalEnv(z.string().min(32)),

  AUTH_SECRET: z.string().min(32),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),

  BREVO_API_KEY: optionalEnv(z.string()),
  BREVO_SENDER_EMAIL: optionalEnv(z.string().email()),
  BREVO_SENDER_NAME: optionalEnv(z.string()),

  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: optionalEnv(z.string()),
  CLOUDINARY_API_KEY: optionalEnv(z.string()),
  CLOUDINARY_API_SECRET: optionalEnv(z.string()),

  BPS_API_KEY: optionalEnv(z.string()),
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

  AI_PROVIDER: optionalEnv(
    z.enum(["gemini", "cerebras", "groq", "openrouter"]),
  ),
  AI_API_KEY: optionalEnv(z.string()),
});

export type Env = z.infer<typeof EnvSchema>;
