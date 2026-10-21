import { requireAuth } from '@/lib/auth/guards';

export default async function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth({ roles: ['citizen'] });
  return (
    <div className="min-h-screen">
      <nav className="border-b p-4">Citizen Portal</nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
