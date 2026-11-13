export type Province = {
  readonly id: string;
  readonly code: string;
  readonly name: string;
};

export type Regency = {
  readonly id: string;
  readonly code: string;
  readonly provinceId: string;
  readonly name: string;
};

export type District = {
  readonly id: string;
  readonly code: string;
  readonly regencyId: string;
  readonly name: string;
};

export type Village = {
  readonly id: string;
  readonly code: string;
  readonly districtId: string;
  readonly name: string;
};

export const PROVINCES: readonly Province[] = [
  { id: "11", code: "11", name: "Aceh" },
  { id: "12", code: "12", name: "Sumatera Utara" },
  { id: "13", code: "13", name: "Sumatera Barat" },
  { id: "14", code: "14", name: "Riau" },
  { id: "15", code: "15", name: "Jambi" },
  { id: "16", code: "16", name: "Sumatera Selatan" },
  { id: "17", code: "17", name: "Bengkulu" },
  { id: "18", code: "18", name: "Lampung" },
  { id: "19", code: "19", name: "Kepulauan Bangka Belitung" },
  { id: "21", code: "21", name: "Kepulauan Riau" },
  { id: "31", code: "31", name: "DKI Jakarta" },
  { id: "32", code: "32", name: "Jawa Barat" },
  { id: "33", code: "33", name: "Jawa Tengah" },
  { id: "34", code: "34", name: "DI Yogyakarta" },
  { id: "35", code: "35", name: "Jawa Timur" },
  { id: "36", code: "36", name: "Banten" },
  { id: "51", code: "51", name: "Bali" },
  { id: "52", code: "52", name: "Nusa Tenggara Barat" },
  { id: "53", code: "53", name: "Nusa Tenggara Timur" },
  { id: "61", code: "61", name: "Kalimantan Barat" },
  { id: "62", code: "62", name: "Kalimantan Tengah" },
  { id: "63", code: "63", name: "Kalimantan Selatan" },
  { id: "64", code: "64", name: "Kalimantan Timur" },
  { id: "65", code: "65", name: "Kalimantan Utara" },
  { id: "71", code: "71", name: "Sulawesi Utara" },
  { id: "72", code: "72", name: "Sulawesi Tengah" },
  { id: "73", code: "73", name: "Sulawesi Selatan" },
  { id: "74", code: "74", name: "Sulawesi Tenggara" },
  { id: "75", code: "75", name: "Gorontalo" },
  { id: "76", code: "76", name: "Sulawesi Barat" },
  { id: "81", code: "81", name: "Maluku" },
  { id: "82", code: "82", name: "Maluku Utara" },
  { id: "91", code: "91", name: "Papua Barat" },
  { id: "92", code: "92", name: "Papua" },
  { id: "93", code: "93", name: "Papua Selatan" },
  { id: "94", code: "94", name: "Papua Tengah" },
  { id: "95", code: "95", name: "Papua Pegunungan" },
  { id: "96", code: "96", name: "Papua Barat Daya" },
];

const regency = (
  id: string,
  code: string,
  provinceId: string,
  name: string,
): Regency => ({ id, code, provinceId, name });

const district = (
  id: string,
  code: string,
  regencyId: string,
  name: string,
): District => ({ id, code, regencyId, name });

const village = (
  id: string,
  code: string,
  districtId: string,
  name: string,
): Village => ({ id, code, districtId, name });

