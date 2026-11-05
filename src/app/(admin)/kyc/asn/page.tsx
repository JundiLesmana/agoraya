import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const applications = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Budi Santoso (ASN)", status: "pending", submittedAt: "2026-11-01" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Siti Aminah (ASN)", status: "partially_approved", submittedAt: "2026-11-02" },
];

export default async function KycAsnListPage() {
  await requireAuth({ roles: ["superadmin", "kyc_verifikator"] });

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review KYC ASN</h1>
        <p className="text-muted-foreground">
          Daftar pengajuan KYC ASN yang perlu diverifikasi.
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
                <Link href={`/kyc/asn/${app.id}`}>Lihat detail</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
