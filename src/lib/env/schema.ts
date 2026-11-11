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
  REPORTING_TENANT_ID: optionalEnv(z.string().uuid()),
  CITIZEN_KYC_TENANT_ID: optionalEnv(z.string().uuid()),
  ASN_KYC_TENANT_ID: optionalEnv(z.string().uuid()),

  AUTH_SECRET: z.string().min(32),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),

  BREVO_API_KEY: optionalEnv(z.string()),
  BREVO_SENDER_EMAIL: optionalEnv(z.string().email()),
  BREVO_SENDER_NAME: optionalEnv(z.string()),

  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: optionalEnv(z.string()),
  CLOUDINARY_API_KEY: optionalEnv(z.string()),
  CLOUDINARY_API_SECRET: optionalEnv(z.string()),

  BPS_API_KEY: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const stripped = value.replace(/\s+#.*$/, "").trim();
      return stripped === "" ? undefined : stripped;
    },
    z.string().optional(),
  ),
  BPS_STATISTICS_INDICATORS: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const stripped = value.replace(/\s+#.*$/, "").trim();
      return stripped === "" ? undefined : stripped;
    },
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
  GEMINI_API_KEY: optionalEnv(z.string().min(1)),
  CEREBRAS_API_KEY: optionalEnv(z.string().min(1)),
  GROQ_API_KEY: optionalEnv(z.string().min(1)),
  OPENROUTER_API_KEY: optionalEnv(z.string().min(1)),
  GEMINI_MODEL: optionalEnv(z.string().min(1).max(120)),
  CEREBRAS_MODEL: optionalEnv(z.string().min(1).max(120)),
  GROQ_MODEL: optionalEnv(z.string().min(1).max(120)),
  OPENROUTER_MODEL: optionalEnv(z.string().min(1).max(160)),
  AI_API_KEY: optionalEnv(z.string().min(1)),
}).refine(
  (data) => {
    if (!data.AI_PROVIDER) return true;
    const providerKey = {
      gemini: data.GEMINI_API_KEY,
      cerebras: data.CEREBRAS_API_KEY,
      groq: data.GROQ_API_KEY,
      openrouter: data.OPENROUTER_API_KEY,
    }[data.AI_PROVIDER];
    return Boolean(providerKey || data.AI_API_KEY);
  },
  {
    message:
      "API key untuk provider AI terpilih wajib diisi (atau gunakan AI_API_KEY lama selama migrasi).",
    path: ["AI_PROVIDER"],
  },
);

export type Env = z.infer<typeof EnvSchema>;
