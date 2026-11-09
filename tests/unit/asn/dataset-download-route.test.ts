import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  db: vi.fn(() => mockDb),
}));

describe("ASN dataset download route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
  });

  it("returns the stored CSV as an attachment", async () => {
    mockDb.limit.mockResolvedValue([
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Pos Klimatologi",
        csvData: "pos,nilai\nPos A,24.5\n",
      },
    ]);

    const { GET } =
      await import("@/app/api/asn/datasets/[slug]/download/route");
    const response = await GET(
      new Request("http://localhost/api/asn/datasets/pos-klimatologi/download"),
      { params: Promise.resolve({ slug: "pos-klimatologi" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain(
      'filename="pos-klimatologi.csv"',
    );
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes)).toBe("pos,nilai\nPos A,24.5\n");
  });

  it("returns 404 when the dataset has no stored CSV file", async () => {
    mockDb.limit.mockResolvedValue([
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Pos Klimatologi",
        csvData: null,
      },
    ]);

    const { GET } =
      await import("@/app/api/asn/datasets/[slug]/download/route");
    const response = await GET(
      new Request("http://localhost/api/asn/datasets/pos-klimatologi/download"),
      { params: Promise.resolve({ slug: "pos-klimatologi" }) },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Berkas CSV tidak tersedia.",
    });
  });
});
