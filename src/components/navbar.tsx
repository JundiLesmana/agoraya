"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, MoonStar, SunMedium, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

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
  const { theme, toggleTheme } = useTheme();
  const logoSrc =
    theme === "dark" ? "/logo/logo-dark.svg" : "/logo/logo-light.svg";
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const mobileMenuRef = React.useRef<HTMLDivElement | null>(null);

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
                aria-current={active && pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <div className="border-border bg-background inline-flex items-center rounded-full border p-1 shadow-sm">
            <button
              type="button"
              aria-label="Tema terang"
              aria-pressed={theme === "light"}
              onClick={toggleTheme}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                theme === 'light' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <SunMedium className="size-4" /> Terang
            </button>
            <button
              type="button"
              aria-label="Tema gelap"
              aria-pressed={theme === "dark"}
              onClick={toggleTheme}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                theme === 'dark' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <MoonStar className="size-4" /> Gelap
            </button>
          </div>
          <Button asChild>
            <Link href="/login">Masuk / Daftar</Link>
          </Button>
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
              <p className="text-muted-foreground text-xs">SatuData.id</p>
            </div>
            <div className="border-border inline-flex rounded-full border p-1">
              <button
                type="button"
                aria-label="Tema terang"
                aria-pressed={theme === "light"}
                onClick={toggleTheme}
                className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors', theme === 'light' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}
              >
                Terang
              </button>
              <button
                type="button"
                aria-label="Tema gelap"
                aria-pressed={theme === "dark"}
                onClick={toggleTheme}
                className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors', theme === 'dark' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}
              >
                Gelap
              </button>
            </div>
          </div>
          <nav aria-label="Navigasi mobile" className="grid gap-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  isNavigationItemActive(pathname, item.href) && "bg-primary/10 text-primary",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button asChild className="w-full">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              Masuk / Daftar
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export { Navbar };
