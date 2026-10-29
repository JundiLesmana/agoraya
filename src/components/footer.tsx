"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Facebook, Instagram, Youtube } from "./social-icons";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

const SECONDARY_NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "/data", label: "Data Pemerintah" },
  { href: "/tracking", label: "Layanan Publik" },
  { href: "/citizen/dashboard", label: "Lapor Warga" },
  { href: "/insights", label: "Insight" },
  { href: "/tentang", label: "Tentang" },
] as const;

const SOCIAL_LINKS = [
  {
    href: "https://www.instagram.com/agoraya",
    label: "Instagram",
    Icon: Instagram,
  },
  { href: "https://www.youtube.com/@agoraya", label: "YouTube", Icon: Youtube },
  {
    href: "https://www.facebook.com/agoraya",
    label: "Facebook",
    Icon: Facebook,
  },
] as const;

function Footer() {
  const { theme } = useTheme();
  const isHomePage = usePathname() === "/";

  return (
    <footer className="border-border/60 bg-background border-t">
      {!isHomePage && (
        <section
          aria-labelledby="footer-report-cta-title"
          className="mx-auto mt-8 mb-10 flex max-w-7xl flex-col items-start justify-between gap-6 rounded-2xl bg-slate-900 px-4 py-8 text-white sm:mb-12 sm:px-6 sm:py-9 lg:flex-row lg:items-center lg:px-8"
        >
          <div>
            <h2
              id="footer-report-cta-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Perubahan dimulai dari kepedulian Anda
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Buat laporan. Sampaikan laporan yang faktual. Bantu ciptakan
              lingkungan yang lebih baik.
            </p>
          </div>
          <Button
            asChild
            className="h-12 shrink-0 bg-white px-5 text-blue-800 hover:bg-slate-100 focus-visible:ring-white"
            aria-label="Buat laporan"
          >
            <Link href="/tracking">
              Buat laporan
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </section>
      )}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4">
          <section className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
            <Link
              href="/"
              className="focus-visible:ring-ring flex items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Image
                src={
                  theme === "dark"
                    ? "/logo/logo-dark.svg"
                    : "/logo/logo-light.svg"
                }
                alt="Agoraya"
                width={180}
                height={48}
                className="h-10 w-auto shrink-0 object-contain"
              />
            </Link>
            <p className="text-muted-foreground text-xs">
              © 2026 Agoraya. Semua hak dilindungi.
            </p>
          </section>

          <nav
            aria-label="Navigasi sekunder"
            className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-center text-sm"
          >
            {SECONDARY_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-muted-foreground hover:text-foreground focus-visible:ring-ring w-fit rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <nav
            aria-label="Media sosial"
            className="flex flex-wrap items-center justify-center gap-3 md:justify-self-end"
          >
            {SOCIAL_LINKS.map(({ href, label, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring inline-flex size-10 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Icon className="size-4" aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
