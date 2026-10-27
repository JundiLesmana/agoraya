import Link from "next/link";
import { cn } from "@/lib/utils";

type ServiceSpace = "citizen" | "agency" | "statistics";

const SERVICE_SPACES = [
  { id: "citizen", href: "/citizen/reporting", label: "Ruang Warga" },
  { id: "agency", href: "/asn/reporting", label: "Ruang Instansi" },
  { id: "statistics", href: "/data/statistik", label: "Ruang Statistik" },
] as const;

export function ServiceSpaceNavigation({
  activeSpace,
  variant = "default",
}: {
  activeSpace: ServiceSpace;
  variant?: "default" | "plain";
}) {
  return (
    <nav
      aria-label="Kategori layanan publik"
      className={
        variant === "plain"
          ? "mt-5 inline-flex max-w-full flex-wrap gap-2"
          : "bg-background dark:border-border mt-5 inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-white/70 p-1 shadow-sm"
      }
    >
      {SERVICE_SPACES.map((space) => {
        const active = space.id === activeSpace;
        return (
          <Link
            key={space.id}
            href={space.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-visible:ring-ring rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              variant === "plain"
                ? active
                  ? "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                : active
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {space.label}
          </Link>
        );
      })}
    </nav>
  );
}
