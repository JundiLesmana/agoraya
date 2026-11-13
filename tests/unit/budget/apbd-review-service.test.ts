import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database, Row } from "@/lib/db/types";

const deleteFile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/cloudinary/upload", () => ({
  deletePrivateCloudinaryFile: deleteFile,
  privateCloudinaryDownloadUrl: vi.fn(),
  uploadToCloudinary: vi.fn(),
}));

import { reviewApbdEntry } from "@/modules/apbd-budget/service";

function createDatabase() {
  const statements: Array<{ sql: string; params: readonly unknown[] }> = [];
  const database = {
    query: vi.fn(async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      if (sql.includes("FROM apbd_entry_documents")) {
        return [{ publicId: "private/evidence" }];
      }
      if (sql.includes("LEFT JOIN apbd_budget_period_values")) {
        return ["Q1", "Q2", "Q3", "Q4"].map((periodValue) => ({
          periodValue,
          pagu: "100",
          realisasi: "50",
        }));
      }
      return [];
    }),
    queryOne: vi.fn(async <T extends Row>(sql: string) => {
      if (sql.includes("FROM apbd_entries") && sql.includes("FOR UPDATE")) {
        return {
          id: "22222222-2222-4222-8222-222222222222",
          referenceYear: 2026,
          agencyId: "agency-1",
          regionId: "region-1",
          sectorId: "education",
          createdBy: "11111111-1111-4111-8111-111111111111",
        } as unknown as T;
      }
      if (sql.includes("COUNT(*)") && sql.includes("FROM apbd_budget_items")) {
        return { count: 1 } as unknown as T;
      }
      if (
        sql.includes("COUNT(*)") &&
        sql.includes("FROM apbd_entry_documents")
      ) {
        return { count: 1 } as unknown as T;
      }
      return null;
    }),
    transaction: vi.fn(async <T>(callback: (tx: Database) => Promise<T>) =>
      callback(database as unknown as Database),
    ),
    end: vi.fn(async () => undefined),
  };
  return { database: database as unknown as Database, statements };
}

describe("APBD rejection purge", () => {
  beforeEach(() => {
    deleteFile.mockReset();
    deleteFile.mockResolvedValue(undefined);
  });

  it("deletes private evidence and operational values while writing minimal audit in the same transaction", async () => {
    const { database, statements } = createDatabase();
    const result = await reviewApbdEntry(
      {
        userId: "33333333-3333-4333-8333-333333333333",
        tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        roles: ["admin"],
      } as never,
      "22222222-2222-4222-8222-222222222222",
      "reject",
      "Dokumen bukti tidak valid",
      database,
    );

    expect(result.status).toBe("rejected");
    expect(deleteFile).toHaveBeenCalledWith("private/evidence");
    const executedSql = statements.map(({ sql }) => sql);
    expect(
      executedSql.findIndex((sql) => sql.includes("asn.apbd.review.rejected")),
    ).toBeGreaterThan(-1);
    expect(
      executedSql.findIndex((sql) =>
        sql.includes("DELETE FROM apbd_budget_period_values"),
      ),
    ).toBeLessThan(
      executedSql.findIndex((sql) => sql.includes("DELETE FROM apbd_entries")),
    );
    expect(
      executedSql.some((sql) => sql.includes("DELETE FROM apbd_value_audit")),
    ).toBe(true);
    expect(
      executedSql.some((sql) => sql.includes("DELETE FROM apbd_entries")),
    ).toBe(true);
  });

  it("publishes only after complete quarterly values and verification evidence are present", async () => {
    const { database, statements } = createDatabase();
    const result = await reviewApbdEntry(
      {
        userId: "33333333-3333-4333-8333-333333333333",
        tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        roles: ["admin"],
      } as never,
      "22222222-2222-4222-8222-222222222222",
      "approve",
      "",
      database,
    );

    expect(result.status).toBe("published");
    expect(deleteFile).not.toHaveBeenCalled();
    expect(
      statements.some(({ sql }) =>
        sql.includes("UPDATE apbd_entries SET status = 'published'"),
      ),
    ).toBe(true);
    expect(
      statements.some(({ sql }) => sql.includes("asn.apbd.review.approved")),
    ).toBe(true);
  });
});