import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";
import { listAssignedProjects } from "@/modules/project-progress/service";
import { ProjectInputProgressPage } from "./_components/project-input-progress-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Input & Progres Proyek | Agoraya",
  description:
    "Input progres fisik dan keuangan proyek infrastruktur secara berkala (bulanan) dengan dokumentasi foto lapangan sebagai bukti fisik.",
};

export default async function InputProgresProyekPage() {
  const session = await getCurrentSession();
  const initialProjects =
    session && session.roles.some((role) => ["asn", "staff"].includes(role))
      ? await listAssignedProjects(session)
      : [];

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm"
      >
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/asn/dashboard" className="hover:text-foreground">
              Ruang ASN
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li>
            <Link
              href="/asn/project"
              className="hover:text-foreground"
            >
              Proyek Pembangunan
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li aria-current="page" className="font-medium text-foreground">
            Input &amp; Progres Proyek
          </li>
        </ol>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Ruang kerja operator ASN</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Input &amp; Progres Proyek
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Catat progres fisik dan keuangan proyek infrastruktur yang menjadi tanggung jawab
            Anda, sertakan bukti lapangan, dan pantau riwayat pelaporan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/asn/project/prioritization"
            className="border-input hover:bg-accent inline-flex h-9 shrink-0 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition-colors"
          >
            Lihat Prioritasi Proyek
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </header>

      <ProjectInputProgressPage initialProjects={initialProjects} />
    </main>
  );
}
