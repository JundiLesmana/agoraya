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
      className="mx-auto max-w-7xl flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 shadow-sm"
    >
      <span className="font-semibold">{wilayah}</span>
      <span className="font-semibold">{tahun}</span>
      <span className="font-semibold">{periode}</span>
      <span className="text-blue-700">· Pembaruan: {updatedAt}</span>
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
    periode: triwulan ?? '-',
    updatedAt,
  };
}
