"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

export function ManagementNavigation() {
  const pathname = usePathname();
  const isHandling =
    pathname === "/asn/management/processing" ||
    /^\/asn\/management\/[^/]+$/.test(pathname);
  const links = [
    {
      href: "/asn/management",
      label: "Antrean Pengajuan",
      icon: ClipboardList,
      active: pathname === "/asn/management",
    },
    {
      href: "/asn/management/processing",
      label: "Penanganan Pengajuan",
      icon: FileSearch,
      active: isHandling,
    },
  ];

  return (
    <nav aria-label="Navigasi manajemen pengajuan" className="flex gap-2 lg:flex-col">
      {links.map(({ href, label, icon: Icon, active }) => (
        <Link
          key={label}
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            active
              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}