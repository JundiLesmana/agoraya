import { v2 as cloudinary } from "cloudinary";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";

export interface CloudinaryUploadResult {
  readonly publicId: string;
  readonly secureUrl: string;
  readonly resourceType: string;
  readonly fileName: string;
  readonly mimeType: string | null;
  readonly size: number | null;
}

function cloudinaryFolder(tenantId: string): string {
  return `agoraya/citizen/${tenantId}`;
}

export async function uploadToCloudinary({
  buffer,
  tenantId,
  fileName,
  mimeType,
}: {
  readonly buffer: Buffer;
  readonly tenantId: string;
  readonly fileName: string;
  readonly mimeType?: string | null;
}): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new AppError(ErrorCode.ENV_VALIDATION_FAILED, "Cloudinary is not configured", {
      statusCode: 500,
      isOperational: true,
    });
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: cloudinaryFolder(tenantId),
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          logger.error("cloudinary.upload_failed", {
            error: error instanceof Error ? error.message : String(error),
          });
          reject(
            new AppError(
              ErrorCode.EXTERNAL_SERVICE_ERROR,
              "Gagal mengunggah lampiran ke CDN.",
              { statusCode: 502, isOperational: false, cause: error },
            ),
          );
          return;
        }
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          resourceType: result.resource_type,
          fileName,
          mimeType: mimeType ?? null,
          size: result.bytes ?? null,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

export function cloudinaryUrl(publicId: string): string {
  return cloudinary.url(publicId, { secure: true });
}
