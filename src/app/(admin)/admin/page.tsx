import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/guards";

const REVIEW_LINKS = [
  {
    href: "/admin/kyc/asn",
    title: "Verifikasi ASN",
    description: "Tinjau dan kelola pengajuan KYC aparatur sipil negara.",
  },
] as const;

const ADMIN_LINKS = [
  {
    href: "/admin/apbd/review",
    title: "Tinjauan APBD",
    description: "Tinjau dan kelola pengajuan data APBD.",
  },
  {
    href: "/admin/apbd/assignments",
    title: "Penugasan APBD",
    description: "Atur cakupan instansi, wilayah, dan urusan operator APBD.",
  },
  {
    href: "/admin/statistics/assignments",
    title: "Penugasan Statistik",
    description:
      "Atur cakupan instansi, wilayah, dan sektor operator statistik agar ruang input tersedia.",
  },
  {
    href: "/admin/projects",
    title: "Proyek Infrastruktur",
    description:
      "Buat dan kelola proyek serta tetapkan penanggung jawab agar operator dapat menginput progres.",
  },
  {
    href: "/admin/kyc/citizen",
    title: "Verifikasi Warga",
    description: "Tinjau dan kelola pengajuan verifikasi akun warga.",
  },
  {
    href: "/admin/users",
    title: "Pengguna",
    description: "Kelola akun dan akses pengguna platform.",
  },
  {
    href: "/admin/system",
    title: "Sistem",
    description: "Akses pengaturan dan informasi sistem.",
  },
] as const;

export default async function AdminPage() {
  const session = await requireAuth({
    roles: ["admin", "superadmin", "kyc_verifikator"],
  });
  const isAdministrator = session.roles.some((role) =>
    ["admin", "superadmin"].includes(role),
  );
  const pages = [
    ...REVIEW_LINKS,
    ...(isAdministrator ? ADMIN_LINKS : []),
  ];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-primary text-sm font-semibold">Pusat pengelolaan</p>
        <h1 className="text-3xl font-bold tracking-tight">Panel Admin</h1>
        <p className="text-muted-foreground max-w-2xl">
          Pilih laman yang ingin Anda kelola. Akses ditampilkan sesuai peran
          akun Anda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pages.map((page) => (
          <Link key={page.href} href={page.href} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardHeader>
                <CardTitle className="text-lg">{page.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {page.description}
                </p>
                <span className="text-primary mt-5 inline-block text-sm font-medium">
                  Buka laman <span aria-hidden="true">→</span>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}