import type { StatisticPeriodType } from "./contract";

export interface StatisticPoint {
  readonly periodValue: string;
  readonly value: number;
  readonly explanation: string;
}

export interface StatisticAnomaly {
  readonly periodValue: string;
  readonly previousValue: number;
  readonly currentValue: number;
  readonly changePercent: number;
}

function periodOrder(periodType: StatisticPeriodType, value: string): number {
  if (periodType === "annual") return Number(value);
  if (periodType === "monthly") return Number(value);
  return Number(value.slice(1));
}

export function detectStatisticAnomalies(
  periodType: StatisticPeriodType,
  points: readonly StatisticPoint[],
  thresholdPercent = 50,
): StatisticAnomaly[] {
  const ordered = [...points].sort(
    (left, right) =>
      periodOrder(periodType, left.periodValue) -
      periodOrder(periodType, right.periodValue),
  );
  const anomalies: StatisticAnomaly[] = [];

  let previous: StatisticPoint | null = null;
  for (const current of ordered) {
    if (!previous) {
      previous = current;
      continue;
    }
    const changePercent =
      previous.value === 0
        ? current.value === 0
          ? 0
          : Number.POSITIVE_INFINITY
        : (Math.abs(current.value - previous.value) /
            Math.abs(previous.value)) *
          100;
    if (changePercent > thresholdPercent && !current.explanation.trim()) {
      anomalies.push({
        periodValue: current.periodValue,
        previousValue: previous.value,
        currentValue: current.value,
        changePercent,
      });
    }
    previous = current;
  }
  return anomalies;
}

export function formatStatisticValue(value: number, precision: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  }).format(value);
}
