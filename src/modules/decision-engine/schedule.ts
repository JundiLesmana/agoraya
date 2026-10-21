import type { ScheduleEntry } from "./types";

export function triggerDueDecisions(entries: readonly ScheduleEntry[], now = new Date()): readonly ScheduleEntry[] {
  return entries.filter((entry) => entry.runAt.getTime() <= now.getTime());
}

