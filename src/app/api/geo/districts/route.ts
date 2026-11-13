import { NextResponse } from "next/server";
import { z } from "zod";
import { DISTRICTS } from "@/lib/geo/data";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  regencyId: z.string().min(1, "kabupaten/kota wajib dipilih"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Kabupaten/kota wajib dipilih" },
      { status: 400 },
    );
  }

  const data = DISTRICTS.filter(
    (district) => district.regencyId === parsed.data.regencyId,
  );
  return NextResponse.json(
    { ok: true, data },
    { status: 200, headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
