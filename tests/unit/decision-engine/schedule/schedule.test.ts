import { describe, expect, it } from "vitest";
import { triggerDueDecisions } from "@/modules/decision-engine/schedule";
import type { ScheduleEntry } from "@/modules/decision-engine/types";

describe("decision-engine/schedule", () => {
  const now = new Date("2025-01-01T00:00:00.000Z");

  it("returns entries due at or before now", () => {
    const entries: readonly ScheduleEntry[] = [
      { key: "now", runAt: new Date("2020-01-01T00:00:00.000Z"), payload: {} },
      {
        key: "later",
        runAt: new Date("2030-01-01T00:00:00.000Z"),
        payload: {},
      },
    ];
    const due = triggerDueDecisions(entries, now);
    expect(due.map((entry) => entry.key)).toEqual(["now"]);
  });

  it("includes entry running exactly at now", () => {
    const entries: readonly ScheduleEntry[] = [
      { key: "exact", runAt: now, payload: {} },
    ];
    const due = triggerDueDecisions(entries, now);
    expect(due.map((entry) => entry.key)).toEqual(["exact"]);
  });

  it("returns empty array when nothing is due", () => {
    const entries: readonly ScheduleEntry[] = [
      {
        key: "later",
        runAt: new Date("2030-01-01T00:00:00.000Z"),
        payload: {},
      },
    ];
    const due = triggerDueDecisions(entries, now);
    expect(due).toEqual([]);
  });
});
