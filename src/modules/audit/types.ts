export type AuditExportFormat = 'json' | 'csv';

export interface AuditEntryInput {
  readonly action: string;
  readonly actorId: string | null;
  readonly targetTable: string;
  readonly targetId: string | null;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly occurredAt: Date;
}

export interface AuditEntry extends AuditEntryInput {
  readonly id: string;
  readonly sequence: number;
  readonly hash: string;
  readonly previousHash: string | null;
  readonly signature: string;
}

export interface AuditVerificationResult {
  readonly valid: boolean;
  readonly tampered: boolean;
  readonly entriesChecked: number;
  readonly reason?: string;
}

export interface AuditAnchorExport {
  readonly format: AuditExportFormat;
  readonly exportedAt: string;
  readonly hashAlgorithm: string;
  readonly signatureAlgorithm: string;
  readonly entries: readonly AuditEntry[];
}

