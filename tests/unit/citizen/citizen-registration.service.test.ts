import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface InsertCall {
  table: string;
  values: unknown;
}

const dbMock = vi.hoisted(() => ({
  selectResults: [] as unknown[][], // one result per select() call, in order
  selectCallIndex: 0,
  insertCalls: [] as InsertCall[],
  transactionCalls: 0,
}));

const cloudinaryMock = vi.hoisted(() => ({
  result: {
    publicId: "agoraya/citizen/tenant-id/ktp_abc123",
    secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/ktp.jpg",
    resourceType: "image",
    fileName: "ktp.jpg",
    mimeType: "image/jpeg",
    size: 12345,
  },
  error: null as Error | null,
}));

const hashPasswordMock = vi.hoisted(() => ({
  result: "$scrypt$32768$8$1$salt$hash",
}));

function makeDbMock() {
  const insert = vi.fn(function (this: unknown, _table: unknown) {
    const call: InsertCall = { table: String(_table), values: null };
    dbMock.insertCalls.push(call);
    return {
      values: vi.fn(function (this: unknown, values: unknown) {
        call.values = values as Record<string, unknown>;
        return this;
      }),
    };
  });

  return {
    select: vi.fn(function () {
      const result =
        dbMock.selectResults[dbMock.selectCallIndex] ?? [];
      dbMock.selectCallIndex += 1;
      return {
        from: vi.fn(function () {
          return {
            where: vi.fn(function () {
              return {
                limit: vi.fn().mockResolvedValue(result),
              };
            }),
          };
        }),
      };
    }),
    insert,
    transaction: vi.fn(async (fn: (tx: unknown) => unknown) => {
      dbMock.transactionCalls += 1;
      const tx = { insert };
      return fn(tx);
    }),
  };
}

vi.mock("@/lib/db", () => ({
  db: vi.fn(() => makeDbMock()),
}));

vi.mock("@/lib/cloudinary/upload", () => ({
  uploadToCloudinary: vi.fn(),
}));

vi.mock("@/modules/identity/password/service", () => ({
  hashPassword: vi.fn(),
}));

import { registerCitizen } from "@/modules/citizen/service";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { hashPassword } from "@/modules/identity/password/service";
import { db } from "@/lib/db";

const baseCommand = {
  nik: "3273010101010001",
  name: "Budi Santoso",
  email: "budi@example.id",
  phone: "081234567890",
  password: "rahasia123",
  attachment: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD",
  attachmentFileName: "ktp.jpg",
  attachmentMimeType: "image/jpeg" as const,
  selfie: "data:image/png;base64,iVBORw0KGgo=",
  selfieFileName: "selfie.png",
  selfieMimeType: "image/png" as const,
};

describe("registerCitizen service", () => {
  const kycTenantId = "00000000-0000-4000-8000-000000000001";

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "demo");
    vi.stubEnv("CLOUDINARY_API_KEY", "key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "secret");
    vi.stubEnv("CITIZEN_KYC_TENANT_ID", kycTenantId);

    dbMock.selectResults = [[], [], [{ id: kycTenantId }]];
    dbMock.selectCallIndex = 0;
    dbMock.insertCalls = [];
    dbMock.transactionCalls = 0;

    cloudinaryMock.result = {
      publicId: "agoraya/citizen/tenant-id/ktp_abc123",
      secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/ktp.jpg",
      resourceType: "image",
      fileName: "ktp.jpg",
      mimeType: "image/jpeg",
      size: 12345,
    };
    cloudinaryMock.error = null;

    hashPasswordMock.result = "$scrypt$32768$8$1$salt$hash";

    vi.mocked(uploadToCloudinary).mockImplementation(async ({ fileName }) => ({
      ...cloudinaryMock.result,
      publicId: `agoraya/citizen/tenant-id/${fileName}`,
      secureUrl: `https://res.cloudinary.com/demo/image/upload/v1/${fileName}`,
      fileName,
      mimeType: fileName === "ktp.jpg" ? "image/jpeg" : "image/png",
    }));
    vi.mocked(hashPassword).mockResolvedValue(hashPasswordMock.result);
    vi.mocked(db).mockImplementation(() => makeDbMock() as unknown as ReturnType<typeof db>);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("keeps citizen data isolated and places the KYC roster in the reviewer tenant", async () => {
    const result = await registerCitizen(baseCommand);

    expect(result.nik).toBe("3273010101010001");
    expect(result.email).toBe("budi@example.id");
    expect(result.status).toBe("pending");
    expect(typeof result.tenantId).toBe("string");
    expect(result.tenantId.length).toBeGreaterThan(0);

    expect(dbMock.selectCallIndex).toBe(3);
    expect(dbMock.transactionCalls).toBe(1);

    expect(dbMock.insertCalls.length).toBe(5);
    expect(dbMock.transactionCalls).toBe(1);

    expect(dbMock.insertCalls[1].values).toMatchObject({ tenantId: result.tenantId });
    expect(dbMock.insertCalls[2].values).toMatchObject({
      tenantId: kycTenantId,
      userId: expect.any(String),
      status: "pending",
    });
    expect(dbMock.insertCalls[3].values).toMatchObject({ tenantId: result.tenantId });

    expect(vi.mocked(uploadToCloudinary).mock.calls[0][0].tenantId).toBe(
      result.tenantId,
    );
    expect(vi.mocked(uploadToCloudinary)).toHaveBeenCalledTimes(2);
    expect(
      vi.mocked(uploadToCloudinary).mock.calls.map(([call]) => call.fileName),
    ).toEqual(["ktp.jpg", "selfie.png"]);
    const savedAttachments = dbMock.insertCalls.find((call) =>
      Array.isArray(call.values),
    )?.values as Array<Record<string, unknown>>;
    expect(savedAttachments.map((attachment) => attachment.attachmentType)).toEqual([
      "ktp",
      "selfie",
    ]);
    expect(savedAttachments.map((attachment) => attachment.fileName)).toEqual([
      "ktp.jpg",
      "selfie.png",
    ]);
    expect(vi.mocked(hashPassword).mock.calls[0][0]).toBe("rahasia123");
  });

  it("does not accept a missing KYC tenant in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CITIZEN_KYC_TENANT_ID", "");
    vi.stubEnv("REPORTING_TENANT_ID", "");
    dbMock.selectResults = [[], [], []];

    await expect(registerCitizen(baseCommand)).rejects.toMatchObject({
      code: "DATABASE_ERROR",
    });
    expect(vi.mocked(uploadToCloudinary)).not.toHaveBeenCalled();
    expect(dbMock.transactionCalls).toBe(0);
  });

  it("rejects duplicate NIK with conflict and writes nothing", async () => {
    dbMock.selectResults = [[{ id: "existing-user" }]];

    await expect(registerCitizen(baseCommand)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(dbMock.transactionCalls).toBe(0);
    expect(vi.mocked(uploadToCloudinary)).not.toHaveBeenCalled();
  });

  it("rejects duplicate email with conflict and writes nothing", async () => {
    // nik check empty, email check existing
    dbMock.selectResults = [[], [{ id: "existing-email" }]];

    await expect(registerCitizen(baseCommand)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(dbMock.transactionCalls).toBe(0);
    expect(dbMock.insertCalls).toEqual([]);
  });

  it("propagates cloudinary upload failure without creating records", async () => {
    vi.mocked(uploadToCloudinary).mockRejectedValue(new Error("CDN unavailable"));

    await expect(registerCitizen(baseCommand)).rejects.toThrow("CDN unavailable");
    expect(dbMock.transactionCalls).toBe(0);
  });
});
