import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/guards";
import { listAssignedProjects } from "@/modules/project-progress/service";
import { ProjectPrioritizationWorkspace } from "./_components/project-prioritization-workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prioritasi Proyek | Agoraya",
  description:
    "Tinjau hasil run prioritisasi proyek, breakdown skor per kriteria, dan versi kriteria/algoritma sebelum menentukan tindakan lanjutan secara manual.",
};

export default async function ProjectPrioritizationPage() {
  const session = await requireAuth({ roles: ["asn", "staff"] });

  const assignableProjects = await listAssignedProjects(session);

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
            Prioritasi Proyek
          </li>
        </ol>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Ruang kerja operator ASN</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Prioritasi Proyek
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Bandingkan proyek berjalan yang ditugaskan pada tahun anggaran
            terpilih. Hasil deterministik dapat dijelaskan dengan AI, tetapi
            tidak menggantikan penilaian atau keputusan manual.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/asn/project"
            className="border-input hover:bg-accent inline-flex h-9 shrink-0 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition-colors"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Kembali ke input progres
          </Link>
        </div>
      </header>

      <ProjectPrioritizationWorkspace assignableProjects={assignableProjects} />
    </main>
  );
}