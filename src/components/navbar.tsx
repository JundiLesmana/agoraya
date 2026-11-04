"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { href: '/', label: 'Beranda' },
  { href: '/data', label: 'Data Pemerintah' },
  { href: '/tracking', label: 'Layanan Publik' },
  { href: '/citizen/dashboard', label: 'Lapor Warga' },
  { href: '/insight', label: 'Insight' },
  { href: '/tentang', label: 'Tentang' },
] as const;

function isNavigationItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === href;
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  if (
    href === "/tracking" &&
    (pathname === "/citizen/apply" || pathname.startsWith("/citizen/apply/"))
  )
    return true;
  return false;
}

function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [authenticated, setAuthenticated] = React.useState(false);
  const mobileMenuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch("/api/auth", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (active) setAuthenticated(Boolean(data?.authenticated));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthenticated(false);
    if (typeof window !== "undefined") {
      // clear cached client data
      try {
        window.localStorage.clear();
        window.sessionStorage.clear();
      } catch {}
    }
    router.refresh();
    router.replace("/");
  }

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const firstFocusable = mobileMenuRef.current?.querySelector<HTMLElement>('a, button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    firstFocusable?.focus();
  }, [mobileMenuOpen]);

  if (pathname === "/bantuan" || pathname.startsWith("/bantuan/")) return null;

  return (
    <header className="border-border/60 bg-background/95 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-50 border-b shadow-sm backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="focus-visible:ring-ring flex items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
          <Image src={theme === 'dark' ? '/logo/logo-dark.svg' : '/logo/logo-light.svg'} alt="Agoraya" width={180} height={48} priority className="h-10 w-auto shrink-0 object-contain" />
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
        >
          {NAV_ITEMS.map((item) => {
            const active = isNavigationItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                  active && 'text-primary',
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          {authenticated ? (
            <Button onClick={handleLogout}>Keluar</Button>
          ) : (
            <Button asChild>
              <Link href="/login">Masuk / Daftar</Link>
            </Button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="size-10"
            onClick={() => setMobileMenuOpen((value) => !value)}
          >
            {mobileMenuOpen ? (
              <X className="size-4" />
            ) : (
              <Menu className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <div
        className={cn('border-border/60 bg-background overflow-hidden border-t transition-all duration-300 ease-in-out lg:hidden', mobileMenuOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0')}
      >
        <div ref={mobileMenuRef} id="mobile-navigation" className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="border-border flex items-center justify-between border-b pb-3">
            <div>
              <p className="text-sm font-semibold">Agoraya</p>
            </div>
            <ThemeToggle compact />
          </div>
          <nav aria-label="Navigasi mobile" className="grid gap-2">
            {NAV_ITEMS.map((item) => {
              const active = isNavigationItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={active ? "location" : undefined}
                  className={cn(
                    "text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    active && "bg-primary/10 text-primary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {authenticated ? (
            <Button className="w-full" onClick={() => { setMobileMenuOpen(false); handleLogout(); }}>
              Keluar
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                Masuk / Daftar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export { Navbar };
