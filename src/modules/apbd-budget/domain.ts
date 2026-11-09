import { APBD_PERIODS, apbdItemSchema } from "./contract";
import type { ApbdPeriodValue } from "./contract";

const MAX_AMOUNT = 10n ** 20n - 1n;
const PERIOD_KEYS = APBD_PERIODS.map((period) => period.value);

export class RupiahParseError extends Error {
  constructor() {
    super("Masukkan angka rupiah bulat, misalnya 1.000.000 atau 1,000,000.");
    this.name = "RupiahParseError";
  }
}

export function parseRupiahInteger(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  let digits = value;
  if (!/^\d+$/.test(value)) {
    const separator = value.includes(".") ? "." : ",";
    const groups = value.split(separator);
    if (
      value.includes(".") &&
      value.includes(",") ||
      groups.length < 2 ||
      groups[0].length < 1 ||
      groups[0].length > 3 ||
      !/^\d+$/.test(groups[0]) ||
      groups.slice(1).some((group) => group.length !== 3 || !/^\d{3}$/.test(group))
    ) {
      throw new RupiahParseError();
    }
    digits = groups.join("");
  }
  const amount = BigInt(digits);
  if (amount > MAX_AMOUNT) throw new RupiahParseError();
  return amount.toString();
}

export function formatRupiahInteger(value: string | null): string {
  if (value === null) return "—";
  return `Rp${new Intl.NumberFormat("id-ID").format(BigInt(value))}`;
}

export function formatApbdPercent(numerator: bigint, denominator: bigint): string {
  const hundredths = denominator === 0n ? 0n : (numerator * 10_000n) / denominator;
  const fraction = (hundredths % 100n).toString().padStart(2, "0");
  return `${hundredths / 100n},${fraction}%`;
}

export function calculateApbdTotals(
  items: readonly {
    readonly periods: readonly Pick<ApbdPeriodValue, "pagu" | "realisasi">[];
  }[],
) {
  let pagu = 0n;
  let realisasi = 0n;
  let filledPeriods = 0;
  let warningCount = 0;
  const expectedPeriods = items.length * PERIOD_KEYS.length;

  for (const item of items) {
    for (const period of item.periods) {
      if (period.pagu !== null && period.realisasi !== null) {
        filledPeriods += 1;
      }
      if (period.pagu !== null) pagu += BigInt(period.pagu);
      if (period.realisasi !== null) realisasi += BigInt(period.realisasi);
      if (
        period.pagu !== null &&
        period.realisasi !== null &&
        BigInt(period.realisasi) > BigInt(period.pagu)
      ) {
        warningCount += 1;
      }
    }
  }

  const completeness =
    expectedPeriods === 0 ? 0 : Math.round((filledPeriods / expectedPeriods) * 100);
  const absorption = formatApbdPercent(realisasi, pagu);

  return { pagu, realisasi, completeness, absorption, warningCount };
}

export function validateApbdItems(rawItems: readonly unknown[]) {
  const items = [];
  const errors: { row: number; messages: string[] }[] = [];
  const seenCodes = new Set<string>();

  for (const [index, rawItem] of rawItems.entries()) {
    const parsed = apbdItemSchema.safeParse(rawItem);
    if (!parsed.success) {
      errors.push({
        row: index + 1,
        messages: parsed.error.issues.map((issue) => issue.message),
      });
      continue;
    }

    const periodValues = parsed.data.periods.map((period) => period.periodValue);
    if (new Set(periodValues).size !== PERIOD_KEYS.length) {
      errors.push({
        row: index + 1,
        messages: ["Setiap sub-kegiatan harus memiliki satu nilai untuk Q1–Q4."],
      });
      continue;
    }
    if (PERIOD_KEYS.some((period) => !periodValues.includes(period))) {
      errors.push({
        row: index + 1,
        messages: ["Periode harus mencakup Triwulan I sampai IV."],
      });
      continue;
    }

    const normalizedCode = parsed.data.code.toLocaleLowerCase("id-ID");
    if (seenCodes.has(normalizedCode)) {
      errors.push({
        row: index + 1,
        messages: ["Kode sub-kegiatan tidak boleh duplikat dalam satu impor."],
      });
      continue;
    }
    seenCodes.add(normalizedCode);
    items.push(parsed.data);
  }

  return { items, errors };
}

export interface ParsedApbdCsv {
  readonly items: readonly unknown[];
  readonly rowErrors: readonly { readonly row: number; readonly message: string }[];
}

export function parseApbdCsv(csv: string): ParsedApbdCsv {
  csv = csv.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      if (rows.length > 501) {
        throw new Error("CSV maksimal berisi 500 baris data.");
      }
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (quoted) {
    throw new Error("CSV tidak valid: ada tanda kutip yang tidak berpasangan.");
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  if (rows.length > 501) {
    throw new Error("CSV maksimal berisi 500 baris data.");
  }
  if (rows.length < 2) {
    throw new Error("CSV harus berisi header dan minimal satu baris data.");
  }

  const expectedHeaders = [
    "kode",
    "nama_program",
    "nama_subkegiatan",
    ...PERIOD_KEYS.flatMap((period) => [`pagu_${period.toLowerCase()}`, `realisasi_${period.toLowerCase()}`]),
  ];
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  if (
    headers.length !== expectedHeaders.length ||
    expectedHeaders.some((header, index) => headers[index] !== header)
  ) {
    throw new Error("Header CSV tidak sesuai dengan template APBD.");
  }

  const items: unknown[] = [];
  const rowErrors: { row: number; message: string }[] = [];
  for (const [index, values] of rows.slice(1).entries()) {
    if (values.length !== expectedHeaders.length) {
      rowErrors.push({
        row: index + 2,
        message: "Jumlah kolom tidak sesuai dengan template.",
      });
      continue;
    }
    const [code, programName, subactivityName, ...amounts] = values;
    try {
      const periods = PERIOD_KEYS.map((period, periodIndex) => ({
        periodType: "quarterly" as const,
        periodValue: period,
        pagu: parseRupiahInteger(amounts[periodIndex * 2] ?? ""),
        realisasi: parseRupiahInteger(amounts[periodIndex * 2 + 1] ?? ""),
      }));
      items.push({ code, programName, subactivityName, periods });
    } catch (error) {
      rowErrors.push({
        row: index + 2,
        message:
          error instanceof Error ? error.message : "Format angka tidak valid.",
      });
    }
  }
  return { items, rowErrors };
}

export function apbdCsvTemplate(): string {
  return [
    [
      "kode",
      "nama_program",
      "nama_subkegiatan",
      ...PERIOD_KEYS.flatMap((period) => [
        `pagu_${period.toLowerCase()}`,
        `realisasi_${period.toLowerCase()}`,
      ]),
    ].join(","),
  ].join("\r\n");
}

export function serializeApbdCsv(items: readonly {
  readonly code: string;
  readonly programName: string;
  readonly subactivityName: string;
  readonly periods: readonly ApbdPeriodValue[];
}[]): string {
  const escapeCell = (value: string): string => {
    const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${safeValue.replace(/"/g, '""')}"`;
  };
  const header = apbdCsvTemplate().split("\r\n")[0];
  const rows = items.map((item) =>
    [
      item.code,
      item.programName,
      item.subactivityName,
      ...PERIOD_KEYS.flatMap((period) => {
        const value = item.periods.find((entry) => entry.periodValue === period);
        return [value?.pagu ?? "", value?.realisasi ?? ""];
      }),
    ]
      .map(escapeCell)
      .join(","),
  );
  return [header, ...rows].join("\r\n");
}
