import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConflictError, ValidationError } from "@/lib/errors";
import {
  confirmExecutiveAccessDraft,
  getExecutiveAccessPreview,
} from "@/modules/asn/access-service";

const dbState = vi.hoisted(() => ({
  applicationRolesRows: [{ id: "role-1", key: "operator", name: "Operator" }],
  userRow: {
    userId: "user-1",
    name: "Siti Aminah",
    email: "siti@example.com",
    accountStatus: "active",
    nip: "19876543210001",
    opd: "Dinas Kominfo",
    unit: "Data",
    position: "Analis",
    emailVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
    kycStatus: "verified",
  },
  accessStateRow: {
    userId: "user-1",
    accountStatus: "active",
    executiveStatus: "not_granted",
  },
  userRolesRows: [] as Array<{ roleKey: string; roleName: string }>,
  moduleRows: [] as Array<{ moduleKey: "kyc" | "ogd" | "insight" | "pst" | "civic_reporting" }>,
}));

const updateAsnAccessMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: () => ({
    select(selection: Record<string, unknown>) {
      const values = Object.values(selection);
      const fieldNames = values
        .map((value) => (value && typeof value === "object" && "name" in value ? String((value as { name: string }).name) : null))
        .filter((value): value is string => value !== null);

      let rows: unknown[] = [];
      if (fieldNames.includes("email") && fieldNames.includes("nip")) {
        rows = [dbState.userRow];
      } else if (fieldNames.includes("moduleKey")) {
        rows = dbState.moduleRows;
      } else if (fieldNames.includes("roleKey") && fieldNames.includes("roleName")) {
        rows = dbState.userRolesRows;
      } else if (fieldNames.includes("executiveStatus") && fieldNames.includes("accountStatus")) {
        rows = [dbState.accessStateRow];
      } else if (fieldNames.includes("key") && fieldNames.includes("name")) {
        rows = dbState.applicationRolesRows;
      }

      return {
        from() {
          return {
            innerJoin() {
              return this;
            },
            leftJoin() {
              return this;
            },
            where() {
              return this;
            },
            orderBy() {
              return this;
            },
            limit(limit: number) {
              return Promise.resolve(rows.slice(0, limit));
            },
            then(onFulfilled: (value: unknown[]) => unknown, onRejected?: (reason: unknown) => unknown) {
              return Promise.resolve(rows).then(onFulfilled, onRejected);
            },
          };
        },
      };
    },
    transaction: updateAsnAccessMock,
  }),
}));

vi.mock("@/modules/audit", () => ({
  appendAsnAccessAuditEvent: vi.fn(),
}));

const AUDIT_SECRET = "12345678901234567890123456789012";

function createDraftToken(overrides?: {
  userId?: string;
  tenantId?: string;
  actorId?: string;
  issuedAt?: string;
  expiresAt?: string;
}) {
  const payload = {
    userId: overrides?.userId ?? "user-1",
    tenantId: overrides?.tenantId ?? "tenant-1",
    actorId: overrides?.actorId ?? "actor-1",
    issuedAt: overrides?.issuedAt ?? "2026-01-01T00:00:00.000Z",
    expiresAt: overrides?.expiresAt ?? "2099-01-01T00:15:00.000Z",
    before: {
      accountStatus: "inactive",
      applicationRoles: [] as string[],
      modules: [] as string[],
      executiveStatus: "not_granted" as const,
    },
    after: {
      accountStatus: "active",
      applicationRoles: ["operator"],
      modules: ["kyc"],
      executiveStatus: "observer" as const,
    },
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", AUDIT_SECRET)
    .update(`1.${encodedPayload}`)
    .digest("base64url");
  return `v1.${encodedPayload}.${signature}`;
}

describe("ASN access service executive draft flows", () => {
  beforeEach(() => {
    process.env.AUDIT_HMAC_SECRET = AUDIT_SECRET;
    dbState.applicationRolesRows = [{ id: "role-1", key: "operator", name: "Operator" }];
    dbState.userRow = {
      userId: "user-1",
      name: "Siti Aminah",
      email: "siti@example.com",
      accountStatus: "active",
      nip: "19876543210001",
      opd: "Dinas Kominfo",
      unit: "Data",
      position: "Analis",
      emailVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
      kycStatus: "verified",
    };
    dbState.accessStateRow = {
      userId: "user-1",
      accountStatus: "active",
      executiveStatus: "not_granted",
    };
    dbState.userRolesRows = [];
    dbState.moduleRows = [];
    updateAsnAccessMock.mockReset();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.AUDIT_HMAC_SECRET;
  });

  it("rejects preview when the draft token actor does not match", async () => {
    await expect(
      getExecutiveAccessPreview(
        "user-1",
        "tenant-1",
        "actor-1",
        createDraftToken({ actorId: "actor-2" }),
      ),
    ).rejects.toMatchObject<Partial<ValidationError>>({
      message: "Draft akses executive tidak cocok dengan permintaan ini.",
      statusCode: 400,
    });
  });

  it("rejects preview when the draft token has expired", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:20:00.000Z"));

    await expect(
      getExecutiveAccessPreview(
        "user-1",
        "tenant-1",
        "actor-1",
        createDraftToken({ expiresAt: "2026-01-01T00:15:00.000Z" }),
      ),
    ).rejects.toMatchObject<Partial<ConflictError>>({
      message: "Draft akses executive sudah kedaluwarsa.",
      statusCode: 409,
    });
  });

  it("rejects confirm when the draft token tenant does not match", async () => {
    await expect(
      confirmExecutiveAccessDraft(
        "user-1",
        "tenant-1",
        "actor-1",
        createDraftToken({ tenantId: "tenant-2" }),
      ),
    ).rejects.toMatchObject<Partial<ValidationError>>({
      message: "Draft akses executive tidak cocok dengan permintaan ini.",
      statusCode: 400,
    });
    expect(updateAsnAccessMock).not.toHaveBeenCalled();
  });

  it("rejects confirm when the draft token has expired", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:20:00.000Z"));

    await expect(
      confirmExecutiveAccessDraft(
        "user-1",
        "tenant-1",
        "actor-1",
        createDraftToken({ expiresAt: "2026-01-01T00:15:00.000Z" }),
      ),
    ).rejects.toMatchObject<Partial<ConflictError>>({
      message: "Draft akses executive sudah kedaluwarsa.",
      statusCode: 409,
    });
    expect(updateAsnAccessMock).not.toHaveBeenCalled();
  });
});
