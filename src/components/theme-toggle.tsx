"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "border-border inline-flex items-center rounded-full border p-1",
        !compact && "bg-background shadow-sm",
      )}
    >
      <button
        type="button"
        aria-label="Tema terang"
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full text-sm font-medium transition-colors",
          compact ? "px-3 py-1.5 text-xs" : "px-4 py-2",
          theme === "light"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <SunMedium aria-hidden="true" className={compact ? "hidden" : "size-4"} />
        Terang
      </button>
      <button
        type="button"
        aria-label="Tema gelap"
        aria-pressed={theme === "dark"}
        onClick={() => setTheme("dark")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full text-sm font-medium transition-colors",
          compact ? "px-3 py-1.5 text-xs" : "px-4 py-2",
          theme === "dark"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <MoonStar aria-hidden="true" className={compact ? "hidden" : "size-4"} />
        Gelap
      </button>
    </div>
  );
}
