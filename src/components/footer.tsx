'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Youtube } from './social-icons';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';

const SECONDARY_NAV_ITEMS = [
  { href: '/', label: 'Beranda' },
  { href: '/data', label: 'Data Pemerintah' },
  { href: '/citizen/reporting', label: 'Layanan Publik' },
  { href: '/citizen/dashboard', label: 'Lapor Warga' },
  { href: '/insights', label: 'Insight' },
  { href: '/tentang', label: 'Tentang' },
] as const;

const SOCIAL_LINKS = [
  { href: 'https://www.instagram.com/agoraya', label: 'Instagram', Icon: Instagram },
  { href: 'https://www.youtube.com/@agoraya', label: 'YouTube', Icon: Youtube },
  { href: 'https://www.facebook.com/agoraya', label: 'Facebook', Icon: Facebook },
] as const;

function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="flex flex-col gap-10 md:gap-12 lg:grid lg:grid-cols-[1.2fr_1fr_0.9fr] lg:items-start">
          <section className="flex flex-col gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Image
                src={theme === 'dark' ? '/logo/logo-dark.svg' : '/logo/logo-light.svg'}
                alt="Agoraya"
                width={180}
                height={48}
                className="h-10 w-auto shrink-0 object-contain"
              />
            </Link>
            <p className="text-xs text-muted-foreground">© 2025 Agoraya. Semua hak dilindungi.</p>
          </section>

          <nav aria-label="Navigasi sekunder" className="grid gap-3 text-sm sm:grid-cols-2 md:gap-2 lg:grid-cols-1">
            {SECONDARY_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'w-fit rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Media sosial" className="flex flex-wrap items-center gap-3 md:justify-start lg:justify-end">
            {SOCIAL_LINKS.map(({ href, label, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
