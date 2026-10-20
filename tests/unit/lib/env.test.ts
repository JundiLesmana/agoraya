import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadEnv, resetEnv, getEnv, isDev, isTest, isProd } from '@/lib/env';

const originalEnv = process.env;

const requiredBase: Record<string, string> = {
  NODE_ENV: 'development',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  AUTH_SECRET: 'a-secret-that-is-at-least-32-chars-long!',
};

function setEnv(vars: Record<string, string | undefined>) {
  process.env = { ...originalEnv, ...vars } as NodeJS.ProcessEnv;
}

describe('lib/env', () => {
  beforeEach(() => {
    resetEnv();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetEnv();
    vi.restoreAllMocks();
  });

  it('loads and validates all required env vars', () => {
    setEnv(requiredBase);
    const env = loadEnv();
    expect(env.NODE_ENV).toBe('development');
    expect(env.DATABASE_URL).toBe(requiredBase.DATABASE_URL);
    expect(env.AUTH_SECRET).toBe(requiredBase.AUTH_SECRET);
  });

  it('applies defaults for optional vars', () => {
    setEnv({ ...requiredBase, OTP_EXPIRY_MINUTES: '10' });
    const env = loadEnv();
    expect(env.OTP_EXPIRY_MINUTES).toBe(10);
  });

  it('throws when required env vars are missing', () => {
    setEnv({}); // missing DATABASE_URL, AUTH_SECRET, etc.
    expect(() => loadEnv()).toThrow(/Missing or invalid required environment variables/);
  });

  it('throws when DATABASE_URL is invalid', () => {
    setEnv({ ...requiredBase, DATABASE_URL: 'not-a-url' });
    expect(() => loadEnv()).toThrow();
  });

  it('is idempotent and caches', () => {
    setEnv(requiredBase);
    const a = loadEnv();
    const b = loadEnv();
    expect(a).toBe(b);
  });

  describe('getEnv / isDev / isTest / isProd', () => {
    it('loads on first access', () => {
      setEnv(requiredBase);
      expect(getEnv().DATABASE_URL).toBe(requiredBase.DATABASE_URL);
    });

    it('isDev/isTest/isProd reflect NODE_ENV', () => {
      setEnv({ ...requiredBase, NODE_ENV: 'production' });
      expect(isProd()).toBe(true);
      expect(isDev()).toBe(false);
      expect(isTest()).toBe(false);

      resetEnv();
      setEnv({ ...requiredBase, NODE_ENV: 'test' });
      expect(isTest()).toBe(true);
      expect(isProd()).toBe(false);
      expect(isDev()).toBe(false);

      resetEnv();
      setEnv({ ...requiredBase, NODE_ENV: 'development' });
      expect(isDev()).toBe(true);
      expect(isProd()).toBe(false);
      expect(isTest()).toBe(false);
    });
  });

});
