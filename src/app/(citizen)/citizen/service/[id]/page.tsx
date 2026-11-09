import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { and, eq } from 'drizzle-orm';
import { ServiceSpaceNavigation } from '@/components/service-space-navigation';
import { Button } from '@/components/ui/button';
import { requireAuth } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { serviceApplications } from '@/lib/db/schema';
import { mapStoredServiceApplication, type StoredServiceApplication } from '../_components/tracking-data';
import { SubmissionDetailClient } from './submission-detail-client';

export const dynamic = 'force-dynamic';

type CitizenServiceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CitizenServiceDetailPage({
  params,
}: CitizenServiceDetailPageProps) {
  const session = await requireAuth({
    roles: ['citizen'],
  });
  const { id } = await params;

  const storedApplication = await db().query.serviceApplications.findFirst({
    columns: {
      id: true,
      trackingNumber: true,
      category: true,
      serviceType: true,
      serviceId: true,
      routeKey: true,
      serviceName: true,
      agency: true,
      status: true,
      applicantName: true,
      contactEmail: true,
      payload: true,
      submittedAt: true,
      updatedAt: true,
    },
    where: and(
      eq(serviceApplications.id, id),
      eq(serviceApplications.tenantId, session.tenantId),
      eq(serviceApplications.applicantUserId, session.userId),
    ),
  });

  if (!storedApplication) {
    notFound();
  }

  const application = mapStoredServiceApplication({
    ...(storedApplication as Omit<StoredServiceApplication, 'submittedAt' | 'updatedAt'>),
    submittedAt: storedApplication.submittedAt.toISOString(),
    updatedAt: storedApplication.updatedAt.toISOString(),
  });

  return (
    <div className="pb-12">
      <section className="border-b border-border bg-sky-50 dark:bg-sky-950/30">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/citizen/service" className="hover:text-primary">
                  Ruang Warga
                </Link>
              </li>
              <li aria-hidden="true" className="select-none">
                {' > '}
              </li>
              <li>
                <Link href="/citizen/service" className="hover:text-primary">
                  Pengajuan Saya
                </Link>
              </li>
              <li aria-hidden="true" className="select-none">
                {' > '}
              </li>
              <li aria-current="page" className="font-medium text-primary">
                Tinjau Resolusi
              </li>
            </ol>
          </nav>

          <div className="space-y-3">
            <Button asChild variant="outline" className="w-fit">
              <Link href="/citizen/service">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Kembali ke pengajuan saya
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tinjau Resolusi</h1>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Detail pengajuan ini hanya tersedia untuk akun pemilik yang sedang masuk.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <ServiceSpaceNavigation
              activeSpace="citizen"
              statisticsHref="/tracking/stat"
              excludeSpaces={['agency']}
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <SubmissionDetailClient initialApplication={application} />
      </main>
    </div>
  );
}

