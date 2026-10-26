import Link from 'next/link';
import { cn } from '@/lib/utils';

type ServiceSpace = 'citizen' | 'agency';

const SERVICE_SPACES = [
  { id: 'citizen', href: '/citizen/reporting', label: 'Ruang Warga' },
  { id: 'agency', href: '/asn/reporting', label: 'Ruang Instansi' },
] as const;

export function ServiceSpaceNavigation({ activeSpace }: { activeSpace: ServiceSpace }) {
  return (
    <nav
      aria-label="Kategori layanan publik"
      className="mt-5 inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-white/70 bg-background p-1 shadow-sm dark:border-border"
    >
      {SERVICE_SPACES.map((space) => {
        const active = space.id === activeSpace;
        return (
          <Link
            key={space.id}
            href={space.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              active
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {space.label}
          </Link>
        );
      })}
    </nav>
  );
}
