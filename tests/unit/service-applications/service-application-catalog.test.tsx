import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServiceApplicationCatalog } from "@/app/(citizen)/citizen/apply/_components/service-catalog";

describe("ServiceApplicationCatalog", () => {
  it("lists all persisted service categories and routes to their category forms", () => {
    render(<ServiceApplicationCatalog />);

    expect(
      screen.getByRole("heading", { name: "Katalog Layanan Publik" }),
    ).toBeTruthy();

    const expected = [
      {
        category: "Perizinan",
        agency: "Dinas Penanaman Modal dan PTSP",
        href: "/citizen/apply/permit",
        services: ["NIB / usaha mikro", "Izin kegiatan", "Perizinan lainnya"],
      },
      {
        category: "Pendidikan",
        agency: "Dinas Pendidikan",
        href: "/citizen/apply/education",
        services: [
          "Bantuan biaya",
          "Administrasi siswa",
          "Konsultasi pendidikan",
        ],
      },
      {
        category: "Sosial",
        agency: "Dinas Sosial",
        href: "/citizen/apply/social",
        services: ["Kebutuhan dasar", "Dukungan keluarga", "Bantuan darurat"],
      },
      {
        category: "Kesehatan",
        agency: "Dinas Kesehatan",
        href: "/citizen/apply/health",
        services: [
          "Konsultasi & informasi layanan",
          "Permohonan layanan Puskesmas",
          "Aduan fasilitas kesehatan",
        ],
      },
    ] as const;

    for (const item of expected) {
      expect(screen.getByText(item.category)).toBeTruthy();
      expect(screen.getByText(`Dikelola oleh ${item.agency}`)).toBeTruthy();
      for (const service of item.services) {
        expect(screen.getByText(service)).toBeTruthy();
      }
      expect(
        screen
          .getByRole("link", { name: `Pilih layanan ${item.category}` })
          .getAttribute("href"),
      ).toBe(item.href);
    }

    expect(
      screen
        .getByRole("link", { name: "Lihat pengajuan saya" })
        .getAttribute("href"),
    ).toBe("/citizen/service");
  });
});