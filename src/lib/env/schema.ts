// Agoraya — lib/env schema
// Zod contract for environment variables. Variable names only; no secret values.

import { z } from 'zod';

export const EnvSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Database (required)
  DATABASE_URL: z.string().url(),

  // Auth & OTP
  AUTH_SECRET: z.string().min(32),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),

  // Brevo (transactional email) — optional until integration is configured
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().optional(),
  BREVO_SENDER_NAME: z.string().optional(),

  // Cloudinary — optional
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // BPS API — optional
  BPS_API_KEY: z.string().optional(),

  // AI providers — optional
  AI_PROVIDER: z.enum(['gemini', 'cerebras', 'groq', 'openrouter']).optional(),
  AI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;
