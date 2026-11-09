import Image from "next/image";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/guards";
import { ThemeToggle } from "@/components/theme-toggle";

const ASN_PAGES = [
  { href: "/asn/dashboard", label: "Dashboard Laporan" },
  { href: "/asn/management", label: "Management" },
  { href: "/admin", label: "Admin Panel" },
  { href: "/asn/statistik", label: "Statistik" },
  { href: "/asn/data", label: "Data" },
  { href: "/asn/project", label: "Proyek" },
  { href: "/data-management", label: "Pengelolaan APBD" },
] as const;

export default async function AsnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth({ roles: ["asn", "staff", "admin", "superadmin"] });
  return (
    <div className="min-h-screen">
      <header className="bg-background border-b">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 lg:gap-4">
            <Link
              href="/asn/dashboard"
              className="flex w-fit items-center gap-2"
              aria-label="Agoraya — Dashboard ASN"
            >
              <Image
                src="/logo/brand.svg"
                alt=""
                width={32}
                height={32}
                priority
              />
              <span className="text-lg font-semibold tracking-tight">
                Agoraya
              </span>
            </Link>
<nav
  aria-label="Navigasi laman ASN"
  className="flex flex-1 flex-wrap items-center gap-x-1 gap-y-2"
>
  {ASN_PAGES.map((page) => (
    <Link
      key={page.href}
      href={page.href}
      className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-3 py-2 text-sm font-medium"
    >
      {page.label}
    </Link>
  ))}
</nav>
<ThemeToggle compact />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
