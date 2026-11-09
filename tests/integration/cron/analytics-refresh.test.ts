import { describe, expect, it, vi, beforeEach } from "vitest";
import { ExternalServiceError } from "@/lib/errors";
import { GET } from "@/app/api/cron/analytics/refresh/route";
import { getDefaultDatabase } from "@/lib/db/client";
import {
  invalidateAggregateCache,
  isAnalyticsRefreshSecretConfigured,
  isAuthorizedAnalyticsRefresh,
  refreshAnalyticsMaterializedView,
} from "@/modules/analytics";
import { BpsHttpAdapter } from "@/modules/integrations/bps/adapter";
import { upsertBpsDatasetCatalog } from "@/modules/integrations/bps/catalog";
import { upsertBpsStatistics } from "@/modules/integrations/bps/service";

vi.mock("@/lib/db/client", () => ({
  getDefaultDatabase: vi.fn(),
}));
vi.mock("@/lib/env", () => ({
  getEnv: vi.fn(() => ({
    BPS_STATISTICS_INDICATORS: "0000:413:0:0",
  })),
}));
vi.mock("@/modules/analytics", () => ({
  refreshAnalyticsMaterializedView: vi.fn(async () => {}),
  invalidateAggregateCache: vi.fn(),
  isAnalyticsRefreshSecretConfigured: vi.fn(() => true),
  isAuthorizedAnalyticsRefresh: vi.fn(() => true),
}));
vi.mock("@/modules/integrations/bps/service", () => ({
  upsertBpsStatistics: vi.fn(),
}));
vi.mock("@/modules/integrations/bps/catalog", () => ({
  upsertBpsDatasetCatalog: vi.fn(),
}));
vi.mock("@/modules/integrations/bps/adapter", () => {
  const fetchJson = vi.fn();
  class BpsHttpAdapter {
    fetchJson = fetchJson;
  }
  return { BpsHttpAdapter };
});

const SECRET = "a-test-cron-secret-with-at-least-32-bytes";

const mockGetDefaultDatabase = getDefaultDatabase as unknown as ReturnType<
  typeof vi.fn
>;
const mockRefresh = refreshAnalyticsMaterializedView as unknown as ReturnType<
  typeof vi.fn
>;
const mockInvalidate = invalidateAggregateCache as unknown as ReturnType<
  typeof vi.fn
>;
const mockIsConfigured =
  isAnalyticsRefreshSecretConfigured as unknown as ReturnType<typeof vi.fn>;
const mockIsAuthorized = isAuthorizedAnalyticsRefresh as unknown as ReturnType<
  typeof vi.fn
>;
const mockUpsertCatalog = upsertBpsDatasetCatalog as ReturnType<typeof vi.fn>;
const mockUpsert = upsertBpsStatistics as unknown as ReturnType<typeof vi.fn>;

let mockFetchJson!: ReturnType<typeof vi.fn>;

const fakeDb = { query: vi.fn(async () => []) };

beforeEach(() => {
  vi.clearAllMocks();
  mockIsConfigured.mockReturnValue(true);
  mockIsAuthorized.mockReturnValue(true);
  mockGetDefaultDatabase.mockReturnValue(fakeDb);
  mockUpsert.mockResolvedValue({ count: 0, rows: [] });
  mockFetchJson = new BpsHttpAdapter().fetchJson as ReturnType<typeof vi.fn>;
  mockFetchJson.mockClear();
});

describe("GET /api/cron/analytics/refresh", () => {
  it("mengembalikan 401 saat header Authorization tidak valid atau hilang", async () => {
    mockIsAuthorized.mockReturnValue(false);

    const response = await GET(
      new Request("http://localhost/api/cron/analytics/refresh"),
    );

    expect(response.status).toBe(401);
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("mengembalikan 200 tanpa melempar exception saat BPS API gagal total, dan tidak merusak data SIMULATED", async () => {
    mockFetchJson.mockRejectedValue(
      new ExternalServiceError("BPS API down", { statusCode: 502 }),
    );

    const response = await GET(
      new Request("http://localhost/api/cron/analytics/refresh", {
        headers: { authorization: `Bearer ${SECRET}` },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("refreshed");
    expect(body.bpsSynced).toBe(false);
    expect(body.bpsError).toBe("BPS API down");
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockUpsertCatalog).not.toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
  });

  it("mengembalikan 200 dan menuliskan data BPS_API saat BPS API sukses", async () => {
    mockFetchJson
      .mockResolvedValueOnce({
        status: "OK",
        data: [{ page: 1, pages: 1 }, [{ th_id: 124, th: "2024" }]],
      })
      .mockResolvedValueOnce({
        status: "OK",
        var: [{ val: 413, label: "IPM", unit: "Indeks" }],
        tahun: [{ val: 124, label: "2024" }],
        turvar: [{ val: 0, label: "Tidak ada" }],
        turtahun: [{ val: 0, label: "Tahunan" }],
        vervar: [{ val: 1100, label: "ACEH" }],
        datacontent: { "110041301240": 74.03 },
      });
    mockUpsert.mockResolvedValue({ count: 1, rows: [] });

    const response = await GET(
      new Request("http://localhost/api/cron/analytics/refresh", {
        headers: { authorization: `Bearer ${SECRET}` },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.bpsSynced).toBe(true);
    expect(body.bpsCount).toBe(1);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsertCatalog).toHaveBeenCalledTimes(1);
  });
});
