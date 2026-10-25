"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DownloadButtonProps {
  search: string;
  sort: string;
  status: string;
  wilayah: string;
  periode: string;
  sektor: string;
}

export function DownloadButton({
  search,
  sort,
  status,
  wilayah,
  periode,
  sektor,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function downloadData() {
    setIsDownloading(true);
    setHasError(false);

    try {
      const params = new URLSearchParams({
        search,
        sort,
        format: "csv",
        wilayah,
        periode,
        sektor,
      });
      if (status !== "Semua status") params.set("status", status);

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) throw new Error("Project export failed.");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "daftar-proyek.csv";
      document.body.appendChild(anchor);
      try {
        anchor.click();
      } finally {
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch {
      setHasError(true);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button
        variant="outline"
        onClick={() => void downloadData()}
        disabled={isDownloading}
      >
        <Download className="size-4" aria-hidden="true" />
        {isDownloading ? "Menyiapkan unduhan..." : "Unduh daftar"}
      </Button>
      {hasError ? (
        <p role="alert" className="text-destructive text-xs">
          Daftar proyek gagal diunduh.
        </p>
      ) : null}
    </div>
  );
}
