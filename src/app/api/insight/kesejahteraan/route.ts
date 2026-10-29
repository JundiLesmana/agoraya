import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getWellbeingInsights,
  wellbeingIndicatorIdSchema,
} from "@/lib/insight-kesejahteraan";

export const dynamic = "force-dynamic";

const indicatorsQuerySchema = z
  .array(wellbeingIndicatorIdSchema)
  .min(1)
  .max(10)
  .refine((indicators) => new Set(indicators).size === indicators.length);

export function GET(request: Request) {
  const url = new URL(request.url);
  const requestedIndicators = url.searchParams.get("indikator");
  const parsedIndicators = requestedIndicators
    ? indicatorsQuerySchema.safeParse(requestedIndicators.split(","))
    : null;

  if (!parsedIndicators?.success) {
    return NextResponse.json(
      {
        error:
          "Parameter indikator harus berisi daftar indikator kesejahteraan yang valid.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(getWellbeingInsights(parsedIndicators.data));
}
