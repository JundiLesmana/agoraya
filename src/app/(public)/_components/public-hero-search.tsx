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
    <div className="space-y-4">
      <form
        className="flex w-full items-stretch gap-2 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-4">
          <Search className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari data, layanan, atau informasi..."
            aria-label="Cari data, layanan, atau informasi"
            className="h-12 border-0 bg-transparent px-0 text-base shadow-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {query ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Hapus pencarian"
              className="size-10 shrink-0 rounded-full text-slate-500 hover:bg-slate-100"
              onClick={() => setQuery('')}
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
        <Button type="submit" size="lg" className="h-12 rounded-2xl px-5">
          <Search className="size-4" />
          Cari
        </Button>
      </form>

      <div className="flex flex-wrap gap-3">
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setQuery(tag)}
            className={cn(
              'rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
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
