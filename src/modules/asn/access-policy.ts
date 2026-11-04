export function isAsnAccessAdmin(roles: readonly string[]): boolean {
  return roles.includes("superadmin");
}
