import { ValidationError } from "@/lib/errors";

import {
  asnPerformanceFiltersSchema,
  resolveAsnPerformanceFilters,
} from "./performance-schema";

export function parseAsnPerformanceRequest(searchParams: URLSearchParams) {
  const entries = collectEntries(searchParams);
  const parsed = asnPerformanceFiltersSchema.safeParse(entries);
  if (!parsed.success) {
    throw new ValidationError("Filter kinerja ASN tidak valid.", {
      details: {
        issues: parsed.error.issues.map((issue) => issue.path.join(".")),
      },
    });
  }

  try {
    return {
      filters: resolveAsnPerformanceFilters(parsed.data),
      format: parsed.data.format ?? "json",
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new ValidationError(error.message);
    }
    throw error;
  }
}

function collectEntries(searchParams: URLSearchParams) {
  const entries = new Map<string, string | string[]>();
  for (const key of searchParams.keys()) {
    const values = searchParams.getAll(key);
    entries.set(key, values.length > 1 ? values : values[0] ?? "");
  }
  return Object.fromEntries(entries);
}
