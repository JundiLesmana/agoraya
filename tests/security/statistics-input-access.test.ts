import { describe, expect, it } from "vitest";
import type { Session } from "@/lib/auth/session";
import type { Database, Row } from "@/lib/db/types";
import {
  statisticInputPayloadSchema,
  type StatisticAssignment,
} from "@/modules/statistics-input";
import {
  hasStatisticAssignment,
  saveStatisticsInput,
} from "@/modules/statistics-input/service";

const CITY_A_ASSIGNMENTS: StatisticAssignment[] = [
  {
    agencyId: "agency-a",
    regionId: "kota-a",
    regionName: "Kota A",
    sectorId: "economy",
  },
];

const CITY_A_SESSION: Session = {
  userId: "11111111-1111-4111-8111-111111111111",
  tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  role: "asn",
  roles: ["asn"],
};

class UnassignedRegionDatabase implements Database {
  async query<T extends Row = Row>(
    statement: string,
    params: readonly unknown[] = [],
  ): Promise<T[]> {
    void statement;
    void params;
    return [];
  }

  async queryOne<T extends Row = Row>(
    statement: string,
    params?: readonly unknown[],
  ): Promise<T | null> {
    void statement;
    void params;
    return null;
  }

  async transaction<T>(
    operation: (transaction: Database) => Promise<T>,
  ): Promise<T> {
    return operation(this);
  }

  async end(): Promise<void> {}
}

describe("statistical input assignment isolation", () => {
  it("denies a Kota A operator when requesting a Kota B region", () => {
    expect(
      hasStatisticAssignment(CITY_A_ASSIGNMENTS, "kota-b", "economy"),
    ).toBeNull();
  });

  it("denies a sector outside the operator assignment", () => {
    expect(
      hasStatisticAssignment(CITY_A_ASSIGNMENTS, "kota-a", "agriculture"),
    ).toBeNull();
  });

  it("returns forbidden before writing when the requested region is unassigned", async () => {
    await expect(
      saveStatisticsInput(
        CITY_A_SESSION,
        {
          referenceYear: 2026,
          regionId: "kota-b",
          sectorId: "economy",
          indicatorId: "tpt",
          periodType: "quarterly",
          status: "draft",
          sourceName: "",
          methodology: "",
          values: [{ periodValue: "Q1", value: 5.2, explanation: "" }],
        },
        [],
        new UnassignedRegionDatabase(),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("rejects agency scope supplied by the browser", () => {
    const parsed = statisticInputPayloadSchema.safeParse({
      referenceYear: 2026,
      regionId: "kota-a",
      agencyId: "agency-b",
      sectorId: "economy",
      indicatorId: "tpt",
      periodType: "quarterly",
      status: "draft",
      sourceName: "",
      methodology: "",
      values: [{ periodValue: "Q1", value: 5.2, explanation: "" }],
    });
    expect(parsed.success).toBe(false);
  });
});
