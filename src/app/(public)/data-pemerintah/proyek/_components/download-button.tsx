'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const CSV_HEADERS = 'id,nama_proyek,anggaran,realisasi,status';
const CSV_ROWS = [
  '1,Jalan Raya Barat,500000000,320000000,70%',
  '2,Jembatan Siliwangi,350000000,175000000,50%',
  '3,TPST Ciparay,120000000,48000000,40%',
].join('\n');

/**
 * Unduh data proyek sebagai CSV (dummy/iterasi saat ini).
 * Membuat Blob dari data simulasi dan memicu unduhan melalui anchor buatan.
 */
export function downloadData(): void {
  const csv = `${CSV_HEADERS}\n${CSV_ROWS}\n`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'data-proyek.csv';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function DownloadButton() {
  return (
    <Button variant="outline" onClick={downloadData}>
      <Download className="size-4" aria-hidden="true" />
      Unduh data proyek
    </Button>
  );
}
