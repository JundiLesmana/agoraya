import { describe, expect, it } from "vitest";

import { NotFoundError } from "@/lib/errors";
import { getKycReviewDetail } from "@/modules/kyc/review-detail-service";

function createDatabaseMock(options: {
  rosterRows: Array<Record<string, unknown>>;
  approvalRows: Array<Record<string, unknown>>;
  attachmentRows?: Array<Record<string, unknown>>;
}) {
  return {
    select(selection: Record<string, unknown>) {
      const rows = Object.prototype.hasOwnProperty.call(selection, "rosterId")
        ? options.rosterRows
        : Object.prototype.hasOwnProperty.call(selection, "approvalSlot")
          ? options.approvalRows
          : (options.attachmentRows ?? []);

      return {
        from() {
          const joins = {
            innerJoin: () => joins,
            leftJoin: () => joins,
            where: () => ({
              limit: async () => rows,
              orderBy: async () => rows,
            }),
          };
          return {
            ...joins,
            where: async () => rows,
            leftJoin() {
              return {
                where() {
                  return {
                    orderBy: async () => rows,
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("getKycReviewDetail", () => {
  it("returns roster details, approvals, and first review state", async () => {
    const database = createDatabaseMock({
      rosterRows: [
        {
          rosterId: "roster-1",
          tenantId: "tenant-1",
          submittedBy: "maker-1",
          submittedAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:10:00.000Z"),
          status: "pending",
          expiresAt: null,
          userId: "asn-1",
          profileTenantId: "applicant-tenant-1",
          asnProfileUserId: "asn-1",
          name: "Siti Aminah",
          email: "siti@example.com",
          nik: "3175091201010001",
          userStatus: "active",
          nip: "198501012010012001",
          opdName: "Dinas Kominfo",
          unitName: "Bidang Data",
          positionName: "Analis Kebijakan",
          positionType: "functional",
        },
      ],
      approvalRows: [],
    });

    const detail = await getKycReviewDetail("roster-1", "tenant-1", "reviewer-1", {
      database: database as never,
    });

    expect(detail).toEqual({
      rosterId: "roster-1",
      tenantId: "tenant-1",
      submittedBy: "maker-1",
      submittedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:10:00.000Z",
      status: "pending",
      expiresAt: null,
      subject: {
        userId: "asn-1",
        registrationType: "asn",
        name: "Siti Aminah",
        email: "siti@example.com",
        nik: "3175091201010001",
        userStatus: "active",
        nip: "198501012010012001",
        opdName: "Dinas Kominfo",
        unitName: "Bidang Data",
        positionName: "Analis Kebijakan",
        positionType: "functional",
      },
      asnRegistration: null,
      approvals: [],
      canReview: true,
      nextAction: "first_approval",
    });
  });

  it("returns stored ASN registration data and uploaded documents", async () => {
    const database = createDatabaseMock({
      rosterRows: [
        {
          rosterId: "roster-asn",
          tenantId: "reviewer-tenant",
          submittedBy: null,
          submittedAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
          status: "pending",
          expiresAt: null,
          userId: "asn-user",
          profileTenantId: "applicant-tenant",
          asnProfileUserId: "asn-user",
          registrationId: "registration-1",
          birthPlace: "Bandung",
          birthDate: "1990-01-01",
          phone: "081234567890",
          employmentStatus: "PNS",
          employeeNumber: "198501012010011001",
          rankGrade: "Penata/I-C",
          appointmentDate: null,
          agencyType: "Instansi daerah",
          provinceTask: "Jawa Barat",
          regencyTask: "Bandung",
          field: "Data",
          officeAddress: "Jl. Kantor 1",
          officialEmail: null,
          officePhone: null,
          ktpAddress: "Jl. Rumah 1",
          ktpRt: "001",
          ktpRw: "002",
          ktpPostalCode: "12345",
          ktpProvince: "Jawa Barat",
          ktpRegency: "Bandung",
          ktpDistrict: "Coblong",
          ktpVillage: "Dago",
          domicileSameAsKtp: true,
          domicileAddress: "Jl. Rumah 1",
          domicileRt: "001",
          domicileRw: "002",
          domicilePostalCode: "12345",
          domicileProvince: "Jawa Barat",
          domicileRegency: "Bandung",
          domicileDistrict: "Coblong",
          domicileVillage: "Dago",
        },
      ],
      approvalRows: [],
      attachmentRows: [
        {
          type: "ktp",
          fileName: "ktp.png",
          url: "https://example.test/ktp.png",
          mimeType: "image/png",
          size: 1024,
        },
      ],
    });

    const detail = await getKycReviewDetail(
      "roster-asn",
      "reviewer-tenant",
      undefined,
      { database: database as never },
    );

    expect(detail.subject.registrationType).toBe("asn");
    expect(detail.asnRegistration).toMatchObject({
      birthPlace: "Bandung",
      employeeNumber: "198501012010011001",
      ktpAddress: "Jl. Rumah 1",
      domicileSameAsKtp: true,
      attachments: [
        {
          type: "ktp",
          fileName: "ktp.png",
          url: "https://example.test/ktp.png",
        },
      ],
    });
  });

  it("marks entries as second approval after the first reviewer has acted", async () => {
    const database = createDatabaseMock({
      rosterRows: [
        {
          rosterId: "roster-1",
          tenantId: "tenant-1",
          submittedBy: "maker-1",
          submittedAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:10:00.000Z"),
          status: "partially_approved",
          expiresAt: null,
          userId: "asn-1",
          profileTenantId: "applicant-tenant-1",
          asnProfileUserId: null,
          name: "Siti Aminah",
          email: "siti@example.com",
          nik: null,
          userStatus: "active",
          nip: null,
          opdName: null,
          unitName: null,
          positionName: null,
          positionType: null,
        },
      ],
      approvalRows: [
        {
          id: "approval-1",
          approvalSlot: 1,
          decision: "approved",
          reason: "Dokumen sesuai",
          approverId: "reviewer-1",
          approverName: "Reviewer Satu",
          createdAt: new Date("2026-01-01T00:05:00.000Z"),
        },
      ],
    });

    const detail = await getKycReviewDetail("roster-1", "tenant-1", "reviewer-1", {
      database: database as never,
    });

    expect(detail.approvals).toEqual([
      {
        id: "approval-1",
        approvalSlot: 1,
        decision: "approved",
        reason: "Dokumen sesuai",
        approverId: "reviewer-1",
        approverName: "Reviewer Satu",
        createdAt: "2026-01-01T00:05:00.000Z",
      },
    ]);
    expect(detail.canReview).toBe(false);
    expect(detail.nextAction).toBe("second_approval");
  });

  it("marks verified, rejected, and expired entries as completed", async () => {
    for (const status of ["verified", "rejected", "expired"] as const) {
      const database = createDatabaseMock({
        rosterRows: [
          {
            rosterId: `roster-${status}`,
            tenantId: "tenant-1",
            submittedBy: null,
            submittedAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedAt: new Date("2026-01-01T00:10:00.000Z"),
            status,
            expiresAt: status === "expired" ? new Date("2026-06-01T00:00:00.000Z") : null,
            userId: "asn-1",
            profileTenantId: "applicant-tenant-1",
            asnProfileUserId: null,
            name: "Siti Aminah",
            email: "siti@example.com",
            nik: null,
            userStatus: "active",
            nip: null,
            opdName: null,
            unitName: null,
            positionName: null,
            positionType: null,
          },
        ],
        approvalRows: [
          {
            id: "approval-1",
            approvalSlot: 1,
            decision: status === "rejected" ? "rejected" : "approved",
            reason: null,
            approverId: "reviewer-2",
            approverName: "Reviewer Dua",
            createdAt: new Date("2026-01-01T00:05:00.000Z"),
          },
        ],
      });

      const detail = await getKycReviewDetail(`roster-${status}`, "tenant-1", "reviewer-3", {
        database: database as never,
      });

      expect(detail.canReview).toBe(false);
      expect(detail.nextAction).toBe("completed");
      expect(detail.status).toBe(status);
    }
  });

  it("throws when the roster entry does not exist in the tenant", async () => {
    const database = createDatabaseMock({
      rosterRows: [],
      approvalRows: [],
    });

    await expect(
      getKycReviewDetail("missing-roster", "tenant-1", undefined, {
        database: database as never,
      }),
    ).rejects.toThrowError(
      new NotFoundError('KYC roster entry "missing-roster" not found in tenant "tenant-1"'),
    );
  });
});