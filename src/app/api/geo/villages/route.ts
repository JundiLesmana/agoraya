import { NextResponse } from "next/server";
import { z } from "zod";
import { VILLAGES } from "@/lib/geo/data";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  districtId: z.string().min(1, "kecamatan wajib dipilih"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Kecamatan wajib dipilih" },
      { status: 400 },
    );
  }

  const data = VILLAGES.filter(
    (village) => village.districtId === parsed.data.districtId,
  );
  return NextResponse.json(
    { ok: true, data },
    { status: 200, headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
