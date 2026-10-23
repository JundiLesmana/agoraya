import Link from 'next/link';

export default function PublicDataPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string | string[] }>;
}) {
  const query = undefined as string | undefined;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <p className="text-sm font-medium text-primary">Hasil pencarian</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Cari data, layanan, atau informasi</h1>
        <p className="max-w-2xl text-slate-600">
          Halaman ini menampilkan hasil pencarian berdasarkan kata kunci yang Anda masukkan melalui hero section.
        </p>
        <Link href="/" className="inline-flex text-sm font-medium text-primary hover:underline">
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
