import { NextResponse } from "next/server";
import { z } from "zod";
import { validateEducationFreeText } from "@/modules/education/privacy";

const privacyCheckSchema = z.strictObject({
  kebutuhan: z.string().max(5_000),
  catatan: z.string().max(2_000),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan tidak valid." },
      { status: 400 },
    );
  }

  const parsed = privacyCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Isi uraian atau catatan tidak valid." },
      { status: 400 },
    );
  }

  if (!validateEducationFreeText(parsed.data)) {
    return NextResponse.json(
      {
        error:
          "Uraian atau catatan terdeteksi memuat NIK (16 digit) atau NISN (10 digit). Hapus data tersebut sebelum melanjutkan.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ valid: true });
}
