'use client';

import * as React from 'react';

type InfoBannerProps = {
  wilayah: string;
  tahun: string;
  periode: string;
  updatedAt: string;
};

export function InfoBanner({ wilayah, tahun, periode, updatedAt }: InfoBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 shadow-sm dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
    >
      <span className="font-semibold">
        {wilayah} · {tahun} · {periode}
      </span>
      <span className="text-blue-700 dark:text-blue-300">
        · Pembaruan: {updatedAt}
      </span>
    </div>
  );
}

export function formatInfoBanner(
  wilayah: string,
  periode: string,
  updatedAt: string,
): InfoBannerProps {
  const [tahun, triwulan] = periode.split(' · ');
  return {
    wilayah: wilayah.replace('Provinsi ', ''),
    tahun: tahun ?? '-',
    periode: triwulan?.replace(/^s\.d\.\s*/, '') ?? '-',
    updatedAt,
  };
}
