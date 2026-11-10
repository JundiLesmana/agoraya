import { beforeEach, describe, expect, it, vi } from "vitest";

const requireModuleAccess = vi.fn();
const saveAsnDatasetSubmission = vi.fn();

vi.mock("@/lib/auth/require-module-access", () => ({
  requireModuleAccess,
}));

vi.mock("@/modules/asn-datasets/service", () => ({
  AsnDatasetError: class AsnDatasetError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  saveAsnDatasetSubmission,
}));

vi.mock("@/modules/dataset-catalog/repository", () => ({
  createDatasetCatalogRepository: () => ({ list: vi.fn() }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}));

const payload = {
  assignmentType: "apbd",
  agencyId: "agency-1",
  regionId: "region-1",
  regionName: "Wilayah Contoh",
  sectorId: "pendidikan",
  referenceYear: 2026,
  title: "Anggaran Contoh",
  summary: "Ringkasan contoh anggaran.",
  description: "Deskripsi lengkap contoh dataset anggaran.",
  category: "Anggaran",
  sourceOrganization: "Instansi Contoh",
  licenseName: "Terbuka",
  tags: [],
  frequency: "annual",
  mode: "submit",
};

function buildRequest({
  includeFile = true,
  includePayload = true,
}: {
  includeFile?: boolean;
  includePayload?: boolean;
} = {}): Request {
  const formData = new FormData();
  if (includePayload) formData.set("payload", JSON.stringify(payload));
  if (includeFile) {
    formData.set(
      "file",
      new File(["sektor,anggaran\nPendidikan,1000000\n"], "data.csv", {
        type: "text/csv",
      }),
    );
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
    saveAsnDatasetSubmission.mockResolvedValue({
      message: "Dataset tersimpan ke database.",
      dataset: {
        id: "11111111-1111-4111-8111-111111111111",
        slug: "anggaran-contoh",
        category: "Anggaran",
      },
    });
  });

  it("menyimpan CSV sebagai submission dengan payload penugasan", async () => {
    const { POST } = await import("@/app/api/asn/datasets/route");
    const response = await POST(buildRequest());

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      message: "Dataset tersimpan ke database.",
      dataset: { slug: "anggaran-contoh", category: "Anggaran" },
    });
    expect(saveAsnDatasetSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", tenantId: "tenant-1" }),
      payload,
      "sektor,anggaran\nPendidikan,1000000\n",
    );
  });

  it("menolak unggahan tanpa berkas CSV", async () => {
    const { POST } = await import("@/app/api/asn/datasets/route");
    const response = await POST(buildRequest({ includeFile: false }));

    expect(response.status).toBe(400);
    expect(saveAsnDatasetSubmission).not.toHaveBeenCalled();
  });

  it("menolak unggahan tanpa metadata dan penugasan", async () => {
    const { POST } = await import("@/app/api/asn/datasets/route");
    const response = await POST(buildRequest({ includePayload: false }));

    expect(response.status).toBe(400);
    expect(saveAsnDatasetSubmission).not.toHaveBeenCalled();
  });

  it("menolak penambahan dataset untuk pengguna tanpa akses", async () => {
    requireModuleAccess.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });
    const { POST } = await import("@/app/api/asn/datasets/route");
    const response = await POST(buildRequest());

    expect(response.status).toBe(403);
    expect(saveAsnDatasetSubmission).not.toHaveBeenCalled();
  });
});
