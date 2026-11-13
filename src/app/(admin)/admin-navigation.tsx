"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  FolderKanban,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const PRIMARY_PAGES = [
  { href: "/admin", label: "Ringkasan Admin", icon: LayoutDashboard },
  { href: "/admin/kyc/asn", label: "Verifikasi ASN", icon: ShieldCheck },
] as const;

const ADMIN_PAGES = [
  { href: "/admin/apbd/review", label: "Tinjauan APBD", icon: ClipboardCheck },
  { href: "/admin/apbd/assignments", label: "Penugasan APBD", icon: Wallet },
  {
    href: "/admin/statistics/assignments",
    label: "Penugasan Statistik",
    icon: BarChart3,
  },
  { href: "/admin/projects", label: "Proyek Infrastruktur", icon: FolderKanban },
  { href: "/admin/kyc/citizen", label: "Verifikasi Warga", icon: UserCheck },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/system", label: "Sistem", icon: Settings },
] as const;

function PageLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
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

export function AdminShell({
  children,
  isAdministrator,
  roleLabel,
}: {
  children: React.ReactNode;
  isAdministrator: boolean;
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

  const mobilePages = [
    ...PRIMARY_PAGES,
    ...(isAdministrator ? ADMIN_PAGES : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-48 flex-col border-r bg-white dark:bg-slate-900 lg:flex">
        <Link
          href="/admin"
          className="flex h-[4.25rem] items-center gap-2 border-b px-4"
          aria-label="Agoraya — Panel Admin"
        >
          <Image
            src="/logo/brand.svg"
            alt=""
            width={28}
            height={28}
            priority
          />
          <span>
            <span className="block text-sm font-bold tracking-tight">
              Agoraya
            </span>
            <span className="text-muted-foreground block text-[9px] uppercase tracking-wide">
              Panel Admin
            </span>
          </span>
        </Link>

        <div className="m-2.5 rounded-md border bg-blue-50/70 p-2.5 dark:bg-blue-950/30">
          <p className="text-muted-foreground text-[9px] font-semibold tracking-wide">
            PUSAT PENGELOLAAN
          </p>
          <p className="mt-1 text-[11px] leading-4 font-medium">
            Akses dan operasional platform
          </p>
        </div>

        <nav aria-label="Navigasi panel admin" className="space-y-1 px-2.5">
          {PRIMARY_PAGES.map((page) => (
            <PageLink
              key={page.href}
              {...page}
              active={
                page.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === page.href ||
                    pathname.startsWith(`${page.href}/`)
              }
            />
          ))}
        </nav>

        {isAdministrator ? (
          <section className="m-2.5 mt-4 rounded-md border p-2.5">
            <h2 className="flex items-center gap-1.5 text-[10px] font-semibold">
              <ShieldCheck
                aria-hidden="true"
                className="size-3.5 text-blue-700"
              />
              Akses Administrator
            </h2>
            <p className="text-muted-foreground mt-1 text-[10px] leading-4">
              Pengelolaan penugasan, verifikasi, pengguna, dan sistem.
            </p>
            <div className="mt-2 space-y-0.5">
              {ADMIN_PAGES.map((page) => (
                <PageLink
                  key={page.href}
                  {...page}
                  active={
                    pathname === page.href ||
                    pathname.startsWith(`${page.href}/`)
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

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
            Pengelolaan /{" "}
            <span className="text-foreground">Panel Admin</span>
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Button onClick={handleLogout} size="sm">
              Keluar
            </Button>
          </div>
        </header>
        <nav
          aria-label="Navigasi panel admin seluler"
          className="flex gap-1 overflow-x-auto border-b bg-white px-3 py-2 dark:bg-slate-900 lg:hidden"
        >
          {mobilePages.map((page) => (
            <PageLink
              key={page.href}
              {...page}
              active={
                page.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === page.href ||
                    pathname.startsWith(`${page.href}/`)
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