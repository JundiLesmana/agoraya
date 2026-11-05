import { z } from "zod";

export interface BpsParsedRecord {
  readonly regionCode: string;
  readonly value: number;
  readonly year: number;
}

const BpsRecordSchema = z.object({
  kode: z.string().min(1, "kode tidak boleh kosong"),
  nilai: z.coerce.number().finite("nilai harus berupa angka valid"),
  tahun: z.coerce
    .number()
    .int("tahun harus berupa bilangan bulat")
    .min(2000, "tahun terlalu kecil")
    .max(2100, "tahun terlalu besar"),
});

export const BpsResponseSchema = z.object({
  data: z.array(BpsRecordSchema).min(1, "data tidak boleh kosong"),
});

export type BpsRecord = z.infer<typeof BpsRecordSchema>;

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

/**
 * Memvalidasi respons BPS dengan Zod lalu memetakan hanya field yang relevan
 * (kode -> regionCode, nilai -> value, tahun -> year). Semua field lain yang
 * tidak terdaftar di skema dibuang agar payload ke layer database tetap kecil.
 */
export function parseBpsResponse(input: unknown): BpsParsedRecord[] {
  const result = BpsResponseSchema.safeParse(input);
  if (!result.success) {
    throw new BpsResponseError(result.error.issues);
  }

  return result.data.data.map(({ kode, nilai, tahun }) => ({
    regionCode: kode,
    value: nilai,
    year: tahun,
  }));
}
