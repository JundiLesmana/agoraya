import { describe, expect, it } from "vitest";
import {
  isAnalyticsRefreshSecretConfigured,
  isAuthorizedAnalyticsRefresh,
} from "@/modules/analytics/scheduler";

const secret = "a-test-cron-secret-with-at-least-32-bytes";

describe("analytics refresh authorization", () => {
  it("requires a configured secret with at least 32 bytes", () => {
    expect(isAnalyticsRefreshSecretConfigured(secret)).toBe(true);
    expect(isAnalyticsRefreshSecretConfigured("short")).toBe(false);
    expect(isAnalyticsRefreshSecretConfigured(undefined)).toBe(false);
  });

  it("accepts only the matching bearer token", () => {
    expect(isAuthorizedAnalyticsRefresh(`Bearer ${secret}`, secret)).toBe(true);
    expect(isAuthorizedAnalyticsRefresh("Bearer wrong-token", secret)).toBe(
      false,
    );
    expect(isAuthorizedAnalyticsRefresh(secret, secret)).toBe(false);
    expect(isAuthorizedAnalyticsRefresh(null, secret)).toBe(false);
  });
});
