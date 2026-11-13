import { NextResponse } from "next/server";
import { PROVINCES } from "@/lib/geo/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { ok: true, data: PROVINCES },
    { status: 200, headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
