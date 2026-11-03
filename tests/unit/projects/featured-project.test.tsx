// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  buildFeaturedProjectReport,
  FeaturedProject,
  formatRupiahCompact,
  getRealizationPercentage,
} from "@/app/(public)/data-pemerintah/proyek/_components/featured-project";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("FeaturedProject formatting and report", () => {
  it("formats the featured budget and realization as compact Rupiah values", () => {
    expect(formatRupiahCompact(80_000_000_000)).toBe("Rp80 M");
    expect(formatRupiahCompact(60_000_000_000)).toBe("Rp60 M");
    expect(getRealizationPercentage(60_000_000_000, 80_000_000_000)).toBe(75);
  });

  it("includes project and milestone data in the CSV report", () => {
    const report = buildFeaturedProjectReport();

    expect(report).toContain('"nama_proyek","lokasi","sektor","instansi"');
    expect(report).toContain(
      '"Rehabilitasi 12 sekolah","Kab. Bogor","Pendidikan","Dinas Pendidikan"',
    );
    expect(report).toContain(
      '"Perencanaan selesai","31 Jan 2025","Rencana dan lingkup disetujui"',
    );
    expect(report).toContain(
      '"9 dari 12 sekolah selesai","30 Sep 2025","3 sekolah masih dikerjakan"',
    );
    expect(report).toContain(
      '"Target selesai","31 Des 2025","Penyelesaian seluruh sekolah"',
    );
  });
});

describe("FeaturedProject card", () => {
  it("shows project context, budget progress, accessible timeline, and update date", () => {
    render(<FeaturedProject />);

    expect(screen.getByText("SOROTAN PROYEK")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Rehabilitasi 12 sekolah" }),
    ).toBeTruthy();
    expect(
      screen.getByText("Kab. Bogor - Pendidikan - Dinas Pendidikan"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Perbaikan ruang kelas dan sanitasi pada 12 sekolah di Kabupaten Bogor. Target penerima manfaat: 3.000 siswa",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Rp80 M")).toBeTruthy();
    expect(screen.getByText("Rp60 M · 75%")).toBeTruthy();
    expect(
      screen
        .getByRole("progressbar", { name: "Progres fisik proyek" })
        .getAttribute("aria-valuenow"),
    ).toBe("75");
    expect(
      screen.getByRole("list", { name: "Timeline tahapan pelaksanaan proyek" }),
    ).toBeTruthy();
    expect(screen.getByText("Pembaruan 30 September 2025")).toBeTruthy();
    expect(document.querySelector('[data-source="SIMULATED"]')).toBeTruthy();
  });

  it("opens the project detail dialog", () => {
    render(<FeaturedProject />);

    fireEvent.click(
      screen.getByRole("button", { name: /lihat detail proyek/i }),
    );

    expect(
      screen.getByRole("dialog", { name: "Rehabilitasi 12 sekolah" }),
    ).toBeTruthy();
    expect(screen.getByText("Target penerima manfaat")).toBeTruthy();
    expect(screen.getByText("3.000 siswa")).toBeTruthy();
  });

  it("downloads the CSV project report", () => {
    const createObjectURL = vi
      .fn<(blob: Blob) => string>()
      .mockReturnValue("blob:project-report");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    let downloadedFileName: string | undefined;
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadedFileName = this.download;
      });

    render(<FeaturedProject />);
    fireEvent.click(screen.getByRole("button", { name: /unduh laporan/i }));

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(click).toHaveBeenCalledOnce();
    expect(downloadedFileName).toBe("laporan-rehabilitasi-12-sekolah.csv");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:project-report");
  });
});
