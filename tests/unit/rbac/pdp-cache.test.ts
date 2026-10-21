import { describe, it, expect, vi, afterEach } from "vitest";

import { InMemoryDecisionCache } from "@/modules/rbac/pdp/cache";
import type { AccessDecision } from "@/modules/rbac/types";

function decision(allowed: boolean): AccessDecision {
  return {
    allowed,
    reason: allowed ? "allow_by_policy" : "no_matching_policy",
    matchedPolicy: null,
    evaluatedAt: "2026-01-01T00:00:00.000Z",
    cached: false,
    durationMs: 1,
  };
}

describe("modules/rbac pdp cache", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and returns a decision", () => {
    const cache = new InMemoryDecisionCache();
    cache.set("user-1", "key-1", decision(true), 1_000);

    expect(cache.get("user-1", "key-1")?.allowed).toBe(true);
    expect(cache.size).toBe(1);
  });

  it("does not return a decision of another user", () => {
    const cache = new InMemoryDecisionCache();
    cache.set("user-1", "key-1", decision(true), 1_000);

    expect(cache.get("user-2", "key-1")).toBeUndefined();
  });

  it("returns undefined for an unknown key", () => {
    const cache = new InMemoryDecisionCache();
    expect(cache.get("user-1", "missing")).toBeUndefined();
  });

  it("expires entries after the ttl", () => {
    vi.useFakeTimers();
    const cache = new InMemoryDecisionCache();
    cache.set("user-1", "key-1", decision(true), 1_000);

    vi.advanceTimersByTime(1_001);

    expect(cache.get("user-1", "key-1")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("invalidates the decisions of one user only", () => {
    const cache = new InMemoryDecisionCache();
    cache.set("user-1", "key-1", decision(true), 1_000);
    cache.set("user-2", "key-1", decision(true), 1_000);

    const removed = cache.invalidateUser("user-1");

    expect(removed).toBe(1);
    expect(cache.get("user-1", "key-1")).toBeUndefined();
    expect(cache.get("user-2", "key-1")).toBeDefined();
    expect(cache.size).toBe(1);
  });

  it("invalidates every decision", () => {
    const cache = new InMemoryDecisionCache();
    cache.set("user-1", "key-1", decision(true), 1_000);
    cache.set("user-2", "key-2", decision(false), 1_000);

    const removed = cache.invalidateAll();

    expect(removed).toBe(2);
    expect(cache.size).toBe(0);
  });

  it("evicts the oldest entry when the cache is full", () => {
    const cache = new InMemoryDecisionCache({ maxEntries: 2 });
    cache.set("user-1", "key-1", decision(true), 1_000);
    cache.set("user-1", "key-2", decision(true), 1_000);
    cache.set("user-1", "key-3", decision(true), 1_000);

    expect(cache.size).toBe(2);
    expect(cache.get("user-1", "key-1")).toBeUndefined();
    expect(cache.get("user-1", "key-3")).toBeDefined();
  });
});
