import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { listAssignedProjects } from "@/modules/project-progress/service";
import { ProjectPrioritizationWorkspace } from "./_components/project-prioritization-workspace";

export const metadata: Metadata = {
  title: "Prioritasi Proyek | Agoraya",
  description:
    "Tinjau hasil run prioritisasi proyek, breakdown skor per kriteria, dan versi kriteria/algoritma sebelum menentukan tindakan lanjutan secara manual.",
};

export default async function ProjectPrioritizationPage() {
  const session = await requireAuth({ roles: ["asn", "staff"] });

  const assignableProjects = await listAssignedProjects(session);

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
              Prioritasi
            </span>
          </li>
        </ol>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Prioritasi Proyek
          </h1>
          <p className="text-muted-foreground text-sm">
            Tinjau hasil run prioritisasi, breakdown skor per kriteria, serta
            versi kriteria dan algoritma. Hasil adalah rekomendasi pendukung;
            keputusan lanjutan tetap ditentukan secara manual.
          </p>
        </div>
      </div>

      <ProjectPrioritizationWorkspace assignableProjects={assignableProjects} />
    </main>
  );
}
