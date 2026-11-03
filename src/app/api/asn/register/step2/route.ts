import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { saveAsnStep2 } from "@/modules/asn/service";
import { formatError, isAppError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const step2Schema = z.object({
  userId: z.string().uuid().optional(),
  draftId: z.string().uuid().optional(),
  employmentStatus: z.enum(["PNS", "PPPK"]),
  nip: z.string().optional(),
  pppkNumber: z.string().optional(),
  rankGradePns: z.string().optional(),
  rankGradePppk: z.string().optional(),
  agencyType: z.enum(["Instansi daerah", "Instansi pusat"]),
  agencyName: z.string().min(1),
  provinceTask: z.string().optional(),
  regencyTask: z.string().optional(),
  unitWork: z.string().min(1),
  field: z.string().min(1),
  positionType: z.enum(["Jabatan fungsional", "Jabatan struktural"]),
  positionName: z.string().min(1),
  officeAddress: z.string().min(1),
  officialEmail: z.string().email().optional().or(z.literal("")),
  officePhone: z.string().optional(),
}).refine((data) => {
  if (data.employmentStatus === "PNS") {
    return Boolean(data.nip && /^\d{18}$/.test(data.nip) && data.rankGradePns);
  }
  if (data.employmentStatus === "PPPK") {
    return Boolean(data.pppkNumber && /^\d{18}$/.test(data.pppkNumber) && data.rankGradePppk);
  }
  return true;
}, { message: "Data kepegawaian tidak lengkap atau tidak valid" });

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Permintaan tidak valid" },
      { status: 400 },
    );
  }

  const parsed = step2Schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak lengkap atau tidak valid", issues: parsed.error.issues.map((i) => i.path.join(".")) },
      { status: 400 },
    );
  }

  try {
    const result = await saveAsnStep2(parsed.data);
    return NextResponse.json(
      { ok: true, data: result },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("api.asn.register.step2_failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    if (isAppError(error)) {
      return NextResponse.json(
        formatError(error, { isDev: process.env.NODE_ENV === "development" }),
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan data step 2" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
