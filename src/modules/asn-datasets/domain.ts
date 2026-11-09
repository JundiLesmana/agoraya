import type { AsnDatasetDictionaryColumn } from "@/lib/db/schema/asn-dataset-submissions";

const MAX_COLUMNS = 100;
const MAX_ROWS = 10_000;

export interface ParsedDatasetCsv {
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
  readonly dictionary: readonly AsnDatasetDictionaryColumn[];
}

function inferColumnType(
  values: readonly string[],
): AsnDatasetDictionaryColumn["type"] {
  const samples = values.filter((value) => value.trim() !== "").slice(0, 100);
  if (!samples.length) return "text";
  if (samples.every((value) => /^-?\d+$/.test(value.trim()))) return "integer";
  if (
    samples.every((value) => /^-?\d+(?:[.,]\d+)?$/.test(value.trim()))
  ) {
    return "decimal";
  }
  if (
    samples.every(
      (value) =>
        /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) &&
        !Number.isNaN(Date.parse(`${value.trim()}T00:00:00Z`)),
    )
  ) {
    return "date";
  }
  return "text";
}

export function parseDatasetCsv(csv: string): ParsedDatasetCsv {
  const input = csv.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      if (rows.length > MAX_ROWS + 1) {
        throw new Error(`Dataset maksimal berisi ${MAX_ROWS} baris data.`);
      }
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error("CSV tidak valid: tanda kutip tidak berpasangan.");
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  if (rows.length < 2) {
    throw new Error("CSV harus memiliki header dan minimal satu baris data.");
  }

  const headers = rows[0].map((header) => header.trim());
  if (
    headers.length === 0 ||
    headers.length > MAX_COLUMNS ||
    headers.some((header) => !header || header.length > 100 || header.includes("\0"))
  ) {
    throw new Error("Header CSV kosong, terlalu panjang, atau melebihi 100 kolom.");
  }
  const normalizedHeaders = headers.map((header) =>
    header.toLocaleLowerCase("id-ID"),
  );
  if (new Set(normalizedHeaders).size !== normalizedHeaders.length) {
    throw new Error("Nama kolom CSV tidak boleh duplikat.");
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_ROWS) {
    throw new Error(`Dataset maksimal berisi ${MAX_ROWS} baris data.`);
  }
  for (const [index, values] of dataRows.entries()) {
    if (values.length !== headers.length) {
      throw new Error(
        `Baris ${index + 2} memiliki ${values.length} kolom; seharusnya ${headers.length}.`,
      );
    }
    if (values.some((value) => value.includes("\0"))) {
      throw new Error(`Baris ${index + 2} mengandung karakter yang tidak valid.`);
    }
  }

  return {
    headers,
    rows: dataRows,
    dictionary: headers.map((name, columnIndex) => ({
      name,
      type: inferColumnType(dataRows.map((values) => values[columnIndex] ?? "")),
      description: `Kolom ${name} pada data yang dikirim operator.`,
    })),
  };
}

export function serializeDatasetCsv(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return [
    headers.map(escape).join(","),
    ...rows.map((values) => values.map(escape).join(",")),
  ].join("\r\n");
}

export function csvCell(value: string | number): string {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}
