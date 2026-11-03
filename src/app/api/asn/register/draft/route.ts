import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const draftId = payload.draftId || crypto.randomUUID();
    // In a real implementation, this would save to database
    // For now, just acknowledge
    return NextResponse.json(
      {
        ok: true,
        message: "Draf berhasil disimpan",
        data: { draftId, step: payload.step },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan draf" },
      { status: 400 },
    );
  }
}
