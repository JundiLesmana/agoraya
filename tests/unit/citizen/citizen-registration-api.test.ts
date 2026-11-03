import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registerCitizenMock = vi.hoisted(() => ({
  result: {
    tenantId: "tenant-1",
    userId: "user-1",
    profileId: "profile-1",
    nik: "3273010101010001",
    email: "budi@example.id",
    ktpAttachmentUrl: "https://example.com/ktp.jpg",
    selfieAttachmentUrl: "https://example.com/selfie.png",
    status: "pending",
  },
  error: null as unknown,
}));

vi.mock("@/modules/citizen/service", () => ({
  registerCitizen: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { POST } from "@/app/api/citizen/register/route";
import { registerCitizen } from "@/modules/citizen/service";
import { ConflictError } from "@/lib/errors";

function requestWith(body: unknown): Request {
  return new Request("http://localhost/api/citizen/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/citizen/register", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
    registerCitizenMock.result = {
      tenantId: "tenant-1",
      userId: "user-1",
      profileId: "profile-1",
      nik: "3273010101010001",
      email: "budi@example.id",
      ktpAttachmentUrl: "https://example.com/ktp.jpg",
      selfieAttachmentUrl: "https://example.com/selfie.png",
      status: "pending",
    };
    registerCitizenMock.error = null;
    vi.mocked(registerCitizen).mockImplementation(
      (async () => {
        if (registerCitizenMock.error) throw registerCitizenMock.error;
        return registerCitizenMock.result;
      }) as any,
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("registers a citizen and returns 200", async () => {
    const response = await POST(
      requestWith({
        nik: "3273010101010001",
        name: "Budi Santoso",
        email: "budi@example.id",
        phone: "081234567890",
        password: "rahasia123",
        attachment: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD",
        attachmentFileName: "ktp.jpg",
        attachmentMimeType: "image/jpeg",
        selfie: "data:image/png;base64,iVBORw0KGgo=",
        selfieFileName: "selfie.png",
        selfieMimeType: "image/png",
      }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.data.nik).toBe("3273010101010001");
    expect(json.data.email).toBe("budi@example.id");
    expect(json.data.status).toBe("pending");
    expect(vi.mocked(registerCitizen).mock.calls[0][0].email).toBe(
      "budi@example.id",
    );
  });

  it("returns 400 for invalid body", async () => {
    const response = await POST(requestWith({ nik: "short" }));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBeDefined();
    expect(vi.mocked(registerCitizen)).not.toHaveBeenCalled();
  });

  it("returns 400 for empty body", async () => {
    const response = await POST(requestWith({}));
    expect(response.status).toBe(400);
  });

  it("requires a selfie image and rejects unsupported image types", async () => {
    const body = baseBody();
    const missingSelfie = { ...body };
    delete (missingSelfie as Partial<typeof body>).selfie;
    delete (missingSelfie as Partial<typeof body>).selfieFileName;
    delete (missingSelfie as Partial<typeof body>).selfieMimeType;
    expect((await POST(requestWith(missingSelfie))).status).toBe(400);

    const unsupported = {
      ...body,
      selfie: "data:image/gif;base64,R0lGODlh",
      selfieMimeType: "image/gif",
    };
    expect((await POST(requestWith(unsupported))).status).toBe(400);
    expect(vi.mocked(registerCitizen)).not.toHaveBeenCalled();
  });

  it("rejects images larger than 5 MB", async () => {
    const encodedOverLimit = "A".repeat(
      Math.ceil((5 * 1024 * 1024 + 1) / 3) * 4,
    );
    const response = await POST(
      requestWith({
        ...baseBody(),
        selfie: `data:image/png;base64,${encodedOverLimit}`,
      }),
    );

    expect(response.status).toBe(400);
    expect(vi.mocked(registerCitizen)).not.toHaveBeenCalled();
  });

  it("returns 409 when NIK is already registered", async () => {
    registerCitizenMock.error = new ConflictError("NIK telah terdaftar.", {
      statusCode: 409,
      context: { field: "nik" },
    });

    const response = await POST(requestWith(baseBody()));
    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.code).toBe("CONFLICT");
  });

  it("returns 500 for unexpected error", async () => {
    registerCitizenMock.error = new Error("Unexpected boom");

    const response = await POST(requestWith(baseBody()));
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Terjadi kesalahan saat mendaftar. Silakan coba kembali nanti.");
  });

  it("does not leak stack in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    registerCitizenMock.error = new ConflictError("NIK telah terdaftar.", {
      statusCode: 409,
      context: { field: "nik" },
    });

    const response = await POST(requestWith(baseBody()));
    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.stack).toBeUndefined();
  });
});

function baseBody() {
  return {
    nik: "3273010101010001",
    name: "Budi Santoso",
    email: "budi@example.id",
    phone: "081234567890",
    password: "rahasia123",
    attachment: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD",
    attachmentFileName: "ktp.jpg",
    attachmentMimeType: "image/jpeg",
    selfie: "data:image/png;base64,iVBORw0KGgo=",
    selfieFileName: "selfie.png",
    selfieMimeType: "image/png",
  };
}
