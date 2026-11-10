export function getPostLoginRoute(roles: readonly string[]): string {
  if (roles.includes("executive") || roles.includes("pimpinan")) {
    return "/executive/dashboard";
  }
  if (
    roles.some((role) =>
      ["asn", "staff", "superadmin"].includes(role),
    )
  ) {
    return "/asn/dashboard";
  }
  return "/reporting";
}
