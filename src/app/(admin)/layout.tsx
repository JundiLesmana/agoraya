import { requireAuth } from '@/lib/auth/guards';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth({ roles: ['admin'] });
  return (
    <div className="min-h-screen">
      <nav className="border-b p-4">Admin Panel</nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
