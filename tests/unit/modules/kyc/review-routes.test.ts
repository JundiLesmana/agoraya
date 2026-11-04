import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface MockApprovalDetail {
  id: string;
  approvalSlot: 1 | 2;
  decision: "approved" | "rejected";
  reason: string | null;
  approverId: string | null;
  approverName: string | null;
  createdAt: string;
}

interface MockKycReviewDetail {
  rosterId: string;
  tenantId: string;
  submittedBy: string | null;
  submittedAt: string;
  updatedAt: string;
  status: "pending" | "partially_approved" | "verified" | "rejected" | "expired";
  expiresAt: string | null;
  subject: {
    userId: string;
    name: string;
    email: string;
    nik: string | null;
    userStatus: string;
    nip: string | null;
    opdName: string | null;
    unitName: string | null;
    positionName: string | null;
    positionType: string | null;
  };
  approvals: MockApprovalDetail[];
  canReview: boolean;
  nextAction: "first_approval" | "second_approval" | "completed";
}

const sessionState = vi.hoisted(() => ({
  value: {
    userId: "reviewer-1",
    tenantId: "tenant-1",
    role: "admin",
    roles: ["admin"],
    email: "reviewer@example.com",
  },
}));

const detailState = vi.hoisted(() => ({
  value: {
    rosterId: "550e8400-e29b-41d4-a716-446655440000",
    tenantId: "tenant-1",
    submittedBy: "maker-1",
    submittedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "pending",
    expiresAt: null,
    subject: {
      userId: "asn-1",
      name: "Siti Aminah",
      email: "siti@example.com",
      nik: "3175091201010001",
      userStatus: "active",
      nip: "198501012010012001",
      opdName: "Dinas Kominfo",
      unitName: "Bidang Data",
      positionName: "Analis Kebijakan",
      positionType: "functional",
    },
    approvals: [],
    canReview: true,
    nextAction: "first_approval",
  } as MockKycReviewDetail,
}));

const approvalState = vi.hoisted(() => ({
  result: {
    approval: {
      id: "approval-1",
      rosterId: "550e8400-e29b-41d4-a716-446655440000",
      tenantId: "tenant-1",
      approverId: "reviewer-1",
      approvalSlot: 1,
      decision: "approved",
      reason: "Dokumen sesuai",
      createdAt: new Date("2026-01-01T00:05:00.000Z"),
      updatedAt: new Date("2026-01-01T00:05:00.000Z"),
    },
    entry: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      tenantId: "tenant-1",
      userId: "asn-1",
      nikHash: "hash",
      name: "Siti Aminah",
      status: "partially_approved",
      expiresAt: null,
      submittedBy: "maker-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:05:00.000Z"),
    },
  },
}));

const moduleState = vi.hoisted(() => ({
  serviceSubmitApproval: vi.fn(async () => approvalState.result),
  repositoryFactory: vi.fn(() => ({ mocked: true })),
  dbFactory: vi.fn(() => ({ mocked: true })),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentSession: vi.fn(async () => sessionState.value),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/modules/kyc/review-detail-service", () => ({
  getKycReviewDetail: vi.fn(async () => detailState.value),
}));

vi.mock("@/lib/db", () => ({
  db: moduleState.dbFactory,
}));

vi.mock("@/modules/kyc", () => ({
  createDrizzleKycRepository: moduleState.repositoryFactory,
  DualApprovalService: class {
    submitApproval = moduleState.serviceSubmitApproval;
  },
}));

import { GET as getKycReviewDetailRoute } from "@/app/api/v1/kyc/asn/[id]/route";
import { POST as postKycDecisionRoute } from "@/app/api/v1/kyc/asn/[id]/decision/route";
import { getKycReviewDetail } from "@/modules/kyc/review-detail-service";

const ROSTER_ID = "550e8400-e29b-41d4-a716-446655440000";

function routeContext(id = ROSTER_ID) {
  return { params: Promise.resolve({ id }) };
}

describe("KYC review routes", () => {
  beforeEach(() => {
    sessionState.value = {
      userId: "reviewer-1",
      tenantId: "tenant-1",
      role: "admin",
      roles: ["admin"],
      email: "reviewer@example.com",
    };
    detailState.value = {
      rosterId: ROSTER_ID,
      tenantId: "tenant-1",
      submittedBy: "maker-1",
      submittedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      status: "pending",
      expiresAt: null,
      subject: {
        userId: "asn-1",
        name: "Siti Aminah",
        email: "siti@example.com",
        nik: "3175091201010001",
        userStatus: "active",
        nip: "198501012010012001",
        opdName: "Dinas Kominfo",
        unitName: "Bidang Data",
        positionName: "Analis Kebijakan",
        positionType: "functional",
      },
      approvals: [],
      canReview: true,
      nextAction: "first_approval",
    } satisfies MockKycReviewDetail;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns KYC review detail for an authorized reviewer", async () => {
    const response = await getKycReviewDetailRoute(
      new Request(`http://localhost/api/v1/kyc/asn/${ROSTER_ID}`),
      routeContext(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: detailState.value });
    expect(vi.mocked(getKycReviewDetail)).toHaveBeenCalledWith(
      ROSTER_ID,
      "tenant-1",
      "reviewer-1",
    );
  });

  it("rejects non-reviewers", async () => {
    sessionState.value = {
      userId: "operator-1",
      tenantId: "tenant-1",
      role: "operator",
      roles: ["operator"],
      email: "operator@example.com",
    };

    const response = await getKycReviewDetailRoute(
      new Request(`http://localhost/api/v1/kyc/asn/${ROSTER_ID}`),
      routeContext(),
    );

    expect(response.status).toBe(403);
    expect(vi.mocked(getKycReviewDetail)).not.toHaveBeenCalled();
  });

  it("submits a KYC review decision and returns the refreshed detail", async () => {
    detailState.value = {
      ...detailState.value,
      status: "partially_approved",
      updatedAt: "2026-01-01T00:05:00.000Z",
      approvals: [
        {
          id: "approval-1",
          approvalSlot: 1,
          decision: "approved",
          reason: "Dokumen sesuai",
          approverId: "reviewer-1",
          approverName: "Reviewer Satu",
          createdAt: "2026-01-01T00:05:00.000Z",
        },
      ],
      canReview: false,
      nextAction: "second_approval",
    } satisfies MockKycReviewDetail;

    const response = await postKycDecisionRoute(
      new Request(`http://localhost/api/v1/kyc/asn/${ROSTER_ID}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "approved", reason: "Dokumen sesuai" }),
      }),
      routeContext(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: detailState.value });
    expect(moduleState.serviceSubmitApproval).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      rosterId: ROSTER_ID,
      approverId: "reviewer-1",
      decision: "approved",
      reason: "Dokumen sesuai",
    });
    expect(vi.mocked(getKycReviewDetail)).toHaveBeenCalledWith(
      ROSTER_ID,
      "tenant-1",
      "reviewer-1",
    );
  });

  it("rejects invalid decision payloads before calling the service", async () => {
    const response = await postKycDecisionRoute(
      new Request(`http://localhost/api/v1/kyc/asn/${ROSTER_ID}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "unknown" }),
      }),
      routeContext(),
    );

    expect(response.status).toBe(400);
    expect(moduleState.serviceSubmitApproval).not.toHaveBeenCalled();
  });
});
