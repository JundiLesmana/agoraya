const BPS_PROVINCE_CODES: Readonly<Record<string, string>> = {
  aceh: "11",
  "sumatera utara": "12",
  "sumatera barat": "13",
  riau: "14",
  jambi: "15",
  "sumatera selatan": "16",
  bengkulu: "17",
  lampung: "18",
  "kepulauan bangka belitung": "19",
  "kepulauan riau": "21",
  "dki jakarta": "31",
  jakarta: "31",
  "daerah khusus jakarta": "31",
  "jawa barat": "32",
  "jawa tengah": "33",
  "di yogyakarta": "34",
  yogyakarta: "34",
  "daerah istimewa yogyakarta": "34",
  "jawa timur": "35",
  banten: "36",
  bali: "51",
  "nusa tenggara barat": "52",
  "nusa tenggara timur": "53",
  "kalimantan barat": "61",
  "kalimantan tengah": "62",
  "kalimantan selatan": "63",
  "kalimantan timur": "64",
  "kalimantan utara": "65",
  "sulawesi utara": "71",
  "sulawesi tengah": "72",
  "sulawesi selatan": "73",
  "sulawesi tenggara": "74",
  gorontalo: "75",
  "sulawesi barat": "76",
  maluku: "81",
  "maluku utara": "82",
  papua: "91",
  "papua barat": "92",
  "papua selatan": "93",
  "papua tengah": "94",
  "papua pegunungan": "95",
  "papua barat daya": "96",
};

function normalizeRegionName(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("id-ID")
    .replace(/^provinsi\s+/, "")
    .replace(/\s+/g, " ");
}

export function bpsRegionCodesForAssignment(
  regionId: string,
  regionName: string,
): readonly string[] {
  const id = regionId.trim();
  if (/^\d{4}$/.test(id)) return [id];
  if (/^\d{2}$/.test(id)) return [`${id}00`];

  const provinceCode =
    BPS_PROVINCE_CODES[normalizeRegionName(regionName)] ??
    BPS_PROVINCE_CODES[
      normalizeRegionName(regionId.replace(/[-_]/g, " "))
    ];
  return provinceCode ? [`${provinceCode}00`] : [];
}