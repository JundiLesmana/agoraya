import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentSession, appendAuditEvent, saveApbdWorkspace, loggerError } =
  vi.hoisted(() => ({
    getCurrentSession: vi.fn(),
    appendAuditEvent: vi.fn(),
    saveApbdWorkspace: vi.fn(),
    loggerError: vi.fn(),
  }));

vi.mock("@/lib/auth/session", () => ({ getCurrentSession }));
vi.mock("@/lib/db", () => ({ db: vi.fn(() => ({})) }));
vi.mock("@/modules/audit", () => ({ appendAuditEvent }));
vi.mock("@/lib/logger", () => ({ logger: { error: loggerError } }));
vi.mock("@/modules/apbd-budget/service", () => ({
  ApbdBudgetError: class ApbdBudgetError extends Error {
    status: number;
    rowErrors: readonly unknown[];

    constructor(
      message: string,
      status: number,
      rowErrors: readonly unknown[] = [],
    ) {
      super(message);
      this.status = status;
      this.rowErrors = rowErrors;
    }
  },
  getApbdWorkspace: vi.fn(),
  saveApbdWorkspace,
}));

describe("APBD input route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue({
      userId: "11111111-1111-4111-8111-111111111111",
      tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      role: "asn",
      roles: ["asn"],
    });
    saveApbdWorkspace.mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      status: "in_review",
      items: [{ code: "EDU-01" }],
    });
    appendAuditEvent.mockResolvedValue(undefined);
  });

  it("writes tenant-scoped audit metadata for an APBD review submission", async () => {
    const { POST } = await import("@/app/api/asn/apbd/route");
    const payload = {
      referenceYear: 2026,
      agencyId: "dinas-pendidikan-kota-contoh",
      regionId: "kota-contoh",
      sectorId: "education",
      status: "in_review",
      items: [{ code: "EDU-01" }],
    };

    const response = await POST(
      new Request("http://localhost/api/asn/apbd", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(200);
    expect(appendAuditEvent).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        action: "asn.apbd.submitted",
        targetTable: "apbd_entries",
        metadata: expect.objectContaining({
          tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          status: "in_review",
          referenceYear: 2026,
          agencyId: "dinas-pendidikan-kota-contoh",
          regionId: "kota-contoh",
          sectorId: "education",
        }),
      }),
    );
  });
});