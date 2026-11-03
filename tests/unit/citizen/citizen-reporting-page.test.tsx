/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import CitizenDashboardPage from "@/app/(citizen)/citizen/dashboard/page";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => createElement("img", props),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => createElement("a", { href, ...props }, children),
}));

describe("CitizenDashboardPage", () => {
  async function renderDashboard(category?: string) {
    const page = await CitizenDashboardPage({
      searchParams: Promise.resolve({ category }),
    });
    return render(page);
  }

  it("renders the reporting hero and links to the report form", async () => {
    await renderDashboard();

    expect(
      screen.getByRole("heading", {
        name: "Suara Anda, langkah awal perubahan.",
        level: 1,
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Laporkan masalah di sekitar Anda. Dari infrastruktur rusak hingga dugaan penyimpangan, setiap laporan melalui verifikasi dan dapat dipantau tindak lanjutnya.",
      ),
    ).toBeTruthy();
    expect(
      screen
        .getAllByRole("link", { name: "Buat laporan" })
        .some((link) => link.getAttribute("href") === "#report-form"),
    ).toBe(true);
  });

  it("renders three accessible category links with an icon and description", async () => {
    const { container } = await renderDashboard();
    const categories = [
      {
        title: "Infrastruktur Rusak",
        category: "Infrastruktur",
        description: "Jalan, trotoar, atau fasilitas umum.",
      },
      {
        title: "Dugaan Penyimpangan",
        category: "Dugaan korupsi",
        description: "Dugaan yang perlu pemeriksaan. Gunakan jalur rahasia.",
      },
      {
        title: "Isu Lingkungan",
        category: "Lingkungan",
        description: "Sampah, pencemaran, atau drainase.",
      },
    ];

    for (const category of categories) {
      const action = screen.getByRole("link", {
        name: `Buat laporan kategori ${category.title}`,
      });
      expect(action.querySelector("svg")).toBeTruthy();
      expect(action.textContent).toContain(category.description);
      expect(action.getAttribute("href")).toBe(
        `/citizen/dashboard?category=${encodeURIComponent(category.category)}#report-form`,
      );
      expect(action.className).toContain("flex");
      expect(action.className).toContain("border-slate-200");
      expect(action.className).toContain("bg-white");
      expect(action.className).toContain("dark:bg-slate-900");
      const iconContainer = action.querySelector("span");
      expect(iconContainer?.className).toContain("rounded-full");
      expect(iconContainer?.className).toContain("bg-blue-50");
      expect(iconContainer?.className).toContain("text-primary");
      expect(action.querySelector("svg")?.getAttribute("class")).toContain(
        "size-5",
      );
      expect(action.querySelector(".text-foreground")?.className).toContain(
        "font-semibold",
      );
      expect(
        action.querySelector(".text-muted-foreground")?.className,
      ).toContain("text-sm");
    }

    expect(
      container.querySelector(".grid-cols-1.md\\:grid-cols-3"),
    ).toBeTruthy();
    expect(screen.queryByText("Layanan lainnya")).toBeNull();
  });

  it("passes a valid category query to the report form and opens at details", async () => {
    await renderDashboard("Lingkungan");

    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "2",
    );
    expect(
      screen.getByRole("heading", { name: "Detail masalah" }),
    ).toBeTruthy();
    expect(screen.getByLabelText(/kategori laporan/i).textContent).toContain(
      "Pencemaran",
    );
    expect(screen.queryByRole("radio", { name: "Lingkungan" })).toBeNull();
  });

  it("explains the reporting flow and links to examples and recent reports", async () => {
    await renderDashboard();

    expect(
      screen.getByRole("heading", {
        name: "Dari laporan hingga penyelesaian",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Kirim laporan")).toBeTruthy();
    expect(screen.getByText("Verifikasi")).toBeTruthy();
    expect(screen.getByText("Tindak lanjut")).toBeTruthy();
    expect(screen.getByText("Konfirmasi hasil")).toBeTruthy();
    const trackingLink = screen.getByRole("link", {
      name: "Lihat contoh pelacakan",
    });
    const recentReportsLink = screen.getByRole("link", {
      name: "Lihat laporan terbaru",
    });
    expect(trackingLink.getAttribute("href")).toBe("/tracking");
    expect(recentReportsLink.getAttribute("href")).toBe("/#recent-reports");
    expect(recentReportsLink.className).toBe(trackingLink.className);
  });

  it("renders the report form, tracking example, sample reports, and help section", async () => {
    const { container } = await renderDashboard();

    expect(
      screen.getByRole("heading", { name: "Bantu kami memahami masalahnya" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Laporan terkirim, tindak lanjut terlihat",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Kenali laporan dan progresnya" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Melapor dengan lebih tenang" }),
    ).toBeTruthy();
    expect(
      container.querySelector(
        'img[src="/lapor-warga/jalan-rusak.png"][alt="Jalan berlubang di Jl. Melati"]',
      ),
    ).toBeTruthy();
    expect(
      container.querySelector(
        'img[src="/lapor-warga/sampah-serakan.png"][alt="Sampah menumpuk di tepi saluran"]',
      ),
    ).toBeTruthy();
    expect(
      container.querySelector(
        'img[src="/lapor-warga/lampu-jalan.png"][alt="Lampu jalan kembali menyala"]',
      ),
    ).toBeTruthy();
  });
});
