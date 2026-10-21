// Agoraya — modules/rbac pdp identity bridge
// Connects an authenticated identity session to an access request.
//
// The bridge is a port: the caller injects the session validator, so the RBAC
// module stays independent from the identity module (and testable without a
// database). In the application the validator is `validateSession` from
// `src/modules/identity/session`.

import type {
  AccessRequest,
  ResourceContext,
  SubjectIdentifier,
} from "../types";

/** Result of a session validation, as provided by the identity module. */
export interface SessionValidationResult {
  readonly valid: boolean;
  readonly userId?: string;
  readonly tenantId?: string;
}

/** Port for the identity module's session validation. */
export type SessionValidator = (
  token: string,
) => Promise<SessionValidationResult>;

/**
 * Resolve the subject of an access request from a session token.
 *
 * Returns `null` when the session is missing, expired, or does not carry the
 * user and tenant that authorization needs.
 */
export async function subjectFromSession(
  token: string,
  validate: SessionValidator,
): Promise<SubjectIdentifier | null> {
  if (!token) return null;

  const session = await validate(token);
  if (!session.valid || !session.userId || !session.tenantId) {
    return null;
  }

  return { userId: session.userId, tenantId: session.tenantId };
}

/** Build an access request for a resolved subject. */
export function buildAccessRequest(
  subject: SubjectIdentifier,
  resource: ResourceContext,
  action: string,
  requestId?: string,
): AccessRequest {
  return {
    subject,
    resource,
    action,
    ...(requestId === undefined ? {} : { requestId }),
  };
}
