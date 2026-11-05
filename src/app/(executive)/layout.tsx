import { requireAuth } from '@/lib/auth/guards';

export default async function ExecutiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth({ roles: ['executive', 'pimpinan', 'superadmin'] });

  return <div className="min-h-screen bg-slate-100 text-slate-800">{children}</div>;
}
