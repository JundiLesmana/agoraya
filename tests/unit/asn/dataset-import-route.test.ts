import { beforeEach, describe, expect, it, vi } from "vitest";

const requireModuleAccess = vi.fn();
const syncBpsStatistics = vi.fn();
const upsertBpsDatasetCatalog = vi.fn();
const loggerError = vi.fn();

vi.mock("@/lib/auth/require-module-access", () => ({
  requireModuleAccess,
}));

vi.mock("@/modules/integrations/bps", () => {
  class MockBpsHttpAdapter {
    async fetchJson(): Promise<unknown> {
      return {};
    }
  }
  return {
    syncBpsStatistics,
    BpsHttpAdapter: MockBpsHttpAdapter,
  };
});

vi.mock("@/modules/integrations/bps/catalog", () => ({
  upsertBpsDatasetCatalog,
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: loggerError, info: vi.fn() },
}));

vi.mock("@/lib/env", () => ({
  getEnv: () => ({ BPS_STATISTICS_INDICATORS: "0000:413:0:0" }),
}));

describe("ASN dataset import route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    loggerError.mockReset();
    requireModuleAccess.mockResolvedValue({
      authorized: true,
      session: { userId: "user-1", roles: ["asn"] },
    });
    syncBpsStatistics.mockResolvedValue({
      synced: true,
      count: 7,
    });
    upsertBpsDatasetCatalog.mockResolvedValue(undefined);
  });

  it("menyinkronkan data BPS yang tersedia saat ini untuk operator ASN", async () => {
    const { POST } = await import("@/app/api/asn/datasets/import/route");
    const response = await POST();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.imported).toBe(true);
    expect(body.count).toBe(7);
    expect(syncBpsStatistics).toHaveBeenCalledTimes(1);
  });

  it("mengembalikan 200 tanpa exception saat BPS API gagal (degradasi)", async () => {
    syncBpsStatistics.mockResolvedValue({
      synced: false,
      count: 0,
      error: "BPS API down",
    });
    const { POST } = await import("@/app/api/asn/datasets/import/route");
    const response = await POST();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.imported).toBe(false);
    expect(body.error).toBe("BPS API down");
  });

  it("menolak impor untuk pengguna tanpa akses module insight", async () => {
    requireModuleAccess.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });
    const { POST } = await import("@/app/api/asn/datasets/import/route");
    const response = await POST();
    expect(response.status).toBe(403);
    expect(syncBpsStatistics).not.toHaveBeenCalled();
  });

  it("menolak impor untuk bukan peran ASN/staff/superadmin", async () => {
    requireModuleAccess.mockResolvedValue({
      authorized: true,
      session: { userId: "user-2", roles: ["citizen"] },
    });
    const { POST } = await import("@/app/api/asn/datasets/import/route");
    const response = await POST();
    expect(response.status).toBe(403);
    expect(syncBpsStatistics).not.toHaveBeenCalled();
  });

  it("mencatat kode error terstruktur tanpa membocorkan pesan error", async () => {
    syncBpsStatistics.mockRejectedValue(
      Object.assign(new Error("sensitive database detail"), {
        name: "AppError",
        code: "DATABASE_ERROR",
        statusCode: 500,
        cause: Object.assign(new Error("sensitive query detail"), {
          code: "42P01",
        }),
      }),
    );

    const { POST } = await import("@/app/api/asn/datasets/import/route");
    const response = await POST();

    expect(response.status).toBe(500);
    expect(loggerError).toHaveBeenCalledWith("asn_dataset.import_failed", {
      errorName: "AppError",
      errorCode: "DATABASE_ERROR",
      errorStatusCode: 500,
      causeName: "Error",
      causeCode: "42P01",
    });
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain(
      "sensitive database detail",
    );
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain(
      "sensitive query detail",
    );
  });

  it("mencatat nama environment yang tidak valid tanpa nilainya", async () => {
    const { AppError, ErrorCode } = await import("@/lib/errors");
    syncBpsStatistics.mockRejectedValue(
      new AppError(
        ErrorCode.ENV_VALIDATION_FAILED,
        "Missing or invalid required environment variables: AUTH_SECRET",
        {
          context: { missingEnvVars: "AUTH_SECRET" },
        },
      ),
    );

    const { POST } = await import("@/app/api/asn/datasets/import/route");
    const response = await POST();

    expect(response.status).toBe(500);
    expect(loggerError).toHaveBeenCalledWith(
      "asn_dataset.import_failed",
      expect.objectContaining({
        errorCode: "ENV_VALIDATION_FAILED",
        missingEnvVars: "AUTH_SECRET",
      }),
    );
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain(
      "Missing or invalid required environment variables",
    );
  });
});
