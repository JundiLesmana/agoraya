import type {
  AccessRequest,
  ResourceContext,
  SubjectIdentifier,
} from "../types";

export interface SessionValidationResult {
  readonly valid: boolean;
  readonly userId?: string;
  readonly tenantId?: string;
}

export type SessionValidator = (
  token: string,
) => Promise<SessionValidationResult>;

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