export const REGENCIES: readonly Regency[] = [
  // DKI Jakarta (31)
  regency("3171", "3171", "31", "Kabupaten Kepulauan Seribu"),
  regency("3173", "3173", "31", "Kota Jakarta Barat"),
  regency("3174", "3174", "31", "Kota Jakarta Pusat"),
  regency("3175", "3175", "31", "Kota Jakarta Selatan"),
  regency("3176", "3176", "31", "Kota Jakarta Timur"),
  regency("3172", "3172", "31", "Kota Jakarta Utara"),
  // Jawa Barat (32)
  regency("3201", "3201", "32", "Kabupaten Bandung"),
  regency("3273", "3273", "32", "Kota Bandung"),
  regency("3203", "3203", "32", "Kabupaten Bekasi"),
  regency("3271", "3271", "32", "Kota Bekasi"),
  regency("3276", "3276", "32", "Kota Bogor"),
  regency("3209", "3209", "32", "Kabupaten Bogor"),
  regency("3275", "3275", "32", "Kota Depok"),
  // Jawa Tengah (33)
  regency("3301", "3301", "33", "Kabupaten Brebes"),
  regency("3302", "3302", "33", "Kabupaten Cilacap"),
  regency("3303", "3303", "33", "Kabupaten Demak"),
  regency("3374", "3374", "33", "Kota Semarang"),
  regency("3322", "3322", "33", "Kabupaten Kudus"),
  // DI Yogyakarta (34)
  regency("3401", "3401", "34", "Kabupaten Kulon Progo"),
  regency("3402", "3402", "34", "Kabupaten Bantul"),
  regency("3403", "3403", "34", "Kabupaten Gunungkidul"),
  regency("3404", "3404", "34", "Kabupaten Sleman"),
  regency("3471", "3471", "34", "Kota Yogyakarta"),
  // Banten (36)
  regency("3601", "3601", "36", "Kabupaten Pandeglang"),
  regency("3602", "3602", "36", "Kabupaten Lebak"),
  regency("3603", "3603", "36", "Kabupaten Tangerang"),
  regency("3604", "3604", "36", "Kabupaten Serang"),
  regency("3671", "3671", "36", "Kota Tangerang"),
  regency("3672", "3672", "36", "Kota Cilegon"),
  regency("3673", "3673", "36", "Kota Serang"),
  regency("3674", "3674", "36", "Kota Tangerang Selatan"),
  // Sumatera Utara (12)
  regency("1201", "1201", "12", "Kabupaten Nias"),
  regency("1202", "1202", "12", "Kabupaten Mandailing Natal"),
  regency("1203", "1203", "12", "Kabupaten Tapanuli Selatan"),
  regency("1204", "1204", "12", "Kabupaten Tapanuli Tengah"),
  regency("1205", "1205", "12", "Kabupaten Tapanuli Utara"),
  regency("1206", "1206", "12", "Kabupaten Toba Samosir"),
  regency("1207", "1207", "12", "Kabupaten Labuhanbatu"),
  regency("1208", "1208", "12", "Kabupaten Deli Serdang"),
  regency("1209", "1209", "12", "Kabupaten Simalungun"),
  regency("1210", "1210", "12", "Kabupaten Karo"),
  regency("1211", "1211", "12", "Kabupaten Dairi"),
  regency("1212", "1212", "12", "Kabupaten Pakpak Bharat"),
  regency("1213", "1213", "12", "Kabupaten Samosir"),
  regency("1214", "1214", "12", "Kabupaten Serdang Bedagai"),
  regency("1215", "1215", "12", "Kabupaten Langkat"),
  regency("1216", "1216", "12", "Kabupaten Asahan"),
  regency("1217", "1217", "12", "Kabupaten Batu Bara"),
  regency("1218", "1218", "12", "Kabupaten Padang Lawas Utara"),
  regency("1219", "1219", "12", "Kabupaten Padang Lawas"),
  regency("1220", "1220", "12", "Kabupaten Humbang Hasundutan"),
  regency("1221", "1221", "12", "Kabupaten Pakpak Barat"),
  regency("1222", "1222", "12", "Kabupaten Nias Utara"),
  regency("1223", "1223", "12", "Kabupaten Nias Barat"),
  regency("1224", "1224", "12", "Kabupaten Labuhanbatu Selatan"),
  regency("1225", "1225", "12", "Kabupaten Labuhanbatu Utara"),
  regency("1226", "1226", "12", "Kabupaten Nias Selatan"),
  regency("1227", "1227", "12", "Kabupaten Gunungsitoli"),
  regency("1271", "1271", "12", "Kota Sibolga"),
  regency("1272", "1272", "12", "Kota Tanjung Balai"),
  regency("1273", "1273", "12", "Kota Pematangsiantar"),
  regency("1274", "1274", "12", "Kota Tebing Tinggi"),
  regency("1275", "1275", "12", "Kota Medan"),
  regency("1276", "1276", "12", "Kota Binjai"),
  regency("1277", "1277", "12", "Kota Padang Sidempuan"),
  regency("1278", "1278", "12", "Kota Gunungsitoli"),
];

export const DISTRICTS: readonly District[] = [
  // Kota Jakarta Selatan (3175)
  district("317501", "317501", "3175", "Kebayoran Baru"),
  district("317502", "317502", "3175", "Kebayoran Lama"),
  district("317503", "317503", "3175", "Pesanggrahan"),
  district("317504", "317504", "3175", "Cilandak"),
  district("317505", "317505", "3175", "Mampang Prapatan"),
  district("317506", "317506", "3175", "Pasar Minggu"),
  district("317507", "317507", "3175", "Jagakarsa"),
  district("317508", "317508", "3175", "Kebayoran Lama Selatan"),
  // Kota Jakarta Pusat (3174)
  district("317401", "317401", "3174", "Kemayoran"),
  district("317402", "317402", "3174", "Senen"),
  district("317403", "317403", "3174", "Cempaka Putih"),
  district("317404", "317404", "3174", "Tanah Abang"),
  district("317405", "317405", "3174", "Gondangdia"),
  district("317406", "317406", "3174", "Menteng"),
  // Kota Bandung (3273)
  district("327301", "327301", "3273", "Kebon Jeruk"),
  district("327302", "327302", "3273", "Andir"),
  district("327303", "327303", "3273", "Cibeunying Kidul"),
  district("327304", "327304", "3273", "Cibiru"),
  district("327305", "327305", "3273", "Cimahi Selatan"),
  // Kota Yogyakarta (3471)
  district("347101", "347101", "3471", "Gondokusuman"),
  district("347102", "347102", "3471", "Gondomanan"),
  district("347103", "347103", "3471", "Kotagede"),
  district("347104", "347104", "3471", "Danurejan"),
  district("347105", "347105", "3471", "Ngampilan"),
];

export const VILLAGES: readonly Village[] = [
  // Kebayoran Baru (317501) - Kota Jakarta Selatan
  village("31750101", "31750101", "317501", "Karet Kuningan"),
  village("31750102", "31750102", "317501", "Selong"),
  village("31750103", "31750103", "317501", "Paseban"),
  village("31750104", "31750104", "317501", "Petamburan"),
  village("31750105", "31750105", "317501", "Kemang"),
  // Gondokusuman (347101) - Kota Yogyakarta
  village("34710101", "34710101", "347101", "Kotabaru"),
  village("34710102", "34710102", "347101", "Banjaransari"),
  village("34710103", "34710103", "347101", "Gondokusuman"),
  village("34710104", "34710104", "347101", "Jurug"),
  village("34710105", "34710105", "347101", "Mergangsan"),
];

export function findProvinceById(id: string): Province | undefined {
  return PROVINCES.find((p) => p.id === id);
}

export function findRegencyById(id: string): Regency | undefined {
  return REGENCIES.find((r) => r.id === id);
}

export function findDistrictById(id: string): District | undefined {
  return DISTRICTS.find((d) => d.id === id);
}

export function findVillageById(id: string): Village | undefined {
  return VILLAGES.find((v) => v.id === id);
}
