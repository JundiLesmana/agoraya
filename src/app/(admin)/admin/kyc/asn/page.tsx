import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { kycRoster } from "@/modules/kyc/db";
import {
  asnProfiles,
  asnRegistrationDetails,
  jobPositions,
  users,
} from "@/modules/identity/db";

export const dynamic = "force-dynamic";

const statusLabels = {
  pending: "Menunggu pemeriksaan",
  partially_approved: "Menunggu persetujuan kedua",
  verified: "Terverifikasi",
  rejected: "Ditolak",
  expired: "Kedaluwarsa",
} as const;

export default async function KycAsnListPage() {
  const session = await requireAuth({
    roles: ["admin", "superadmin", "kyc_verifikator"],
  });
  const applications = await db()
    .select({
      id: kycRoster.id,
      name: kycRoster.name,
      email: users.email,
      nip: asnProfiles.nip,
      employeeNumber: asnRegistrationDetails.employeeNumber,
      employmentStatus: asnRegistrationDetails.employmentStatus,
      agency: asnProfiles.opdName,
      position: jobPositions.name,
      status: kycRoster.status,
      submittedAt: kycRoster.createdAt,
    })
    .from(kycRoster)
    .innerJoin(users, eq(users.id, kycRoster.userId))
    .innerJoin(
      asnProfiles,
      and(
        eq(asnProfiles.userId, users.id),
        eq(asnProfiles.tenantId, users.tenantId),
      ),
    )
    .leftJoin(
      asnRegistrationDetails,
      and(
        eq(asnRegistrationDetails.userId, users.id),
        eq(asnRegistrationDetails.tenantId, users.tenantId),
      ),
    )
    .leftJoin(jobPositions, eq(jobPositions.id, asnProfiles.positionId))
    .where(eq(kycRoster.tenantId, session.tenantId))
    .orderBy(desc(kycRoster.createdAt));

  return (
    <main className="container mx-auto space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review KYC ASN</h1>
        <p className="text-muted-foreground">
          Pengajuan ASN yang berada dalam antrean tenant Anda.
        </p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada pengajuan KYC ASN.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <CardTitle className="text-base">{application.name}</CardTitle>
                <CardDescription className="break-all text-xs">
                  {application.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{application.agency ?? "-"}</p>
                  <p className="text-muted-foreground">
                    {application.position ?? "-"}
                    {application.employeeNumber || application.nip
                      ? ` · ${application.employmentStatus === "PPPK" ? "No. PPPK" : "NIP"} ${application.employeeNumber ?? application.nip}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      application.status === "verified"
                        ? "default"
                        : application.status === "rejected"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {statusLabels[application.status]}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Diajukan</span>
                  <span className="font-medium">
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                    }).format(application.submittedAt)}
                  </span>
                </div>
                <Button asChild className="w-full" size="sm">
                  <Link href={`/admin/kyc/asn/${application.id}`}>
                    Lihat detail
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}