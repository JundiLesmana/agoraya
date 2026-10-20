export const ROLES = {
  CITIZEN: 'citizen',
  ASN: 'asn',
  STAFF: 'staff',
  EXECUTIVE: 'executive',
  PIMPINAN: 'pimpinan',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function hasRole(userRole: string | undefined, allowedRoles: Role[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole as Role);
}

export function isAdmin(role?: string): boolean {
  return role === ROLES.ADMIN;
}

export function isCitizen(role?: string): boolean {
  return role === ROLES.CITIZEN;
}

export function isAsn(role?: string): boolean {
  return role === ROLES.ASN || role === ROLES.STAFF;
}

export function isExecutive(role?: string): boolean {
  return role === ROLES.EXECUTIVE || role === ROLES.PIMPINAN;
}
