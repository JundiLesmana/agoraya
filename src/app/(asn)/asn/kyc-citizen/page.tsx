import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const applications = [
  { id: "kyc-app-1001", name: "Budi Santoso", status: "pending", submittedAt: "2026-11-01" },
  { id: "kyc-app-1002", name: "Siti Aminah", status: "pending", submittedAt: "2026-11-02" },
  { id: "kyc-app-1003", name: "Andi Wijaya", status: "verified", submittedAt: "2026-10-30" },
];

export default async function KycCitizenListPage() {
  await requireAuth({ roles: ["admin"] });

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verifikasi akun warga (KYC)</h1>
        <p className="text-muted-foreground">
          Daftar pengajuan akun warga yang perlu diverifikasi.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {applications.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <CardTitle className="text-base">{app.name}</CardTitle>
              <CardDescription className="text-xs">{app.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={app.status === "verified" ? "default" : "outline"}>
                  {app.status === "verified" ? "Terverifikasi" : "Menunggu"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Diajukan</span>
                <span className="font-medium">{app.submittedAt}</span>
              </div>
              <Button asChild className="w-full" size="sm">
                <Link href={`/asn/kyc-citizen/${app.id}`}>Lihat detail</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
