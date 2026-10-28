/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { KeyFeaturesSection } from "@/app/(public)/_components/key-features-section";

const FEATURES = [
  {
    caption: "Ringkasan data",
    title: "Dashboard Ringkasan",
    description:
      "Lihat ringkasan anggaran, proyek, dan indikator sosial-ekonomi dalam satu tampilan.",
    detail: "Untuk warga: lihat capaian pembangunan di wilayah Anda.",
    cardClass: "bg-[#edf6ff]",
  },
  {
    caption: "Alokasi anggaran",
    title: "Data Anggaran",
    description:
      "Telusuri alokasi dan realisasi anggaran per sektor dan wilayah.",
    detail: "Untuk warga: telusuri penggunaan anggaran daerah.",
    cardClass: "bg-[#eff9f4]",
  },
  {
    caption: "Proyek pembangunan",
    title: "Proyek Daerah",
    description:
      "Pantau progres proyek pembangunan dari perencanaan hingga penyelesaian.",
    detail: "Untuk warga: pantau status proyek di sekitar Anda.",
    cardClass: "bg-[#fff6ef]",
  },
  {
    caption: "Indikator sosial",
    title: "Statistik Daerah",
    description:
      "Akses indikator sosial-ekonomi seperti IPM, kemiskinan, dan pengangguran.",
    detail: "Untuk semua: lihat indikator kesejahteraan daerah.",
    cardClass: "bg-[#edf6ff]",
  },
  {
    caption: "Interpretasi data",
    title: "Insight Publik",
    description:
      "Dapatkan interpretasi bermakna dari data mentah untuk pengambilan keputusan.",
    detail: "Untuk semua: baca analisis dan insight publik.",
    cardClass: "bg-[#f5f0ff]",
  },
  {
    caption: "Partisipasi warga",
    title: "Lapor Warga",
    description:
      "Laporkan masalah publik dan pantau tindak lanjutnya secara real-time.",
    detail: "Untuk warga: laporkan masalah dan pantau tindak lanjut.",
    cardClass: "bg-[#fff6ef]",
  },
];

describe("KeyFeaturesSection", () => {
  it("renders the section heading and description", () => {
    render(<KeyFeaturesSection />);

    const section = screen.getByRole("region", { name: "Fitur Utama" });
    expect(
      within(section).getByRole("heading", {
        level: 2,
        name: "Fitur Utama",
      }),
    ).toBeTruthy();
    expect(
      within(section).getByText(
        "Platform ini menyediakan berbagai fitur untuk mengakses dan menganalisis data pembangunan.",
      ),
    ).toBeTruthy();
  });

  it("renders exactly six feature cards with the specified headings and descriptions", () => {
    render(<KeyFeaturesSection />);

    const section = screen.getByRole("region", { name: "Fitur Utama" });
    const cards = within(section).getAllByRole("article");

    expect(cards).toHaveLength(6);
    for (const { title, caption, description, detail } of FEATURES) {
      const card = within(section).getByRole("article", { name: title });

      expect(
        within(card).getByRole("heading", { level: 3, name: title }),
      ).toBeTruthy();
      expect(within(card).getByText(caption)).toBeTruthy();
      expect(within(card).getByText(description)).toBeTruthy();
      expect(within(card).getByText(detail)).toBeTruthy();
      expect(card.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
        "true",
      );
    }

    expect(within(section).queryByRole("link")).toBeNull();
  });

  it("uses the responsive three-breakpoint grid and the specified card hover treatment", () => {
    render(<KeyFeaturesSection />);

    const section = screen.getByRole("region", { name: "Fitur Utama" });
    const grid = section.querySelector(".grid");
    const firstCard = within(section).getByRole("article", {
      name: "Dashboard Ringkasan",
    });

    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("md:grid-cols-2");
    expect(grid?.className).toContain("lg:grid-cols-3");
    expect(grid?.className).toContain("gap-6");
    expect(firstCard.className).toContain("rounded-[14px]");
    expect(firstCard.className).toContain("bg-[#edf6ff]");
    expect(firstCard.className).toContain("p-6");
    expect(firstCard.className).toContain("hover:border-blue-600");
    expect(firstCard.className).toContain("hover:-translate-y-1");
    expect(firstCard.className).toContain("hover:shadow-md");
  });

  it("renders decorative icons in colored containers and pastel feature cards", () => {
    render(<KeyFeaturesSection />);

    const section = screen.getByRole("region", { name: "Fitur Utama" });

    for (const { title, cardClass } of FEATURES) {
      const card = within(section).getByRole("article", { name: title });
      const icon = card.querySelector("svg");
      const iconContainer = icon?.parentElement;

      expect(card.className).toContain(cardClass);
      expect(icon?.getAttribute("class")).toContain("size-6");
      expect(icon?.getAttribute("class")).toContain("text-white");
      expect(iconContainer?.className).toContain("size-[52px]");
      expect(iconContainer?.className).toContain("rounded-[16px]");
    }

    expect(
      within(section).getByText(/fitur-fitur ini menghubungkan akses data/i),
    ).toBeTruthy();
  });
});
