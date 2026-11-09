import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { getCurrentSession } from "@/lib/auth/session";
import { listAssignedProjects } from "@/modules/project-progress/service";
import { ProjectInputProgressPage } from "./_components/project-input-progress-page";

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
    <main className="container mx-auto space-y-6 px-4 py-6">
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm"
      >
        <ol className="flex flex-wrap gap-1 sm:gap-2">
          <li>
            <a
              href="/asn/project"
              className="hover:text-primary underline-offset-4 hover:underline"
            >
              Manajemen Proyek
            </a>
          </li>
          <li>
            <span aria-hidden="true" className="text-foreground">
              &gt;
            </span>
            <span aria-current="page" className="text-foreground font-medium">
              Input Progres
            </span>
          </li>
        </ol>
      </nav>

      <section className="rounded-xl border p-4">
        <h2 className="text-sm font-semibold">Tindakan terhubung</h2>
        <p className="text-muted-foreground text-sm">
          Tinjau hasil prioritisasi proyek dan breakdown skor sebelum menentukan
          tindakan lanjutan secara manual.
        </p>
        <a
          href="/asn/project/prioritization"
          className="hover:text-primary mt-3 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
        >
          Lihat Prioritasi Proyek
          <ChevronRight aria-hidden="true" size={16} />
        </a>
      </section>

      <ProjectInputProgressPage initialProjects={initialProjects} />
    </main>
  );
}
