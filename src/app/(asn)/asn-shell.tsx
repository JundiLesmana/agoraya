"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  Database,
  FolderKanban,
  Landmark,
  LayoutDashboard,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const PRIMARY_PAGES = [
  { href: "/asn/data", label: "Dataset & Metadata", icon: Database },
  { href: "/apbd", label: "Anggaran APBD", icon: Landmark },
  { href: "/asn/project", label: "Proyek Pembangunan", icon: FolderKanban },
  { href: "/asn/statistik", label: "Statistik Daerah", icon: BarChart3 },
] as const;

const OPERATIONS_PAGES = [
  { href: "/asn/dashboard", label: "Dashboard Laporan", icon: LayoutDashboard },
  { href: "/asn/queue", label: "Antrean Pengajuan", icon: ClipboardList },
  { href: "/asn/submission", label: "Penanganan Pengajuan", icon: ClipboardList },
  { href: "/asn/kyc-citizen", label: "Verifikasi Warga", icon: UsersRound },
] as const;

function PageLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Database;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
        active
          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function AsnShell({
  children,
  roleLabel,
}: {
  children: React.ReactNode;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    if (typeof window !== "undefined") {
      try {
        window.localStorage.clear();
        window.sessionStorage.clear();
      } catch {
        // ignore
      }
    }
    router.refresh();
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-48 flex-col border-r bg-white dark:bg-slate-900 lg:flex">
        <Link
          href="/asn/dashboard"
          className="flex h-[4.25rem] items-center gap-2 border-b px-4"
          aria-label="Agoraya — Ruang ASN"
        >
          <Image
            src="/logo/brand.svg"
            alt=""
            width={28}
            height={28}
            priority
          />
          <span>
            <span className="block text-sm font-bold tracking-tight">Agoraya</span>
            <span className="text-muted-foreground block text-[9px] uppercase tracking-wide">
              Ruang ASN
            </span>
          </span>
        </Link>

        <div className="m-2.5 rounded-md border bg-blue-50/70 p-2.5 dark:bg-blue-950/30">
          <p className="text-muted-foreground text-[9px] font-semibold tracking-wide">
            INSTANSI PENGELOLA
          </p>
          <p className="mt-1 text-[11px] leading-4 font-medium">
            Data pemerintahan terbuka
          </p>
        </div>

        <nav aria-label="Navigasi ruang ASN" className="space-y-1 px-2.5">
          {PRIMARY_PAGES.map((page) => (
            <PageLink
              key={page.href}
              {...page}
              active={
                pathname === page.href || pathname.startsWith(`${page.href}/`)
              }
            />
          ))}
        </nav>

        <section className="m-2.5 mt-4 rounded-md border p-2.5">
          <h2 className="flex items-center gap-1.5 text-[10px] font-semibold">
            <ShieldCheck aria-hidden="true" className="size-3.5 text-blue-700" />
            Akses Khusus Ruang ASN
          </h2>
          <p className="text-muted-foreground mt-1 text-[10px] leading-4">
            Data dan tindakan dibatasi berdasarkan instansi serta penugasan.
          </p>
          <div className="mt-2 space-y-0.5">
            {OPERATIONS_PAGES.map((page) => (
              <PageLink
                key={page.href}
                {...page}
                active={
                  pathname === page.href || pathname.startsWith(`${page.href}/`)
                }
              />
            ))}
          </div>
        </section>

        <div className="mt-auto border-t p-3">
          <p className="truncate text-[10px] font-semibold">{roleLabel}</p>
          <p className="text-muted-foreground mt-0.5 text-[9px]">
            Akses operasional terautentikasi
          </p>
        </div>
      </aside>

      <div className="lg:pl-48">
        <header className="flex min-h-[3.5rem] items-center justify-between border-b bg-white px-4 dark:bg-slate-900 sm:px-6">
          <p className="text-muted-foreground min-w-0 truncate text-[11px]">
            Pengelolaan data terbuka / <span className="text-foreground">Ruang ASN</span>
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Button onClick={handleLogout} size="sm">
              Keluar
            </Button>
          </div>
        </header>
        <nav
          aria-label="Navigasi ruang ASN seluler"
          className="flex gap-1 overflow-x-auto border-b bg-white px-3 py-2 dark:bg-slate-900 lg:hidden"
        >
          {PRIMARY_PAGES.map((page) => (
            <PageLink
              key={page.href}
              {...page}
              active={
                pathname === page.href || pathname.startsWith(`${page.href}/`)
              }
            />
          ))}
        </nav>
        <div className="min-w-0 px-3 py-4 sm:px-5 lg:px-6 lg:py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
