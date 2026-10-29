import { NextResponse } from "next/server";
import { z } from "zod";
import { TIMELY_SERVICE_CITIES } from "@/lib/insight-layanan";

export const dynamic = "force-dynamic";

// TODO: Replace these sample values when the service-insight data provider is available.
function samplePercentageForCity(
  city: (typeof TIMELY_SERVICE_CITIES)[number],
): number {
  switch (city) {
    case "Bandung":
      return 88;
    case "Bogor":
      return 84;
    case "Depok":
      return 81;
    case "Bekasi":
      return 78;
    case "Cimahi":
      return 75;
  }
}

const cityListSchema = z
  .array(z.enum(TIMELY_SERVICE_CITIES))
  .length(TIMELY_SERVICE_CITIES.length)
  .refine((cities) => new Set(cities).size === TIMELY_SERVICE_CITIES.length);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedCities = url.searchParams.get("kota");
  const parsedCities = requestedCities
    ? cityListSchema.safeParse(requestedCities.split(","))
    : null;

  if (!parsedCities?.success) {
    return NextResponse.json(
      { error: "Parameter kota harus berisi 5 kota pembanding yang valid." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    period: 2024,
    cities: parsedCities.data.map((city) => ({
      city,
      percentage: samplePercentageForCity(city),
    })),
  });
}
