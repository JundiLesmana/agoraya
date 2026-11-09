import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";

import { requireAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/foundation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { citizenProfiles } from "@/modules/citizen/db";
import { kycRoster } from "@/modules/kyc/db";

export const dynamic = "force-dynamic";

const statusLabels = {
  pending: "Menunggu pemeriksaan",
  partially_approved: "Menunggu persetujuan kedua",
  verified: "Terverifikasi",
  rejected: "Ditolak",
  expired: "Kedaluwarsa",
} as const;

export default async function KycCitizenListPage() {
  const session = await requireAuth({ roles: ["admin", "superadmin"] });
  const applications = await db()
    .select({
      id: kycRoster.id,
      name: kycRoster.name,
      email: users.email,
      status: kycRoster.status,
      submittedAt: kycRoster.createdAt,
    })
    .from(kycRoster)
    .innerJoin(users, eq(users.id, kycRoster.userId))
    .innerJoin(
      citizenProfiles,
      and(
        eq(citizenProfiles.userId, users.id),
        eq(citizenProfiles.tenantId, users.tenantId),
      ),
    )
    .where(eq(kycRoster.tenantId, session.tenantId))
    .orderBy(desc(kycRoster.createdAt));

  return (
    <main className="container mx-auto space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Verifikasi akun warga (KYC)
        </h1>
        <p className="text-muted-foreground">
          Daftar pengajuan akun warga pada antrean tenant reviewer Anda.
        </p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Belum ada pengajuan verifikasi akun warga.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <CardTitle className="text-base">{application.name}</CardTitle>
                <CardDescription className="text-xs break-all">
                  {application.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
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
                  <Link href={`/admin/kyc/citizen/${application.id}`}>
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