import { z } from "zod";

export interface BpsParsedRecord {
  readonly indicatorCode: string;
  readonly regionCode: string;
  readonly value: number;
  readonly year: number;
  readonly unit: string;
}

export const MAX_BPS_RECORDS_PER_SYNC = 2_000;

export interface BpsIndicatorSelector {
  readonly domain: string;
  readonly indicatorId: string;
  readonly turvarId: string;
  readonly turtahunId: string;
}

const BpsIndicatorSelectorSchema = z.object({
  domain: z.string().regex(/^\d{4}$/),
  indicatorId: z.string().regex(/^\d+$/),
  turvarId: z.string().regex(/^\d+$/),
  turtahunId: z.string().regex(/^\d+$/),
});

const BpsYearSchema = z.object({
  th_id: z.union([z.string().regex(/^\d+$/), z.number().int().nonnegative()]),
  th: z
    .string()
    .regex(/^\d{4}$/)
    .refine((value) => Number(value) >= 2000 && Number(value) <= 2100),
});

const BpsYearListSchema = z.object({
  status: z.literal("OK"),
  data: z.tuple([
    z.object({ pages: z.number().int().positive() }),
    z.array(BpsYearSchema).min(1).max(20),
  ]),
});

const BpsDimensionSchema = z.object({
  val: z.union([z.string(), z.number()]),
  label: z.string(),
});

const BpsDataResponseSchema = z.object({
  status: z.literal("OK"),
  var: z
    .array(
      BpsDimensionSchema.extend({
        unit: z.string().optional(),
      }),
    )
    .min(1),
  tahun: z.array(BpsDimensionSchema).min(1),
  turvar: z.array(BpsDimensionSchema).min(1),
  turtahun: z.array(BpsDimensionSchema).min(1),
  vervar: z.array(BpsDimensionSchema).min(1),
  datacontent: z.record(
    z.string(),
    z.union([z.number(), z.string(), z.null()]),
  ),
});

export class BpsResponseError extends Error {
  readonly issues: readonly z.ZodIssue[];

  constructor(
    issues: readonly z.ZodIssue[],
    message = "Validasi respons BPS gagal",
  ) {
    super(message);
    this.name = "BpsResponseError";
    this.issues = issues;
  }
}

export function parseBpsIndicatorSelectors(
  input: string,
): BpsIndicatorSelector[] {
  const entries = input
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (entries.length === 0 || entries.length > 10) {
    throw new BpsResponseError([], "Konfigurasi indikator BPS tidak valid.");
  }

  const selectors = entries.map((entry) => {
    const [domain, indicatorId, turvarId, turtahunId, ...extra] =
      entry.split(":");
    const parsed = BpsIndicatorSelectorSchema.safeParse({
      domain,
      indicatorId,
      turvarId,
      turtahunId,
    });
    if (extra.length > 0 || !parsed.success) {
      throw new BpsResponseError(
        parsed.success ? [] : parsed.error.issues,
        "Konfigurasi indikator BPS harus berupa domain:var:turvar:turtahun.",
      );
    }
    return parsed.data;
  });

  const unique = new Set(
    selectors.map((item) =>
      [item.domain, item.indicatorId, item.turvarId, item.turtahunId].join(":"),
    ),
  );
  if (unique.size !== selectors.length) {
    throw new BpsResponseError([], "Konfigurasi indikator BPS duplikat.");
  }
  return selectors;
}

export function parseLatestBpsYear(input: unknown): {
  readonly yearId: string;
  readonly year: number;
} {
  const result = BpsYearListSchema.safeParse(input);
  if (!result.success) throw new BpsResponseError(result.error.issues);
  const latest = [...result.data.data[1]].sort(
    (left, right) => Number(right.th) - Number(left.th),
  )[0];
  if (!latest) {
    throw new BpsResponseError([], "BPS tidak memiliki tahun data.");
  }
  return { yearId: String(latest.th_id), year: Number(latest.th) };
}

/**
 * Memvalidasi respons BPS dengan Zod lalu memetakan hanya field yang relevan
 * Field yang tidak dibutuhkan dibuang agar payload ke layer database tetap
 * kecil dan hanya berisi agregat statistik inti.
 */
export function parseBpsResponse(
  input: unknown,
  selector: BpsIndicatorSelector,
  yearId: string,
  year: number,
): BpsParsedRecord[] {
  const result = BpsDataResponseSchema.safeParse(input);
  if (!result.success) {
    throw new BpsResponseError(result.error.issues);
  }

  const {
    var: variables,
    tahun,
    turvar,
    turtahun,
    vervar,
    datacontent,
  } = result.data;
  const expectedId = (value: string | number) => String(value);
  const variable = variables.find(
    (item) => expectedId(item.val) === selector.indicatorId,
  );
  const selectedYear = tahun.find(
    (item) => expectedId(item.val) === yearId && Number(item.label) === year,
  );
  const selectedTurvar = turvar.find(
    (item) => expectedId(item.val) === selector.turvarId,
  );
  const selectedTurtahun = turtahun.find(
    (item) => expectedId(item.val) === selector.turtahunId,
  );
  if (!variable || !selectedYear || !selectedTurvar || !selectedTurtahun) {
    throw new BpsResponseError(
      [],
      "Dimensi respons BPS tidak cocok dengan konfigurasi indikator.",
    );
  }

  const indicatorCode = [
    "bps",
    selector.domain,
    selector.indicatorId,
    selector.turvarId,
    selector.turtahunId,
  ].join(":");
  const unit = (variable.unit?.trim() || "Tidak Ada Satuan").slice(0, 50);
  const records: BpsParsedRecord[] = [];
  const dataContent = new Map(Object.entries(datacontent));
  for (const region of vervar) {
    const key = [
      region.val,
      variable.val,
      selectedTurvar.val,
      selectedYear.val,
      selectedTurtahun.val,
    ]
      .map(expectedId)
      .join("");
    const rawValue = dataContent.get(key);
    if (
      rawValue === undefined ||
      rawValue === null ||
      (typeof rawValue === "string" && ["", "-"].includes(rawValue.trim()))
    ) {
      continue;
    }

    const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
    if (!Number.isFinite(value) || value < 0) {
      throw new BpsResponseError(
        [],
        "Respons BPS memuat nilai agregat yang tidak valid.",
      );
    }
    records.push({
      indicatorCode,
      regionCode: expectedId(region.val),
      value,
      year,
      unit,
    });
    if (records.length > MAX_BPS_RECORDS_PER_SYNC) {
      throw new BpsResponseError(
        [],
        `Respons melebihi batas ${MAX_BPS_RECORDS_PER_SYNC} agregat.`,
      );
    }
  }

  if (records.length === 0) {
    throw new BpsResponseError([], "BPS tidak mengembalikan nilai agregat.");
  }
  return records;
}
