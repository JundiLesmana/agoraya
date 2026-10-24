'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const POPULAR_TAGS = ['APBD', 'Proyek Infrastruktur', 'Pendidikan', 'Kesehatan', 'Bantuan Sosial'] as const;

function PublicHeroSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState('');

  const submitSearch = React.useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/data?query=${encodeURIComponent(trimmed)}`);
  }, [query, router]);

  return (
    <div className="space-y-2 sm:space-y-3 lg:space-y-3">
      <form
        className="flex w-full min-w-0 items-stretch gap-1.5 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur dark:border-border dark:bg-card dark:shadow-black/20 sm:gap-2 sm:rounded-3xl sm:p-2 lg:p-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl px-2 sm:gap-3 sm:rounded-2xl sm:px-4">
          <Search className="size-4 shrink-0 text-slate-400 dark:text-muted-foreground sm:size-5" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari data, layanan, atau informasi..."
            aria-label="Cari data, layanan, atau informasi"
            className="h-10 min-w-0 border-0 bg-transparent px-0 text-sm text-foreground shadow-none placeholder:text-xs placeholder:text-slate-400 dark:placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-12 sm:text-base sm:placeholder:text-sm lg:h-10"
          />
          {query ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Hapus pencarian"
              className="size-8 shrink-0 rounded-full text-slate-500 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-accent sm:size-10"
              onClick={() => setQuery('')}
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
        <Button type="submit" size="lg" className="h-10 shrink-0 rounded-xl px-2.5 text-sm sm:h-12 sm:rounded-2xl sm:px-5 sm:text-base lg:h-10 lg:px-4">
          <Search className="size-4" />
          Cari
        </Button>
      </form>

      <div className="flex flex-wrap gap-1.5 sm:gap-2 lg:gap-2">
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setQuery(tag)}
            className={cn(
              'rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-border dark:bg-card/80 dark:text-muted-foreground sm:px-3 sm:py-1.5 sm:text-xs lg:px-3 lg:py-1 lg:text-xs',
            )}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

export { PublicHeroSearch };
