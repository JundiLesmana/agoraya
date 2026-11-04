import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sessionState = vi.hoisted(() => ({
  value: {
    userId: "actor-1",
    tenantId: "tenant-1",
    role: "superadmin",
    roles: ["superadmin"],
    email: "admin@example.com",
  },
}));

const serviceState = vi.hoisted(() => ({
  detailResult: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Siti Aminah",
    emailMasked: "si***@example.com",
    nipMasked: "19******0001",
    opd: "Dinas Kominfo",
    unit: "Data",
    position: "Analis",
    accountStatus: "active",
    applicationRoles: [{ key: "operator", name: "Operator" }],
    modules: ["kyc"],
    executiveStatus: "observer",
    requirements: [],
  },
  draftResult: {
    draftToken: "draft-token",
    subject: { id: "550e8400-e29b-41d4-a716-446655440000", name: "Siti Aminah" },
    before: { accountStatus: "inactive", applicationRoles: [], modules: [], executiveStatus: "not_granted" },
    after: { accountStatus: "active", applicationRoles: [{ key: "operator", name: "Operator" }], modules: ["kyc"], executiveStatus: "observer" },
    requirements: [],
    issuedAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-01-01T00:15:00.000Z",
  },
  previewResult: {
    subject: { id: "550e8400-e29b-41d4-a716-446655440000", name: "Siti Aminah" },
    current: { accountStatus: "inactive", applicationRoles: [], modules: [], executiveStatus: "not_granted" },
    draft: { accountStatus: "active", applicationRoles: [{ key: "operator", name: "Operator" }], modules: ["kyc"], executiveStatus: "observer" },
    requirements: [],
    issuedAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-01-01T00:15:00.000Z",
  },
  confirmResult: {
    userId: "550e8400-e29b-41d4-a716-446655440000",
    accountStatus: "active",
    applicationRoles: [{ key: "operator", name: "Operator" }],
    modules: ["kyc"],
    executiveStatus: "observer",
    updatedAt: "2026-01-01T00:05:00.000Z",
  },
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

vi.mock("@/modules/asn/access-service", () => ({
  getAsnAccessDetail: vi.fn(async () => serviceState.detailResult),
  createExecutiveAccessDraft: vi.fn(async () => serviceState.draftResult),
  getExecutiveAccessPreview: vi.fn(async () => serviceState.previewResult),
  confirmExecutiveAccessDraft: vi.fn(async () => serviceState.confirmResult),
}));

import { GET as getAccessDetail } from "@/app/api/v1/asn/[id]/access-detail/route";
import { GET as getAccessPreview } from "@/app/api/v1/asn/[id]/access-preview/route";
import { POST as postExecutiveAccessConfirm } from "@/app/api/v1/asn/[id]/executive-access/confirm/route";
import { POST as postExecutiveAccessDraft } from "@/app/api/v1/asn/[id]/executive-access/draft/route";
import {
  confirmExecutiveAccessDraft,
  createExecutiveAccessDraft,
  getAsnAccessDetail,
  getExecutiveAccessPreview,
} from "@/modules/asn/access-service";

const ASN_ID = "550e8400-e29b-41d4-a716-446655440000";

function routeContext(id = ASN_ID) {
  return { params: Promise.resolve({ id }) };
}

describe("ASN executive access routes", () => {
  beforeEach(() => {
    sessionState.value = {
      userId: "actor-1",
      tenantId: "tenant-1",
      role: "superadmin",
      roles: ["superadmin"],
      email: "admin@example.com",
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns access detail for a superadmin", async () => {
    const response = await getAccessDetail(new Request(`http://localhost/api/v1/asn/${ASN_ID}/access-detail`), routeContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: serviceState.detailResult });
    expect(vi.mocked(getAsnAccessDetail)).toHaveBeenCalledWith(ASN_ID, "tenant-1");
  });

  it("creates an executive access draft", async () => {
    const response = await postExecutiveAccessDraft(
      new Request(`http://localhost/api/v1/asn/${ASN_ID}/executive-access/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountStatus: "active",
          applicationRoles: ["operator"],
          modules: ["kyc"],
          executiveStatus: "observer",
        }),
      }),
      routeContext(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: serviceState.draftResult });
    expect(vi.mocked(createExecutiveAccessDraft)).toHaveBeenCalledWith(
      ASN_ID,
      "tenant-1",
      "actor-1",
      {
        accountStatus: "active",
        applicationRoles: ["operator"],
        modules: ["kyc"],
        executiveStatus: "observer",
      },
    );
  });

  it("reads an executive access preview from the draft token", async () => {
    const response = await getAccessPreview(
      new Request(`http://localhost/api/v1/asn/${ASN_ID}/access-preview?draftToken=draft-token`),
      routeContext(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: serviceState.previewResult });
    expect(vi.mocked(getExecutiveAccessPreview)).toHaveBeenCalledWith(
      ASN_ID,
      "tenant-1",
      "actor-1",
      "draft-token",
    );
  });

  it("confirms an executive access draft", async () => {
    const response = await postExecutiveAccessConfirm(
      new Request(`http://localhost/api/v1/asn/${ASN_ID}/executive-access/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftToken: "draft-token" }),
      }),
      routeContext(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: serviceState.confirmResult });
    expect(vi.mocked(confirmExecutiveAccessDraft)).toHaveBeenCalledWith(
      ASN_ID,
      "tenant-1",
      "actor-1",
      "draft-token",
    );
  });

  it("rejects non-superadmin access", async () => {
    sessionState.value = {
      userId: "actor-1",
      tenantId: "tenant-1",
      role: "operator",
      roles: ["operator"],
      email: "operator@example.com",
    };

    const response = await getAccessDetail(
      new Request(`http://localhost/api/v1/asn/${ASN_ID}/access-detail`),
      routeContext(),
    );

    expect(response.status).toBe(403);
    expect(vi.mocked(getAsnAccessDetail)).not.toHaveBeenCalled();
  });

  it("rejects invalid draft payloads before calling the service", async () => {
    const response = await postExecutiveAccessDraft(
      new Request(`http://localhost/api/v1/asn/${ASN_ID}/executive-access/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: ["unknown"] }),
      }),
      routeContext(),
    );

    expect(response.status).toBe(400);
    expect(vi.mocked(createExecutiveAccessDraft)).not.toHaveBeenCalled();
  });
});
