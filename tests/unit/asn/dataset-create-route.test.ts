import { beforeEach, describe, expect, it, vi } from "vitest";

const requireModuleAccess = vi.fn();

const createdRow = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "anggaran-contoh",
  title: "Anggaran Contoh",
  category: "Anggaran",
  sourceLabel: "CITIZEN_UNVERIFIED",
};

const mockTx = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  insert: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
};

const mockDb = {
  transaction: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  db: vi.fn(() => mockDb),
}));

vi.mock("@/lib/auth/require-module-access", () => ({
  requireModuleAccess,
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}));

function buildRequest(overrides: Record<string, string> = {}): Request {
  const formData = new FormData();
  formData.set("category", "Anggaran");
  formData.set("title", "Anggaran Contoh");
  formData.set("summary", "Ringkasan contoh anggaran.");
  formData.set("description", "Deskripsi lengkap contoh dataset anggaran.");
  formData.set(
    "file",
    new File(["sektor,anggaran\nPendidikan,1000000\n"], "data.csv", {
      type: "text/csv",
    }),
  );
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return {
    formData: () => Promise.resolve(formData),
  } as unknown as Request;
}

describe("ASN dataset create route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireModuleAccess.mockResolvedValue({
      authorized: true,
      session: { userId: "user-1", tenantId: "tenant-1", roles: ["asn"] },
    });
    mockTx.select.mockReturnValue(mockTx);
    mockTx.from.mockReturnValue(mockTx);
    mockTx.where.mockReturnValue(mockTx);
    mockTx.limit.mockResolvedValue([]);
    mockTx.insert.mockReturnValue(mockTx);
    mockTx.values.mockReturnValue(mockTx);
    mockTx.returning.mockResolvedValue([createdRow]);
    mockDb.transaction.mockImplementation(async (fn) => fn(mockTx));
    mockDb.insert.mockReturnValue(mockTx);
  });

  it("menyimpan dataset dari berkas CSV ke database untuk operator ASN", async () => {
    const { POST } = await import("@/app/api/asn/datasets/route");
    const response = await POST(buildRequest());
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.message).toContain("tersimpan ke database");
    expect(body.dataset.slug).toBe("anggaran-contoh");
    expect(body.dataset.category).toBe("Anggaran");
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.returning).toHaveBeenCalledTimes(1);
    const firstValues = mockTx.values.mock.calls[0][0] as { csvData?: string };
    expect(firstValues.csvData).toBe("sektor,anggaran\nPendidikan,1000000\n");
    const resourceValues = mockTx.values.mock.calls[1][0] as { url?: string };
    expect(resourceValues.url).toBe(
      "/api/asn/datasets/anggaran-contoh/download",
    );
  });

  it("mengembalikan 400 ketika berkas CSV tidak diunggah", async () => {
    const { POST } = await import("@/app/api/asn/datasets/route");
    const response = await POST(buildRequest({ file: "" }));
    expect(response.status).toBe(400);
    expect(mockTx.insert).not.toHaveBeenCalled();
  });

  it("menolak penambahan dataset untuk pengguna tanpa akses module insight", async () => {
    requireModuleAccess.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });
    const { POST } = await import("@/app/api/asn/datasets/route");
    mockTx.returning.mockResolvedValue([
      { ...createdRow, slug: "anggaran-contoh-2" },
    ]);
    const response = await POST(buildRequest());
    expect(response.status).toBe(403);
    expect(mockTx.insert).not.toHaveBeenCalled();
  });

  it("menghasilkan slug unik ketika slug sudah ada", async () => {
    let limitCalls = 0;
    mockTx.limit.mockImplementation(() => {
      limitCalls += 1;
      return Promise.resolve(
        limitCalls === 1 ? [{ slug: "anggaran-contoh" }] : [],
      );
    });
    const { POST } = await import("@/app/api/asn/datasets/route");
    const response = await POST(buildRequest());
    expect(response.status).toBe(201);
    expect(limitCalls).toBe(2);
    const firstValues = mockTx.values.mock.calls[0][0] as { slug?: string };
    expect(firstValues.slug).toBe("anggaran-contoh-2");
    const resourceValues = mockTx.values.mock.calls[1][0] as { url?: string };
    expect(resourceValues.url).toBe(
      "/api/asn/datasets/anggaran-contoh-2/download",
    );
  });
});
