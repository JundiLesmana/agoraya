import { beforeEach, describe, expect, it } from "vitest";
import {
  InMemoryReportRepository,
  ReportingService,
} from "@/modules/reporting";
import { ValidationError } from "@/lib/errors";

const tenantId = "00000000-0000-0000-0000-000000000001";
const reporterId = "00000000-0000-0000-0000-000000000010";
const assigneeId = "00000000-0000-0000-0000-000000000020";
let now: Date;
let reporting: ReportingService;
const submit = () =>
  reporting.submit({
    tenantId,
    reporterId,
    category: "road",
    title: "Pothole on Jalan Merdeka",
    description: "A large pothole blocks the lane on Jalan Merdeka.",
  });

beforeEach(() => {
  now = new Date("2026-01-01T00:00:00.000Z");
  reporting = new ReportingService({
    repository: new InMemoryReportRepository(),
    clock: () => now,
    responseSlaMs: 60_000,
  });
});

describe("reporting workflow", () => {
  it("submits a report and starts its SLA", async () => {
    const { report } = await submit();
    expect(report.status).toBe("submitted");
    expect(report.responseDueAt).toEqual(new Date("2026-01-01T00:01:00.000Z"));
  });
  it("merges a sufficiently similar report with the existing report", async () => {
    const first = await submit();
    const second = await reporting.submit({
      tenantId,
      reporterId,
      category: "road",
      title: "Pothole Jalan Merdeka",
      description: "Large pothole blocks lane on Jalan Merdeka.",
    });
    expect(second.duplicateOfId).toBe(first.report.id);
  });
  it("escalates only an SLA breach", async () => {
    const { report } = await submit();
    now = new Date("2026-01-01T00:01:00.000Z");
    const escalated = await reporting.escalateBreached(tenantId);
    expect(escalated.map((item) => item.id)).toEqual([report.id]);
    expect(escalated[0]?.slaEscalatedAt).toEqual(now);
  });
  it("requires QC evidence before resolve and stops SLA when closed", async () => {
    const { report } = await submit();
    await reporting.transition({
      tenantId,
      reportId: report.id,
      actorId: assigneeId,
      to: "verified",
    });
    await reporting.transition({
      tenantId,
      reportId: report.id,
      actorId: assigneeId,
      to: "in_progress",
      assigneeId,
    });
    await expect(
      reporting.transition({
        tenantId,
        reportId: report.id,
        actorId: assigneeId,
        to: "resolved",
      }),
    ).rejects.toThrow(ValidationError);
    await reporting.attachQcEvidence({
      tenantId,
      reportId: report.id,
      actorId: assigneeId,
      storageKey: "private/ticket/proof.jpg",
      mediaType: "image/jpeg",
    });
    await reporting.transition({
      tenantId,
      reportId: report.id,
      actorId: assigneeId,
      to: "resolved",
    });
    const closed = await reporting.transition({
      tenantId,
      reportId: report.id,
      actorId: assigneeId,
      to: "closed",
    });
    expect(closed.closedAt).toEqual(now);
    expect(closed.status).toBe("closed");
  });
  it("tracks one current vote per community member", async () => {
    const { report } = await submit();
    expect(
      await reporting.castVote({
        tenantId,
        reportId: report.id,
        voterId: reporterId,
        value: 1,
      }),
    ).toEqual({ up: 1, down: 0, total: 1 });
    expect(
      await reporting.castVote({
        tenantId,
        reportId: report.id,
        voterId: reporterId,
        value: -1,
      }),
    ).toEqual({ up: 0, down: 1, total: -1 });
  });
  it("rejects invalid lifecycle transitions", async () => {
    const { report } = await submit();
    await expect(
      reporting.transition({
        tenantId,
        reportId: report.id,
        actorId: assigneeId,
        to: "resolved",
      }),
    ).rejects.toThrow(ValidationError);
  });
});
