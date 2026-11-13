const PATH_SEGMENT_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export function tenantCloudinaryFolder(
  tenantId: string,
  module: string,
  ...segments: readonly string[]
): string {
  const pathSegments = ["agoraya", "tenants", tenantId, module, ...segments];
  if (pathSegments.some((segment) => !PATH_SEGMENT_PATTERN.test(segment))) {
    throw new Error("Segmen folder Cloudinary tidak valid.");
  }
  return pathSegments.join("/");
}