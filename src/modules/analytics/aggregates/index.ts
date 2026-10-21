export interface NumericAggregate {
  readonly count: number;
  readonly sum: number;
  readonly average: number | null;
  readonly minimum: number | null;
  readonly maximum: number | null;
}

function isAggregateValue(value: number | null | undefined): value is number {
  if (value === null || value === undefined) return false;
  if (!Number.isFinite(value)) {
    throw new RangeError("Aggregate values must be finite numbers");
  }
  return true;
}

export function count(values: readonly (number | null | undefined)[]): number {
  let result = 0;
  for (const value of values) {
    if (isAggregateValue(value)) result += 1;
  }
  return result;
}

export function sum(values: readonly (number | null | undefined)[]): number {
  let result = 0;
  for (const value of values) {
    if (!isAggregateValue(value)) continue;
    result += value;
    if (!Number.isFinite(result)) {
      throw new RangeError("Aggregate sum exceeds the supported numeric range");
    }
  }
  return result;
}

export function average(
  values: readonly (number | null | undefined)[],
): number | null {
  let count = 0;
  let result = 0;
  for (const value of values) {
    if (!isAggregateValue(value)) continue;
    count += 1;
    result =
      count === 1 ? value : (result * (count - 1)) / count + value / count;
    if (!Number.isFinite(result)) {
      throw new RangeError(
        "Aggregate average exceeds the supported numeric range",
      );
    }
  }
  return count === 0 ? null : result;
}

export function minimum(
  values: readonly (number | null | undefined)[],
): number | null {
  let result: number | null = null;
  for (const value of values) {
    if (!isAggregateValue(value)) continue;
    result = result === null ? value : Math.min(result, value);
  }
  return result;
}

export function maximum(
  values: readonly (number | null | undefined)[],
): number | null {
  let result: number | null = null;
  for (const value of values) {
    if (!isAggregateValue(value)) continue;
    result = result === null ? value : Math.max(result, value);
  }
  return result;
}

export function aggregateNumbers(
  values: readonly (number | null | undefined)[],
): NumericAggregate {
  let count = 0;
  let total = 0;
  let minimum: number | null = null;
  let maximum: number | null = null;
  for (const value of values) {
    if (!isAggregateValue(value)) continue;
    count += 1;
    total += value;
    if (!Number.isFinite(total)) {
      throw new RangeError("Aggregate sum exceeds the supported numeric range");
    }
    minimum = minimum === null ? value : Math.min(minimum, value);
    maximum = maximum === null ? value : Math.max(maximum, value);
  }
  return {
    count,
    sum: total,
    average: count === 0 ? null : total / count,
    minimum,
    maximum,
  };
}
