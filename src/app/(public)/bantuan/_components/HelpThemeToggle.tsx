"use client";

import * as React from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export function HelpThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="border-border bg-background inline-flex items-center rounded-full border p-1 shadow-sm">
      <button
        type="button"
        aria-label="Tema terang"
        aria-pressed={theme === "light"}
        onClick={toggleTheme}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          theme === "light" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <SunMedium className="size-4" /> Terang
      </button>
      <button
        type="button"
        aria-label="Tema gelap"
        aria-pressed={theme === "dark"}
        onClick={toggleTheme}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          theme === "dark" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <MoonStar className="size-4" /> Gelap
      </button>
    </div>
  );
}
export default HelpThemeToggle;
