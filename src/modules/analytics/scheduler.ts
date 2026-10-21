import { timingSafeEqual } from "node:crypto";

export function isAnalyticsRefreshSecretConfigured(
  secret: string | undefined,
): secret is string {
  return secret !== undefined && Buffer.byteLength(secret) >= 32;
}

export function isAuthorizedAnalyticsRefresh(
  authorizationHeader: string | null,
  secret: string | undefined,
): boolean {
  if (!isAnalyticsRefreshSecretConfigured(secret) || !authorizationHeader) {
    return false;
  }
  const match = /^Bearer ([^\s]+)$/i.exec(authorizationHeader);
  if (!match) return false;
  const supplied = Buffer.from(match[1]);
  const expected = Buffer.from(secret);
  return (
    supplied.byteLength === expected.byteLength &&
    timingSafeEqual(supplied, expected)
  );
}
