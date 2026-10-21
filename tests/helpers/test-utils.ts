import { expect, vi } from 'vitest';

export function createIsoDate(seed: string): Date {
  return new Date(seed);
}

export function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

export async function expectRejectedWithCode(
  promise: Promise<unknown>,
  code: string,
): Promise<void> {
  await expect(promise).rejects.toMatchObject({ code });
}
