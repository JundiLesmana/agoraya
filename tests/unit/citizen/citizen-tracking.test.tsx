import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { CitizenTrackingDashboard } from "@/app/(citizen)/citizen/service/_components/citizen-tracking-dashboard";
import CitizenTrackingPage from "@/app/(citizen)/citizen/service/page";
import { ServiceSpaceNavigation } from "@/components/service-space-navigation";
import {
  formatDateTimeWib,
  getDaysUntilDeadline,
} from "@/app/(citizen)/citizen/service/_components/tracking-format";

const TEST_APPLICATIONS = [
  {
    id: "app-1",
    trackingNumber: "PGD-261010-00001",
    category: "social",
    serviceType: "kebersihan",
    serviceId: "svc-1",
    routeKey: "sosial-kesehatan",
    serviceName: "Lampu jalan padam di Jl. Melati",
    agency: "Dinas Pekerjaan Umum",
    status: "in_progress",
    applicantName: "Warga Contoh",
    contactEmail: "warga@example.com",
    payload: {},
    submittedAt: "2026-10-10T08:00:00.000Z",
    updatedAt: "2026-10-11T08:00:00.000Z",
  },
  {
    id: "app-2",
    trackingNumber: "BSL-261010-00051",
    category: "social",
    serviceType: "pendidikan",
    serviceId: "svc-2",
    routeKey: "sosial-pendidikan",
    serviceName: "Pengajuan pendidikan",
    agency: "Dinas Pendidikan",
    status: "verified",
    applicantName: "Warga Contoh 2",
    contactEmail: "warga2@example.com",
    payload: {},
    submittedAt: "2026-10-09T08:00:00.000Z",
    updatedAt: "2026-10-10T08:00:00.000Z",
  },
  {
    id: "app-3",
    trackingNumber: "PGD-261010-00003",
    category: "permit",
    serviceType: "izin",
    serviceId: "svc-3",
    routeKey: "perizinan-kesehatan",
    serviceName: "Pencairan Bantuan Sosial",
    agency: "Dinas Sosial",
    status: "resolved",
    applicantName: "Warga Contoh 3",
    contactEmail: "warga3@example.com",
    payload: {},
    submittedAt: "2026-10-08T08:00:00.000Z",
    updatedAt: "2026-10-09T08:00:00.000Z",
  },
];

function mockServiceApplicationsFetch() {
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json({ applications: TEST_APPLICATIONS }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

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
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("serves the tracking dashboard at the /tracking route", async () => {
    mockServiceApplicationsFetch();
    render(<CitizenTrackingPage />);

    await waitFor(() =>
      expect(
        screen.getByRole("table", { name: "Daftar pengajuan layanan warga" }),
      ).toBeTruthy(),
    );
    expect(
      screen.getByRole("textbox", { name: "Cari nomor pelacakan" }),
    ).toBeTruthy();
  });

  it("renders the four summary cards, service table, education, and selected details", async () => {
    mockServiceApplicationsFetch();
    render(<CitizenTrackingDashboard />);

    await waitFor(() =>
      expect(
        screen.getByRole("table", { name: "Daftar pengajuan layanan warga" }),
      ).toBeTruthy(),
    );

    const heroTitle = screen.getByRole("heading", { name: "Ruang Warga" });
    expect(heroTitle).toBeTruthy();
    expect(heroTitle.closest(".hero-enter")).toBeTruthy();
    expect(screen.getByText("Total pengajuan")).toBeTruthy();
    expect(screen.getAllByText("Sedang diproses").length).toBeGreaterThan(0);
    expect(screen.getByText("Perlu tindakan")).toBeTruthy();
    expect(screen.getAllByText("Selesai").length).toBeGreaterThan(0);
    expect(screen.queryByText("Contoh data warga")).toBeNull();
    expect(screen.queryByText("Data simulasi")).toBeNull();
    expect(screen.queryByText("Simulasi", { exact: true })).toBeNull();
    expect(screen.queryByText(/data contoh milik akun Anda/)).toBeNull();
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
    ).toBe("/citizen/service");
    expect(
      within(spaceNavigation).queryByRole("link", { name: "Ruang Instansi" }),
    ).toBeNull();
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
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb.textContent).toContain(
      "Beranda > Layanan Publik > Ruang Warga",
    );
    const currentBreadcrumb = within(breadcrumb).getByText("Ruang Warga");
    expect(currentBreadcrumb.getAttribute("aria-current")).toBe("page");
    expect(currentBreadcrumb.className).toContain("text-primary");
  });

  it("validates tracking number format and finds a matching application", async () => {
    mockServiceApplicationsFetch();
    render(<CitizenTrackingDashboard />);

    await waitFor(() =>
      expect(
        screen.getByRole("table", { name: "Daftar pengajuan layanan warga" }),
      ).toBeTruthy(),
    );

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
    expect(screen.getAllByText("Pengajuan pendidikan").length).toBeGreaterThan(
      0,
    );
  });

  it("keeps the selected details when category and status filters change", async () => {
    mockServiceApplicationsFetch();
    render(<CitizenTrackingDashboard />);

    await waitFor(() =>
      expect(
        screen.getByRole("table", { name: "Daftar pengajuan layanan warga" }),
      ).toBeTruthy(),
    );

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
    expect(within(table).getByText("Pengajuan pendidikan")).toBeTruthy();
    expect(
      within(table).queryByText("Lampu jalan padam di Jl. Melati"),
    ).toBeNull();
    expect(
      screen.getByLabelText("Detail Pengajuan Terpilih").textContent,
    ).toContain("Lampu jalan padam di Jl. Melati");
  });

  it("provides a local-only document action without pretending to upload a file", async () => {
    mockServiceApplicationsFetch();
    render(<CitizenTrackingDashboard />);

    await waitFor(() =>
      expect(
        screen.getByRole("table", { name: "Daftar pengajuan layanan warga" }),
      ).toBeTruthy(),
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: /Buka & lengkapi dokumen/ })[0],
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

  it("links the agency service room to the dashboard route", () => {
    render(<ServiceSpaceNavigation activeSpace="agency" />);
    const spaceNavigation = screen.getByRole("navigation", {
      name: "Kategori layanan publik",
    });
    expect(
      within(spaceNavigation)
        .getByRole("link", { name: "Ruang Instansi" })
        .getAttribute("href"),
    ).toBe("/asn/dashboard");
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
