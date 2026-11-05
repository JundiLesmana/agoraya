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
    logger.error("cloudinary.config_missing", {
      hasCloudName: Boolean(cloudName),
      hasApiKey: Boolean(apiKey),
      hasApiSecret: Boolean(apiSecret),
    });
    throw new AppError(
      ErrorCode.ENV_VALIDATION_FAILED,
      "Penyimpanan lampiran belum dikonfigurasi. Hubungi administrator.",
      { statusCode: 500, isOperational: true },
    );
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
            error: error?.message ?? "Unknown Cloudinary error",
            errorName: error?.name,
            httpCode: error?.http_code,
            requestId: error?.request_id,
            cloudName,
          });
          const authError = error?.http_code === 401 || error?.http_code === 403;
          reject(
            new AppError(
              ErrorCode.EXTERNAL_SERVICE_ERROR,
              authError
                ? "Konfigurasi penyimpanan lampiran tidak valid. Hubungi administrator."
                : "Gagal mengunggah lampiran ke CDN.",
              {
                statusCode: 502,
                isOperational: true,
                cause: error,
                context: { cloudinaryHttpCode: error?.http_code },
              },
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
