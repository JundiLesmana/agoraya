import Link from "next/link";
import { ArrowRight, ClipboardList, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SERVICE_APPLICATION_CATALOG,
  SERVICE_APPLICATION_CATEGORIES,
} from "@/modules/service-applications/catalog";

const CATEGORY_ICONS = {
  permit: ClipboardList,
  education: ClipboardList,
  social: ClipboardList,
  health: Stethoscope,
} as const;

export function ServiceApplicationCatalog() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-3xl space-y-3">
        <p className="text-primary text-xs font-semibold tracking-wider uppercase">
          Ruang Warga
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Katalog Layanan Publik
        </h1>
        <p className="text-muted-foreground text-sm leading-6">
          Pilih kategori dan subkategori layanan. Setiap pengajuan diteruskan ke
          instansi yang bertanggung jawab dan dapat dipantau melalui nomor
          pelacakan.
        </p>
        <Button asChild variant="outline">
          <Link href="/citizen/service">Lihat pengajuan saya</Link>
        </Button>
      </header>

      <section
        aria-label="Kategori layanan publik"
        className="grid gap-4 md:grid-cols-2"
      >
        {SERVICE_APPLICATION_CATEGORIES.map((category) => {
          const item = SERVICE_APPLICATION_CATALOG[category];
          const Icon = CATEGORY_ICONS[category];

          return (
            <Card key={category} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="bg-primary/10 text-primary rounded-lg p-2">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="space-y-1">
                    <CardTitle>{item.label}</CardTitle>
                    <p className="text-muted-foreground text-sm">
                      Dikelola oleh {item.agency}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="text-muted-foreground space-y-2 text-sm">
                  {Object.entries(item.services).map(([id, name]) => (
                    <li key={id} className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="bg-primary mt-2 size-1.5 shrink-0 rounded-full"
                      />
                      <span>{name}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-auto w-fit">
                  <Link href={item.href}>
                    Pilih layanan {item.label}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}