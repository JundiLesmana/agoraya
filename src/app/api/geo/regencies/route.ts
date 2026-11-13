import { NextResponse } from "next/server";
import { z } from "zod";
import { REGENCIES } from "@/lib/geo/data";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  provinceId: z.string().min(1, "provinsi wajib dipilih"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Provinsi wajib dipilih" },
      { status: 400 },
    );
  }

  const data = REGENCIES.filter(
    (regency) => regency.provinceId === parsed.data.provinceId,
  );
  return NextResponse.json(
    { ok: true, data },
    { status: 200, headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
