import type { GateCheckInput } from "./types";

export function checkGate(input: GateCheckInput): boolean {
  const { gate, subject } = input;
  const hasRole = gate.requiredRoles.length === 0 || gate.requiredRoles.some((role) => subject.roles.includes(role));
  const hasPermission = gate.requiredPermissions.length === 0 || gate.requiredPermissions.some((permission) => subject.permissions.includes(permission));
  return gate.decision === "approve" ? hasRole && hasPermission : !(hasRole && hasPermission);
}

