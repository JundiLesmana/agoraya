import { describe, expect, it } from "vitest";
import type { Session } from "@/lib/auth/session";
import type { Database, Row } from "@/lib/db/types";
import {
  getApbdWorkspace,
  saveApbdWorkspace,
} from "@/modules/apbd-budget/service";
import { APBD_PERIODS } from "@/modules/apbd-budget/contract";

const SESSION: Session = {
  userId: "11111111-1111-4111-8111-111111111111",
  tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  role: "asn",
  roles: ["asn"],
};

class UnassignedDatabase implements Database {
  readonly statements: string[] = [];

  async query<T extends Row = Row>(
    statement: string,
  ): Promise<T[]> {
    this.statements.push(statement);
    return [];
  }

  async queryOne<T extends Row = Row>(
    statement: string,
  ): Promise<T | null> {
    this.statements.push(statement);
    return null;
  }

  async transaction<T>(operation: (transaction: Database) => Promise<T>): Promise<T> {
    return operation(this);
  }

  async end(): Promise<void> {}
}

function validDraft(agencyId: string) {
  return {
    referenceYear: 2025,
    agencyId,
    regionId: "region-a",
    sectorId: "education",
    status: "draft",
    items: [
      {
        code: "EDU-01",
        programName: "Pendidikan",
        subactivityName: "Buku sekolah",
        periods: APBD_PERIODS.map(({ value }) => ({
          periodType: "quarterly",
          periodValue: value,
          pagu: "1000000",
          realisasi: "500000",
        })),
      },
    ],
  };
}

describe("APBD tenant and agency isolation", () => {
  it("denies a context outside the operator's server-side assignments", async () => {
    const database = new UnassignedDatabase();
    await expect(
      getApbdWorkspace(
        SESSION,
        {
          referenceYear: 2025,
          agencyId: "agency-b",
          regionId: "region-b",
          sectorId: "health",
        },
        database,
      ),
    ).rejects.toMatchObject({ status: 403 });

    expect(
      database.statements.some((statement) =>
        statement.includes("FROM apbd_entries"),
      ),
    ).toBe(false);
  });

  it("rejects a cross-agency bulk upsert before any APBD write", async () => {
    const database = new UnassignedDatabase();
    await expect(
      saveApbdWorkspace(SESSION, validDraft("agency-b"), database),
    ).rejects.toMatchObject({ status: 403 });

    expect(
      database.statements.some((statement) =>
        /^\s*(INSERT|UPDATE|DELETE)\s+apbd_/i.test(statement),
      ),
    ).toBe(false);
  });
});
