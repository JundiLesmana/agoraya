'use client';

import * as React from 'react';

type InfoBannerProps = {
  wilayah: string;
  periode: string;
  topik: string;
  updatedAt: string;
};

export function InfoBanner({
  wilayah,
  periode,
  topik,
  updatedAt,
}: InfoBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-md border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground shadow-sm"
    >
      <span className="font-semibold">Seluruh angka</span>
      <span>·</span>
      <span>Data contoh</span>
      <span className="hidden sm:inline">·</span>
      <span className="hidden sm:inline font-semibold">{wilayah}</span>
      <span className="hidden sm:inline">· {periode}</span>
      <span className="hidden sm:inline">· {topik}</span>
      <span className="text-xs">· Pembaruan: {updatedAt}</span>
    </div>
  );
}
