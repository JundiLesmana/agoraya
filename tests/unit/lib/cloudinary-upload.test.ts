import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cloudinaryMock = vi.hoisted(() => ({
  config: vi.fn(),
  uploadStream: vi.fn(),
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: cloudinaryMock.config,
    uploader: { upload_stream: cloudinaryMock.uploadStream },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { logger } from "@/lib/logger";

describe("uploadToCloudinary", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "test-cloud");
    vi.stubEnv("CLOUDINARY_API_KEY", "test-key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "test-secret");
    cloudinaryMock.uploadStream.mockImplementation(
      (_options, callback: (error: unknown, result?: unknown) => void) => ({
        end: vi.fn(() =>
          callback({
            message: "Invalid API Key",
            name: "Error",
            http_code: 401,
            request_id: "request-123",
          }),
        ),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("logs structured Cloudinary error details and rejects the upload", async () => {
    await expect(
      uploadToCloudinary({
        buffer: Buffer.from("image"),
        tenantId: "tenant-1",
        fileName: "ktp.jpg",
        mimeType: "image/jpeg",
      }),
    ).rejects.toMatchObject({ statusCode: 502 });

    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      "cloudinary.upload_failed",
      {
        error: "Invalid API Key",
        errorName: "Error",
        httpCode: 401,
        requestId: "request-123",
      },
    );
  });
});
