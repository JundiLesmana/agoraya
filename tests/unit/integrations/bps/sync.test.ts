import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ExternalServiceError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { BpsAdapter } from "@/modules/integrations/bps";
import { syncBpsStatistics } from "@/modules/integrations/bps/sync";
import { upsertBpsStatistics } from "@/modules/integrations/bps/service";
import { upsertBpsDatasetCatalog } from "@/modules/integrations/bps/catalog";

vi.mock("@/modules/integrations/bps/service", () => ({
  upsertBpsStatistics: vi.fn(),
}));
vi.mock("@/modules/integrations/bps/catalog", () => ({
  upsertBpsDatasetCatalog: vi.fn(),
}));

const mockUpsert = upsertBpsStatistics as ReturnType<typeof vi.fn>;
const mockUpsertCatalog = upsertBpsDatasetCatalog as ReturnType<typeof vi.fn>;
let warnSpy!: ReturnType<typeof vi.spyOn>;

const yearList = {
  status: "OK",
  data: [{ page: 1, pages: 1 }, [{ th_id: 124, th: "2024" }]],
};

const nativeData = {
  status: "OK",
  var: [{ val: 413, label: "IPM", unit: "Indeks" }],
  tahun: [{ val: 124, label: "2024" }],
  turvar: [{ val: 0, label: "Tidak ada" }],
  turtahun: [{ val: 0, label: "Tahunan" }],
  vervar: [{ val: 1100, label: "ACEH" }],
  datacontent: { "110041301240": 74.03 },
};

class FakeAdapter implements BpsAdapter {
  readonly endpoints: string[] = [];

  async fetchJson(endpoint: string): Promise<unknown> {
    this.endpoints.push(endpoint);
    return endpoint.includes("/list/model/th/") ? yearList : nativeData;
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  warnSpy = vi.spyOn(logger, "warn");
  mockUpsert.mockResolvedValue({ count: 0, rows: [] });
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe("syncBpsStatistics", () => {
  it("mengambil tahun terbaru, mengekstrak data native, lalu menyimpan source BPS_API", async () => {
    mockUpsert.mockResolvedValue({ count: 1, rows: [] });
    const adapter = new FakeAdapter();

    const result = await syncBpsStatistics(adapter, "0000:413:0:0");

    expect(result).toMatchObject({ synced: true, count: 1 });
    expect(adapter.endpoints).toEqual([
      "/list/model/th/lang/ind/domain/0000/var/413",
      "/list/model/data/domain/0000/var/413/th/124",
    ]);
    expect(mockUpsert).toHaveBeenCalledWith([
      {
        indicatorCode: "bps:0000:413:0:0",
        indicatorName: "IPM",
        regionCode: "1100",
        year: 2024,
        value: 74.03,
        unit: "Indeks",
        category: "Tidak ada",
      },
    ]);
    expect(mockUpsertCatalog).toHaveBeenCalledTimes(1);
  });

  it("tidak melempar exception dan mempertahankan snapshot saat BPS API gagal", async () => {
    const adapter: BpsAdapter = {
      fetchJson: vi.fn(async () => {
        throw new ExternalServiceError("BPS API timeout", { statusCode: 504 });
      }),
    };

    const result = await syncBpsStatistics(adapter, "0000:413:0:0");

    expect(result).toMatchObject({ synced: false, count: 0 });
    expect(result.error).toBe("BPS API timeout");
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockUpsertCatalog).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      "bps.sync.failed",
      expect.objectContaining({ sourceLabel: "SIMULATED" }),
    );
  });

  it("menolak konfigurasi kosong dan tidak membuat request BPS", async () => {
    const fetchJson = vi.fn();
    const adapter: BpsAdapter = { fetchJson };

    const result = await syncBpsStatistics(adapter, undefined);

    expect(result.synced).toBe(false);
    expect(fetchJson).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
