import { and, asc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { asnProfiles, serviceApplications, users } from "@/lib/db/schema";
import { toSubmissionQueueItem } from "../dashboard/_components/agency-dashboard-data";
import { SubmissionQueue } from "../dashboard/_components/submission-queue";

export const dynamic = "force-dynamic";

export default async function AsnSubmissionQueuePage() {
  const session = await requireAuth({
    roles: ["asn", "staff", "admin", "superadmin"],
  });

  const [applications, staff] = await Promise.all([
    db()
      .select({
        id: serviceApplications.id,
        trackingNumber: serviceApplications.trackingNumber,
        category: serviceApplications.category,
        serviceType: serviceApplications.serviceType,
        serviceId: serviceApplications.serviceId,
        routeKey: serviceApplications.routeKey,
        serviceName: serviceApplications.serviceName,
        agency: serviceApplications.agency,
        status: serviceApplications.status,
        applicantName: serviceApplications.applicantName,
        contactEmail: serviceApplications.contactEmail,
        payload: serviceApplications.payload,
        submittedAt: serviceApplications.submittedAt,
        assigneeId: serviceApplications.assigneeId,
      })
      .from(serviceApplications)
      .where(eq(serviceApplications.tenantId, session.tenantId))
      .orderBy(asc(serviceApplications.submittedAt)),
    db()
      .select({
        id: users.id,
        name: users.name,
        opdName: asnProfiles.opdName,
        unitName: asnProfiles.unitName,
      })
      .from(asnProfiles)
      .innerJoin(users, eq(asnProfiles.userId, users.id))
      .where(
        and(
          eq(asnProfiles.tenantId, session.tenantId),
          eq(users.status, "active"),
        ),
      )
      .orderBy(asc(users.name)),
  ]);

  const now = new Date();
  const initialItems = applications.map((application) =>
    toSubmissionQueueItem({
      ...application,
      submittedAt: application.submittedAt.toISOString(),
      waitingTimeMinutes: Math.max(
        0,
        Math.floor(
          (now.getTime() - application.submittedAt.getTime()) / (1000 * 60),
        ),
      ),
    }),
  );

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <header className="space-y-3">
        <div>
          <p className="text-primary text-xs font-medium tracking-wide uppercase">
            Layanan publik
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Antrean Pengajuan
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pantau pengajuan layanan publik tertua lebih dulu, lalu ambil atau
            asignasikan petugas tanpa meninggalkan halaman antrean.
          </p>
        </div>
      </header>

      <SubmissionQueue initialItems={initialItems} staff={staff} />
    </main>
  );
}