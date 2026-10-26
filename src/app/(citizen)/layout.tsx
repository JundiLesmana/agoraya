import { requireAuth } from '@/lib/auth/guards';
import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';

export default async function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth({ roles: ['citizen'] });
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
