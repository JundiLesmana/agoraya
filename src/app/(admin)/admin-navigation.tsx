"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const REVIEW_PAGES = [
  { href: "/admin/kyc/asn", label: "Verifikasi ASN" },
] as const;

const ADMIN_PAGES = [
  { href: "/admin/apbd/review", label: "Tinjauan APBD" },
  { href: "/admin/apbd/assignments", label: "Penugasan APBD" },
  { href: "/admin/kyc/citizen", label: "Verifikasi Warga" },
  { href: "/admin/users", label: "Pengguna" },
  { href: "/admin/system", label: "Sistem" },
] as const;

export function AdminNavigation({
  isAdministrator,
}: {
  isAdministrator: boolean;
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

  const pages = [
    { href: "/admin", label: "Ringkasan Admin" },
    ...REVIEW_PAGES,
    ...(isAdministrator ? ADMIN_PAGES : []),
  ];

  return (
    <header className="bg-background border-b">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 lg:gap-4">
          <Link
            href="/admin"
            className="flex w-fit items-center gap-2"
            aria-label="Agoraya — Panel Admin"
          >
            <Image
              src="/logo/brand.svg"
              alt=""
              width={32}
              height={32}
              priority
            />
            <span className="text-lg font-semibold tracking-tight">Agoraya</span>
          </Link>
          <nav
            aria-label="Navigasi laman admin"
            className="flex flex-1 flex-wrap items-center gap-x-1 gap-y-2"
          >
            {pages.map((page) => {
              const isActive =
                pathname === page.href || pathname.startsWith(`${page.href}/`);

              return (
                <Link
                  key={page.href}
                  href={page.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {page.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Button onClick={handleLogout} size="sm">
              Keluar
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}