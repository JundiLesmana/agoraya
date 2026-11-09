import { and, asc, eq, inArray, isNotNull, or } from "drizzle-orm";
import Link from "next/link";
import { ArrowRight, Clock3, FileSearch, UserRound } from "lucide-react";
import { requireAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { serviceApplications, users } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTimeWib } from "@/app/(citizen)/citizen/service/_components/tracking-format";

export const dynamic = "force-dynamic";

function statusLabel(status: string): string {
  switch (status) {
    case "verified":
    case "in_progress":
      return "Sedang Ditangani";
    case "waiting_for_citizen":
      return "Menunggu Warga";
    default:
      return "Menunggu Proses";
  }
}

export default async function AsnSubmissionProcessingListPage() {
  const session = await requireAuth({
    roles: ["asn", "staff", "admin", "superadmin"],
  });

  const applications = await db()
    .select({
      id: serviceApplications.id,
      trackingNumber: serviceApplications.trackingNumber,
      serviceName: serviceApplications.serviceName,
      applicantName: serviceApplications.applicantName,
      status: serviceApplications.status,
      submittedAt: serviceApplications.submittedAt,
      assigneeName: users.name,
    })
    .from(serviceApplications)
    .leftJoin(users, eq(serviceApplications.assigneeId, users.id))
    .where(
      and(
        eq(serviceApplications.tenantId, session.tenantId),
        inArray(serviceApplications.status, [
          "submitted",
          "verified",
          "in_progress",
          "waiting_for_citizen",
        ]),
        or(
          isNotNull(serviceApplications.assigneeId),
          inArray(serviceApplications.status, [
            "verified",
            "in_progress",
            "waiting_for_citizen",
          ]),
        ),
      ),
    )
    .orderBy(asc(serviceApplications.submittedAt));

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <header className="space-y-2">
        <p className="text-primary text-xs font-medium tracking-wide uppercase">
          Layanan publik
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Penanganan Pengajuan
        </h1>
        <p className="text-muted-foreground text-sm">
          Pilih pengajuan untuk melanjutkan verifikasi dokumen, memperbarui
          progres, atau menerbitkan hasil layanan.
        </p>
      </header>

      <section aria-label="Daftar pengajuan yang ditangani">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Pengajuan aktif</h2>
          <Badge variant="outline">{applications.length} pengajuan</Badge>
        </div>

        {applications.length === 0 ? (
          <Card className="items-center gap-3 border-dashed px-6 py-12 text-center shadow-none">
            <FileSearch className="text-muted-foreground size-8" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium">Belum ada pengajuan yang ditangani</p>
              <p className="text-muted-foreground text-sm">
                Ambil pengajuan dari antrean untuk memulai penanganan.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/asn/management">Buka antrean pengajuan</Link>
            </Button>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nomor Pengajuan</th>
                    <th className="px-4 py-3 font-medium">Layanan</th>
                    <th className="px-4 py-3 font-medium">Pemohon</th>
                    <th className="px-4 py-3 font-medium">Petugas</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Waktu Masuk</th>
                    <th className="px-4 py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id} className="border-t">
                      <td className="px-4 py-4 font-medium">
                        {application.trackingNumber}
                      </td>
                      <td className="px-4 py-4">{application.serviceName}</td>
                      <td className="px-4 py-4">{application.applicantName}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-2">
                          <UserRound
                            className="text-muted-foreground size-4"
                            aria-hidden="true"
                          />
                          {application.assigneeName ?? "Belum ditugaskan"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline">
                          {statusLabel(application.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <Clock3
                            className="text-muted-foreground size-4"
                            aria-hidden="true"
                          />
                          {formatDateTimeWib(application.submittedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Button asChild size="sm">
                          <Link href={`/asn/management/${application.id}`}>
                            Lanjutkan
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}