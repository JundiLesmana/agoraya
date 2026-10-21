import { describe, expect, it } from "vitest";
import { InMemoryAggregateCache } from "@/modules/analytics/cache";

describe("aggregate result cache", () => {
  it("expires entries and invalidates all cached results", () => {
    let now = 10;
    const cache = new InMemoryAggregateCache<string[]>({
      ttlMs: 20,
      clock: () => now,
    });
    cache.set("tenant-a", ["result"]);
    expect(cache.get("tenant-a")).toEqual(["result"]);
    now = 30;
    expect(cache.get("tenant-a")).toBeUndefined();
    cache.set("tenant-b", ["other"]);
    cache.invalidateAll();
    expect(cache.size).toBe(0);
  });

  it("bounds memory by evicting the oldest entry", () => {
    const cache = new InMemoryAggregateCache<string>({
      maxEntries: 1,
      clock: () => 0,
    });
    cache.set("tenant-a", "a");
    cache.set("tenant-b", "b");
    expect(cache.get("tenant-a")).toBeUndefined();
    expect(cache.get("tenant-b")).toBe("b");
  });
});
