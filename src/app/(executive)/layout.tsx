import { requireAuth } from '@/lib/auth/guards';

export default async function ExecutiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth({ roles: ['executive', 'pimpinan'] });
  return (
    <div className="min-h-screen">
      <nav className="border-b p-4">Executive Dashboard</nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
