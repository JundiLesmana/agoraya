import { randomUUID } from "node:crypto";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import { findDuplicate } from "./dedup";
import { hasQcEvidence } from "./qc-evidence";
import {
  attachQcEvidenceSchema,
  castVoteSchema,
  submitReportSchema,
  transitionReportSchema,
} from "./schema";
import { DEFAULT_RESPONSE_SLA_MS, isSlaBreached, responseDueAt } from "./sla";
import {
  assertReportTransition,
  InvalidReportTransitionError,
} from "./state-machine";
import type { Report, VoteCount } from "./types";
import { countVotes } from "./voting";
import type { ReportRepository } from "./repository";

export interface ReportingAuthorizer {
  authorize(input: {
    actorId: string;
    tenantId: string;
    action: "transition" | "attach_evidence" | "vote";
    report: Report;
  }): Promise<boolean>;
}
export interface ReportingServiceOptions {
  readonly repository: ReportRepository;
  readonly authorizer?: ReportingAuthorizer;
  readonly clock?: () => Date;
  readonly responseSlaMs?: number;
}

export class ReportingService {
  readonly #repository: ReportRepository;
  readonly #authorizer: ReportingAuthorizer | undefined;
  readonly #clock: () => Date;
  readonly #responseSlaMs: number;
  constructor(options: ReportingServiceOptions) {
    this.#repository = options.repository;
    this.#authorizer = options.authorizer;
    this.#clock = options.clock ?? (() => new Date());
    this.#responseSlaMs = options.responseSlaMs ?? DEFAULT_RESPONSE_SLA_MS;
  }

  async submit(
    command: unknown,
  ): Promise<{ report: Report; duplicateOfId: string | null }> {
    const input = this.#parse(
      submitReportSchema,
      command,
      "Invalid report submission",
    );
    const now = this.#clock();
    const candidates = await this.#repository.listCandidates(
      input.tenantId,
      input.category,
      100,
    );
    const duplicate = findDuplicate(
      { ...input, location: input.location ?? null },
      candidates,
    );
    const report = await this.#repository.insert({
      id: randomUUID(),
      tenantId: input.tenantId,
      reporterId: input.reporterId,
      category: input.category,
      title: input.title,
      description: input.description,
      location: input.location ?? null,
      status: "submitted",
      submittedAt: now,
      responseDueAt: responseDueAt(now, this.#responseSlaMs),
      createdAt: now,
      updatedAt: now,
    });
    if (!duplicate) return { report, duplicateOfId: null };
    const merged = await this.#repository.markDuplicate(
      report.id,
      report.tenantId,
      duplicate.reportId,
      now,
    );
    if (!merged)
      throw new ConflictError("Report could not be merged with its duplicate");
    return { report: merged, duplicateOfId: duplicate.reportId };
  }

  async transition(command: unknown): Promise<Report> {
    const input = this.#parse(
      transitionReportSchema,
      command,
      "Invalid report transition",
    );
    const report = await this.#requireReport(input.reportId, input.tenantId);
    await this.#authorize(input.actorId, input.tenantId, "transition", report);
    try {
      assertReportTransition(report.status, input.to);
    } catch (error) {
      if (error instanceof InvalidReportTransitionError)
        throw new ValidationError(error.message);
      throw error;
    }
    if (input.to === "in_progress" && !input.assigneeId)
      throw new ValidationError("An assignee is required before work starts");
    if (
      input.to === "resolved" &&
      !hasQcEvidence(
        await this.#repository.listEvidence(report.id, report.tenantId),
      )
    )
      throw new ValidationError(
        "QC evidence is required before resolving a report",
      );
    const updated = await this.#repository.transition({
      id: report.id,
      tenantId: report.tenantId,
      from: report.status,
      to: input.to,
      assigneeId: input.assigneeId,
      now: this.#clock(),
    });
    if (!updated)
      throw new ConflictError(
        "Report changed before the transition could be applied",
      );
    return updated;
  }

  async attachQcEvidence(command: unknown) {
    const input = this.#parse(
      attachQcEvidenceSchema,
      command,
      "Invalid QC evidence",
    );
    const report = await this.#requireReport(input.reportId, input.tenantId);
    await this.#authorize(
      input.actorId,
      input.tenantId,
      "attach_evidence",
      report,
    );
    if (report.status !== "in_progress")
      throw new ValidationError(
        "QC evidence may only be attached while a report is in progress",
      );
    return this.#repository.addEvidence({
      id: randomUUID(),
      reportId: report.id,
      tenantId: report.tenantId,
      uploadedBy: input.actorId,
      storageKey: input.storageKey,
      mediaType: input.mediaType,
      note: input.note ?? null,
      createdAt: this.#clock(),
    });
  }

  async castVote(command: unknown): Promise<VoteCount> {
    const input = this.#parse(castVoteSchema, command, "Invalid report vote");
    const report = await this.#requireReport(input.reportId, input.tenantId);
    await this.#authorize(input.voterId, input.tenantId, "vote", report);
    if (report.status === "closed")
      throw new ValidationError("Closed reports cannot receive votes");
    const now = this.#clock();
    await this.#repository.upsertVote({
      reportId: report.id,
      tenantId: report.tenantId,
      voterId: input.voterId,
      value: input.value,
      createdAt: now,
      updatedAt: now,
    });
    return countVotes(
      await this.#repository.listVotes(report.id, report.tenantId),
    );
  }

  async escalateBreached(tenantId: string): Promise<Report[]> {
    const now = this.#clock();
    const candidates = await this.#repository.listBreached(tenantId);
    const escalated: Report[] = [];
    for (const report of candidates) {
      if (!isSlaBreached(report, now)) continue;
      const updated = await this.#repository.markEscalated(
        report.id,
        tenantId,
        now,
      );
      if (updated) escalated.push(updated);
    }
    return escalated;
  }

  async #requireReport(id: string, tenantId: string): Promise<Report> {
    const report = await this.#repository.find(id, tenantId);
    if (!report) throw new NotFoundError("Report not found");
    return report;
  }
  async #authorize(
    actorId: string,
    tenantId: string,
    action: "transition" | "attach_evidence" | "vote",
    report: Report,
  ): Promise<void> {
    if (
      this.#authorizer &&
      !(await this.#authorizer.authorize({ actorId, tenantId, action, report }))
    )
      throw new ForbiddenError("Report action is not permitted");
  }
  #parse<T>(
    schema: {
      safeParse(
        value: unknown,
      ): { success: true; data: T } | { success: false };
    },
    value: unknown,
    message: string,
  ): T {
    const parsed = schema.safeParse(value);
    if (!parsed.success) throw new ValidationError(message);
    return parsed.data;
  }
}
