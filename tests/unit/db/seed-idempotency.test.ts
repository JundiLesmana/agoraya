import { describe, it, expect } from "vitest";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { BPS_SNAPSHOT_SEEDS } from "../../../db/seed/bps-snapshot.js";
import { seedBpsSnapshots } from "../../../db/seed/bps-snapshot.js";
import { USER_SEEDS, TICKET_SEEDS } from "../../../db/seed/demo-scenario.js";
import type * as schema from "../../../src/lib/db/schema/index.js";

// ---------------------------------------------------------------------------
// Fake Drizzle client: records insert/upsert calls without touching a DB.
// ---------------------------------------------------------------------------

type RecordedCall = { table: string; values: unknown; onConflict: boolean };

const makeFakeDb = () => {
  const calls: RecordedCall[] = [];
  const db = {
    insert: () => ({
      values: (values: unknown) => ({
        onConflictDoUpdate: () => {
          calls.push({ table: "insert", values, onConflict: true });
          return {};
        },
        onConflictDoNothing: () => {
          calls.push({ table: "insert", values, onConflict: false });
          return {};
        },
      }),
    }),
  };
  return {
    db: db as unknown as PostgresJsDatabase<typeof schema>,
    calls,
  };
};

describe("seed idempotency and data validity", () => {
  it("BPS snapshots have unique (dataset, region, year, month) keys", () => {
    const keys = BPS_SNAPSHOT_SEEDS.map(
      (s) => `${s.dataset}|${s.region}|${s.year}|${s.month}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("BPS snapshots are all explicitly simulated (no real government data)", () => {
    for (const s of BPS_SNAPSHOT_SEEDS) {
      expect(s.payload.note).toMatch(/demo purposes only/i);
    }
  });

  it("seedBpsSnapshots performs one upsert per snapshot per run (idempotent)", async () => {
    const { db, calls } = makeFakeDb();
    await seedBpsSnapshots(db);
    await seedBpsSnapshots(db); // second run — must not duplicate data

    expect(calls).toHaveLength(BPS_SNAPSHOT_SEEDS.length * 2);
    for (const call of calls) {
      expect(call.onConflict).toBe(true); // upsert, never plain insert
    }
  });

  it("every seed ticket uses a valid status and references demo citizens", async () => {
    const validStatuses = [
      "draft",
      "submitted",
      "in_progress",
      "resolved",
      "rejected",
      "closed",
    ];
    for (const t of TICKET_SEEDS) {
      expect(validStatuses).toContain(t.status);
      expect(t.tenantId).toBe("00000000-0000-0000-0000-000000000001");
    }
  });

  it("no placeholder/demo data leaks real-looking identity", () => {
    // All seed emails use a clearly simulated domain.
    for (const u of USER_SEEDS) {
      expect(u.email).toMatch(/@kota-contoh\.demo$/);
    }
    // All seed NIKs are obviously simulated (padded zeros) — not real NIKs.
    for (const u of USER_SEEDS) {
      expect(u.nik).toMatch(/^317100000000000[0-9]$/);
    }
  });
});
