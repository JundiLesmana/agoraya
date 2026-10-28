"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, MoonStar, Search, SunMedium, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

const NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "/data", label: "Data Pemerintah" },
  { href: "/tracking", label: "Layanan Publik" },
  { href: "/citizen/dashboard", label: "Lapor Warga" },
  { href: "/insights", label: "Insight" },
  { href: "/tentang", label: "Tentang" },
] as const;

function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const isAboutPage = pathname === "/tentang";
  const logoSrc =
    isAboutPage || theme !== "dark"
      ? "/logo/logo-light.svg"
      : "/logo/logo-dark.svg";
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
    const firstFocusable = mobileMenuRef.current?.querySelector<HTMLElement>(
      'a, button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();
  }, [mobileMenuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur",
        isAboutPage
          ? "border-slate-200 bg-white/95 shadow-none supports-[backdrop-filter]:bg-white/90"
          : "border-border/60 bg-background/95 supports-[backdrop-filter]:bg-background/75 shadow-sm",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-8",
          "max-w-7xl",
        )}
      >
        <Link
          href="/"
          className="focus-visible:ring-ring flex items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Image
            src={logoSrc}
            alt="Agoraya"
            width={180}
            height={48}
            priority
            className="h-10 w-auto shrink-0 object-contain"
          />
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
        >
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "focus-visible:ring-ring rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  isAboutPage
                    ? active
                      ? "text-blue-700"
                      : "text-slate-600 hover:text-blue-700"
                    : "text-muted-foreground hover:text-foreground",
                  !isAboutPage && active && "text-primary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <div
            className={cn(
              "inline-flex items-center rounded-full border p-1 shadow-sm",
              isAboutPage
                ? "border-slate-200 bg-white"
                : "border-border bg-background",
            )}
          >
            <button
              type="button"
              aria-label="Tema terang"
              aria-pressed={theme === "light"}
              onClick={toggleTheme}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                theme === "light"
                  ? isAboutPage
                    ? "bg-blue-50 text-blue-700"
                    : "bg-primary/10 text-primary"
                  : isAboutPage
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-muted-foreground hover:text-foreground",
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
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                theme === "dark"
                  ? isAboutPage
                    ? "bg-blue-50 text-blue-700"
                    : "bg-primary/10 text-primary"
                  : isAboutPage
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MoonStar className="size-4" /> Gelap
            </button>
          </div>
          <Button
            asChild
            className={cn(
              isAboutPage && "bg-blue-700 text-white hover:bg-blue-800",
            )}
          >
            <Link href="/login">Masuk / Daftar</Link>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cari"
            className={cn(
              "size-10",
              isAboutPage && "text-slate-700 hover:bg-slate-100",
            )}
          >
            <Search className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className={cn(
              "size-10",
              isAboutPage && "text-slate-700 hover:bg-slate-100",
            )}
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
        className={cn(
          "overflow-hidden border-t transition-all duration-300 ease-in-out lg:hidden",
          isAboutPage
            ? "border-slate-200 bg-white"
            : "border-border/60 bg-background",
          mobileMenuOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div
          ref={mobileMenuRef}
          id="mobile-navigation"
          className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6 lg:px-8"
        >
          <div
            className={cn(
              "flex items-center justify-between border-b pb-3",
              isAboutPage ? "border-slate-200" : "border-border",
            )}
          >
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  isAboutPage && "text-slate-900",
                )}
              >
                Agoraya
              </p>
              <p
                className={cn(
                  "text-xs",
                  isAboutPage ? "text-slate-600" : "text-muted-foreground",
                )}
              >
                SatuData.id
              </p>
            </div>
            <div
              className={cn(
                "inline-flex rounded-full border p-1",
                isAboutPage ? "border-slate-200" : "border-border",
              )}
            >
              <button
                type="button"
                aria-label="Tema terang"
                aria-pressed={theme === "light"}
                onClick={toggleTheme}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  theme === "light"
                    ? isAboutPage
                      ? "bg-blue-50 text-blue-700"
                      : "bg-primary/10 text-primary"
                    : isAboutPage
                      ? "text-slate-600"
                      : "text-muted-foreground",
                )}
              >
                Terang
              </button>
              <button
                type="button"
                aria-label="Tema gelap"
                aria-pressed={theme === "dark"}
                onClick={toggleTheme}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  theme === "dark"
                    ? isAboutPage
                      ? "bg-blue-50 text-blue-700"
                      : "bg-primary/10 text-primary"
                    : isAboutPage
                      ? "text-slate-600"
                      : "text-muted-foreground",
                )}
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
                  "focus-visible:ring-ring rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  isAboutPage
                    ? "text-slate-700 hover:bg-blue-50 hover:text-blue-800"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button
            asChild
            className={cn(
              "w-full",
              isAboutPage && "bg-blue-700 text-white hover:bg-blue-800",
            )}
          >
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
