import { and, asc, eq, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { serviceApplications } from "@/lib/db/schema";
import { listAssignableReviewStaff } from "@/modules/asn/assignable-review-staff";
import {
  isServiceApplicationCategory,
  listAccessibleServiceCategories,
  SERVICE_APPLICATION_CATEGORIES,
} from "@/modules/service-applications/access";
import { toSubmissionQueueItem } from "../dashboard/_components/agency-dashboard-data";
import { SubmissionQueue } from "../dashboard/_components/submission-queue";

export const dynamic = "force-dynamic";

export default async function AsnSubmissionQueuePage() {
  const session = await requireAuth({
    roles: ["asn", "staff", "admin", "superadmin"],
  });
  const accessibleCategories = await listAccessibleServiceCategories(session);

  const [applications, permitStaff, educationStaff, socialStaff, healthStaff] =
    await Promise.all([
      accessibleCategories.length
        ? db()
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
            .where(
              and(
                eq(serviceApplications.tenantId, session.tenantId),
                inArray(serviceApplications.category, accessibleCategories),
              ),
            )
            .orderBy(asc(serviceApplications.submittedAt))
        : Promise.resolve([]),
      accessibleCategories.includes("permit")
        ? listAssignableReviewStaff(session.tenantId, "permit")
        : Promise.resolve([]),
      accessibleCategories.includes("education")
        ? listAssignableReviewStaff(session.tenantId, "education")
        : Promise.resolve([]),
      accessibleCategories.includes("social")
        ? listAssignableReviewStaff(session.tenantId, "social")
        : Promise.resolve([]),
      accessibleCategories.includes("health")
        ? listAssignableReviewStaff(session.tenantId, "health")
        : Promise.resolve([]),
    ]);

  const staffByCategory = {
    permit: permitStaff,
    education: educationStaff,
    social: socialStaff,
    health: healthStaff,
  };
  const normalizedAccessibleCategories = SERVICE_APPLICATION_CATEGORIES.filter(
    (category) => accessibleCategories.includes(category),
  );

  const now = new Date();
  const initialItems = applications.map((application) => {
    if (!isServiceApplicationCategory(application.category)) {
      throw new Error(
        `Unknown service application category: ${application.category}`,
      );
    }
    return toSubmissionQueueItem({
      ...application,
      category: application.category,
      submittedAt: application.submittedAt.toISOString(),
      waitingTimeMinutes: Math.max(
        0,
        Math.floor(
          (now.getTime() - application.submittedAt.getTime()) / (1000 * 60),
        ),
      ),
    });
  });

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

      <SubmissionQueue
        initialItems={initialItems}
        staffByCategory={staffByCategory}
        accessibleCategories={normalizedAccessibleCategories}
      />
    </main>
  );
}