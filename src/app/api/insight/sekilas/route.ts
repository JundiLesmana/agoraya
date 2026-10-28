import { NextResponse } from "next/server";
import { z } from "zod";
import { getSekilasInsights, sekilasItemsSchema } from "@/lib/insight-sekilas";

export const dynamic = "force-dynamic";

const sekilasQuerySchema = z.object({
  wilayah: z.string().optional(),
  fokus: z.string().optional(),
  periode: z.string().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = sekilasQuerySchema.safeParse(
    Object.fromEntries(url.searchParams),
  );

  if (!query.success) {
    return NextResponse.json(
      { error: "Parameter filter tidak valid." },
      { status: 400 },
    );
  }

  const items = getSekilasInsights(query.data);

  const parsed = sekilasItemsSchema.safeParse(items);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Gagal menyusun data sekilas." },
      { status: 500 },
    );
  }

  return NextResponse.json(parsed.data);
}
