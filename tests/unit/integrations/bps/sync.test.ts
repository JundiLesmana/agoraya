import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ExternalServiceError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { BpsAdapter } from "@/modules/integrations/bps";
import { syncBpsStatistics } from "@/modules/integrations/bps/sync";
import { upsertBpsStatistics } from "@/modules/integrations/bps/service";

vi.mock("@/modules/integrations/bps/service", () => ({
  upsertBpsStatistics: vi.fn(),
}));

const mockUpsert = upsertBpsStatistics as ReturnType<typeof vi.fn>;
let warnSpy!: ReturnType<typeof vi.spyOn>;

class FakeAdapter implements BpsAdapter {
  constructor(private readonly impl: () => Promise<unknown>) {}

  async fetchJson(endpoint: string): Promise<unknown> {
    void endpoint;
    return this.impl();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  warnSpy = vi.spyOn(logger, "warn");
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe("syncBpsStatistics", () => {
  it("menyimpan data BPS yang di-parse dengan source_label BPS_API saat berhasil", async () => {
    mockUpsert.mockResolvedValue({ count: 2, rows: [] });
    const adapter = new FakeAdapter(async () => ({
      data: [
        { kode: "3171", nilai: 100, tahun: 2024 },
        { kode: "3201", nilai: 200, tahun: 2024 },
      ],
    }));

    const result = await syncBpsStatistics(adapter, "/statistik/data");

    expect(result).toMatchObject({ synced: true, count: 2 });
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const inputs = mockUpsert.mock.calls[0][0];
    expect(inputs).toHaveLength(2);
    for (const input of inputs) {
      expect(input.indicatorCode).toBe("IND_BPS_UTAMA");
      expect(input.unit).toBe("orang");
    }
    expect(inputs[0]).toMatchObject({ regionCode: "3171", value: 100, year: 2024 });
    expect(inputs[1]).toMatchObject({ regionCode: "3201", value: 200, year: 2024 });
  });

  it("tidak melempar exception dan mencatat warning saat BPS API gagal", async () => {
    mockUpsert.mockResolvedValue({ count: 0, rows: [] });
    const adapter = new FakeAdapter(async () => {
      throw new ExternalServiceError("BPS API timeout", { statusCode: 504 });
    });

    const result = await syncBpsStatistics(adapter, "/statistik/data");

    expect(result).toMatchObject({ synced: false, count: 0 });
    expect(result.error).toBe("BPS API timeout");
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    const calls = warnSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const [message, context] = calls[0] as [string, Record<string, unknown>];
    expect(message).toBe("bps.sync.failed");
    expect(context?.sourceLabel).toBe("SIMULATED");
  });
});
