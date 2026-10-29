import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CitizenTrackingDashboard } from "@/app/(citizen)/tracking/_components/citizen-tracking-dashboard";
import CitizenTrackingPage from "@/app/(citizen)/tracking/page";
import AsnReportingPage from "@/app/(asn)/asn/reporting/page";
import {
  formatDateTimeWib,
  getDaysUntilDeadline,
} from "@/app/(citizen)/tracking/_components/tracking-format";

describe("tracking date helpers", () => {
  it("formats date and time in WIB", () => {
    expect(formatDateTimeWib("2026-10-12T02:15:00.000Z")).toContain("09.15");
    expect(formatDateTimeWib("2026-10-12T02:15:00.000Z")).toContain("Okt 2026");
  });

  it("calculates the remaining calendar days using the WIB date", () => {
    const now = new Date("2026-10-12T04:00:00.000Z");
    expect(getDaysUntilDeadline("2026-10-13T16:59:00.000Z", now)).toBe(1);
    expect(getDaysUntilDeadline("2026-10-12T04:00:00.000Z", now)).toBe(0);
    expect(getDaysUntilDeadline("2026-10-11T16:59:00.000Z", now)).toBe(-1);
  });
});

describe("CitizenTrackingDashboard", () => {
  it("serves the tracking dashboard at the /tracking route", () => {
    render(<CitizenTrackingPage />);

    expect(
      screen.getByRole("table", { name: "Daftar pengajuan layanan warga" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: "Cari nomor pelacakan" }),
    ).toBeTruthy();
  });

  it("renders the four summary cards, service table, education, and selected details", () => {
    render(<CitizenTrackingDashboard />);

    expect(screen.getByRole("heading", { name: "Ruang Warga" })).toBeTruthy();
    expect(screen.getByText("Total pengajuan")).toBeTruthy();
    expect(screen.getAllByText("Sedang diproses").length).toBeGreaterThan(0);
    expect(screen.getByText("Perlu tindakan")).toBeTruthy();
    expect(screen.getAllByText("Selesai").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("table", { name: "Daftar pengajuan layanan warga" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Detail Pengajuan Terpilih")).toBeTruthy();
    const spaceNavigation = screen.getByRole("navigation", {
      name: "Kategori layanan publik",
    });
    expect(
      within(spaceNavigation)
        .getByRole("link", { name: "Ruang Warga" })
        .getAttribute("href"),
    ).toBe("/tracking");
    expect(
      within(spaceNavigation)
        .getByRole("link", { name: "Ruang Instansi" })
        .getAttribute("href"),
    ).toBe("/asn/reporting");
    expect(
      within(spaceNavigation)
        .getByRole("link", { name: "Ruang Statistik" })
        .getAttribute("href"),
    ).toBe("/tracking/stat");
    expect(
      within(spaceNavigation)
        .getByRole("link", { name: "Ruang Statistik" })
        .getAttribute("aria-current"),
    ).toBeNull();
    expect(
      within(spaceNavigation)
        .getByRole("link", { name: "Ruang Warga" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen.getByRole("heading", {
        name: "Layanan jelas, langkah lebih mudah",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }).textContent,
    ).toContain("Beranda > Layanan Publik > Pelacakan");
  });

  it("validates tracking number format and finds a matching application", () => {
    render(<CitizenTrackingDashboard />);
    const trackingInput = screen.getByRole("textbox", {
      name: "Cari nomor pelacakan",
    });
    const form = trackingInput.closest("form");
    if (!form) throw new Error("Tracking input form was not rendered");

    fireEvent.change(trackingInput, { target: { value: "tidak-valid" } });
    fireEvent.submit(form);
    expect(screen.getByRole("alert").textContent).toContain(
      "Format nomor tidak sesuai",
    );

    fireEvent.change(trackingInput, { target: { value: "bsl-261010-00051" } });
    fireEvent.submit(form);
    expect(screen.getByRole("dialog").textContent).toContain(
      "Pengajuan pendidikan",
    );
    fireEvent.click(screen.getByRole("button", { name: "Tutup dialog" }));
    expect(screen.getByRole("status").textContent).toContain(
      "BSL-261010-00051 ditemukan",
    );
    expect(
      screen.getAllByText("Pengajuan pendidikan").length,
    ).toBeGreaterThan(0);
  });

  it("keeps the selected details when category and status filters change", () => {
    render(<CitizenTrackingDashboard />);

    fireEvent.change(
      screen.getByRole("combobox", { name: "Kategori layanan" }),
      {
        target: { value: "Sosial" },
      },
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Status pengajuan" }),
      {
        target: { value: "Diverifikasi" },
      },
    );

    const table = screen.getByRole("table", {
      name: "Daftar pengajuan layanan warga",
    });
    expect(
      within(table).getByText("Pengajuan pendidikan"),
    ).toBeTruthy();
    expect(
      within(table).queryByText("Lampu jalan padam di Jl. Melati"),
    ).toBeNull();
    expect(
      screen.getByLabelText("Detail Pengajuan Terpilih").textContent,
    ).toContain("Lampu jalan padam di Jl. Melati");
  });

  it("provides a local-only document action without pretending to upload a file", () => {
    render(<CitizenTrackingDashboard />);
    fireEvent.click(
      screen.getByRole("button", { name: /Buka & lengkapi dokumen/ }),
    );

    const dialog = screen.getByRole("dialog", { name: "Lengkapi dokumen" });
    const fileInput = within(dialog).getByLabelText("Dokumen pendukung");
    const file = new File(["demo"], "bukti.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Simpan pilihan (simulasi)" }),
    );

    expect(screen.getByRole("status").textContent).toContain(
      "Berkas belum dikirim",
    );
  });

  it("links the agency service room to its route without offering a statistics room", () => {
    render(<AsnReportingPage />);

    expect(
      screen.getByRole("heading", { name: "Ruang Instansi" }),
    ).toBeTruthy();
    const spaceNavigation = screen.getByRole("navigation", {
      name: "Kategori layanan publik",
    });
    expect(
      within(spaceNavigation)
        .getByRole("link", { name: "Ruang Instansi" })
        .getAttribute("href"),
    ).toBe("/asn/reporting");
    expect(
      within(spaceNavigation)
        .getByRole("link", { name: "Ruang Instansi" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      within(spaceNavigation)
        .getByRole("link", { name: "Ruang Statistik" })
        .getAttribute("href"),
    ).toBe("/data/statistik");
    expect(
      within(spaceNavigation)
        .getByRole("link", { name: "Ruang Statistik" })
        .getAttribute("aria-current"),
    ).toBeNull();
  });
});
