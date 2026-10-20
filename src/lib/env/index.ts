// Agoraya — lib/env
// Environment variables validation and typing. Loads and validates all required
// environment variables at application startup; never prints secret values.

import type { Env } from './schema';
import { EnvSchema } from './schema';
import { AppError, ErrorCode } from '../errors';

let cachedEnv: Env | null = null;

/** Validate and load environment variables. Idempotent; safe to call repeatedly. */
export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => issue.path.join('.'))
      .filter((name): name is string => Boolean(name))
      .join(', ');
    throw new AppError(ErrorCode.ENV_VALIDATION_FAILED, `Missing or invalid required environment variables: ${missing}`, {
      statusCode: 500,
      isOperational: true,
      context: { missingEnvVars: missing },
    });
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/** Reset the cached environment (tests only). */
export function resetEnv(): void {
  cachedEnv = null;
}

/** Get the typed environment, loading on first access. */
export function getEnv(): Env {
  if (cachedEnv === null) {
    return loadEnv();
  }
  return cachedEnv;
}

export function isDev(): boolean {
  return getEnv().NODE_ENV === 'development';
}

export function isTest(): boolean {
  return getEnv().NODE_ENV === 'test';
}

export function isProd(): boolean {
  return getEnv().NODE_ENV === 'production';
}
