/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { KeyFeaturesSection } from "@/app/(public)/_components/key-features-section";

const FEATURES = [
  {
    caption: "Pahami informasi",
    title: "Data Pemerintah",
    description:
      "Ruang untuk menelusuri data anggaran, proyek, dan statistik daerah dengan memperhatikan sumber serta periode datanya.",
    detail: "Untuk warga: membaca konteks sebelum menyimpulkan.",
    cardClass: "bg-[#edf6ff]",
  },
  {
    caption: "Kenali prosesnya",
    title: "Layanan Publik",
    description:
      "Ruang untuk memahami alur layanan, persyaratan, dan perkembangan proses dari sisi warga maupun instansi.",
    detail: "Untuk instansi: menjelaskan tahapan layanan dengan lebih jelas.",
    cardClass: "bg-[#eff9f4]",
  },
  {
    caption: "Sampaikan persoalan",
    title: "Laporan Warga",
    description:
      "Ruang partisipasi untuk menyampaikan masalah sekitar, dengan konteks pelaporan, verifikasi, dan tindak lanjut.",
    detail: "Untuk warga: menyusun laporan yang faktual dan relevan.",
    cardClass: "bg-[#fff6ef]",
  },
  {
    caption: "Temukan maknanya",
    title: "Insight",
    description:
      "Ruang untuk membaca perbandingan layanan, tren anggaran, dan indikator kesejahteraan secara lebih kontekstual.",
    detail: "Untuk semua: membandingkan data dengan dasar yang setara.",
    cardClass: "bg-[#f5f0ff]",
  },
];

const SECTION_NAME = "Dari memahami data hingga ikut berperan";

describe("KeyFeaturesSection", () => {
  it("renders the four-pillar heading and introduction", () => {
    render(<KeyFeaturesSection />);

    const section = screen.getByRole("region", { name: SECTION_NAME });
    expect(
      within(section).getByRole("heading", {
        level: 2,
        name: SECTION_NAME,
      }),
    ).toBeTruthy();
    expect(
      within(section).getByText(
        "Empat ruang yang saling melengkapi untuk mendukung transparansi dan partisipasi publik.",
      ),
    ).toBeTruthy();
  });

  it("renders exactly four feature cards with their expected copy", () => {
    render(<KeyFeaturesSection />);

    const section = screen.getByRole("region", { name: SECTION_NAME });
    expect(within(section).getAllByRole("article")).toHaveLength(4);
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
  });

  it("uses the four-card responsive layout and matching pastel colors", () => {
    render(<KeyFeaturesSection />);

    const section = screen.getByRole("region", { name: SECTION_NAME });
    const grid = section.querySelector(".grid");
    const firstCard = within(section).getByRole("article", {
      name: "Data Pemerintah",
    });

    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("sm:grid-cols-2");
    expect(grid?.className).toContain("xl:grid-cols-4");
    expect(firstCard.className).toContain("rounded-[14px]");
    expect(firstCard.className).toContain("bg-[#edf6ff]");
    expect(firstCard.className).toContain("p-6");
    expect(firstCard.className).toContain("hover:border-blue-600");
    expect(firstCard.className).toContain("hover:-translate-y-1");
    expect(firstCard.className).toContain("hover:shadow-md");
    expect(
      within(section).getByText(/empat pilar ini menjelaskan arah platform/i),
    ).toBeTruthy();
  });

  it("renders the decorative icons in colored containers", () => {
    render(<KeyFeaturesSection />);

    const section = screen.getByRole("region", { name: SECTION_NAME });
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
  });
});
