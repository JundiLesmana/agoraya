import type * as NextNavigation from "next/navigation";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", async () => {
  const actual: typeof NextNavigation = await vi.importActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: navigation.push,
      replace: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    }),
  };
});

import { CitizenTrackingDashboard } from "@/app/(citizen)/citizen/service/_components/citizen-tracking-dashboard";
import CitizenTrackingPage from "@/app/(citizen)/citizen/service/page";
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
    payload: {
      description: "Permohonan pencairan bantuan sosial untuk keluarga terdampak.",
    },
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
    navigation.push.mockReset();
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
    expect(screen.getAllByLabelText("Detail Pengajuan Terpilih").length).toBeGreaterThan(0);
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
      screen.getAllByLabelText("Detail Pengajuan Terpilih")[0]?.textContent,
    ).toContain("Lampu jalan padam di Jl. Melati");
  });

  it("opens the submission detail route from the list CTA", async () => {
    mockServiceApplicationsFetch();
    render(<CitizenTrackingDashboard />);

    await waitFor(() =>
      expect(
        screen.getByRole("table", { name: "Daftar pengajuan layanan warga" }),
      ).toBeTruthy(),
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Lihat detail" })[0]);

    expect(navigation.push).toHaveBeenCalledWith("/citizen/service/app-1");
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

  it("accepts a resolution review with rating and feedback, then closes the submission", async () => {
    mockServiceApplicationsFetch();
    render(<CitizenTrackingDashboard />);

    await waitFor(() =>
      expect(
        screen.getByRole("table", { name: "Daftar pengajuan layanan warga" }),
      ).toBeTruthy(),
    );

    fireEvent.click(screen.getByText("Pencairan Bantuan Sosial"));
    const detailsCard = screen.getAllByLabelText("Detail Pengajuan Terpilih")[0];
    expect(detailsCard).toBeTruthy();
    if (!detailsCard) throw new Error("Selected details card was not rendered");

    const reviewSection = within(detailsCard)
      .getByRole("heading", { name: "Tinjau Resolusi" })
      .closest("section");
    expect(reviewSection).toBeTruthy();
    if (!reviewSection) throw new Error("Review section was not rendered");

    expect(within(reviewSection).getByText("Permintaan Asli")).toBeTruthy();
    expect(within(reviewSection).getByText("Resolusi Instansi")).toBeTruthy();
    expect(within(reviewSection).getByText("Bukti Tindak Lanjut")).toBeTruthy();

    fireEvent.click(
      within(reviewSection).getByRole("button", { name: "Terima & Beri Umpan Balik" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Terima & Beri Umpan Balik" });
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Rating layanan" }), {
      target: { value: "4" },
    });
    fireEvent.change(within(dialog).getByLabelText("Komentar (opsional)"), {
      target: { value: "Penanganan sudah jelas dan cepat." },
    });
    const acceptForm = within(dialog).getByLabelText("Komentar (opsional)").closest("form");
    expect(acceptForm).toBeTruthy();
    if (!acceptForm) throw new Error("Accept review form was not rendered");
    fireEvent.submit(acceptForm);

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("Resolusi diterima"),
    );
    expect(screen.getAllByText("Selesai (Ditutup)").length).toBeGreaterThan(0);
    expect(screen.getByText(/Rating: 4 \/ 5/)).toBeTruthy();
    expect(screen.getAllByText(/Penanganan sudah jelas dan cepat/).length).toBeGreaterThan(0);
    expect(screen.getByText("Warga menerima resolusi")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Tolak & Minta Revisi" })).toBeNull();
  });

  it("requires a reason when requesting a revision and records it in the timeline", async () => {
    mockServiceApplicationsFetch();
    render(<CitizenTrackingDashboard />);

    await waitFor(() =>
      expect(
        screen.getByRole("table", { name: "Daftar pengajuan layanan warga" }),
      ).toBeTruthy(),
    );

    fireEvent.click(screen.getByText("Pencairan Bantuan Sosial"));
    const detailsCard = screen.getAllByLabelText("Detail Pengajuan Terpilih")[0];
    expect(detailsCard).toBeTruthy();
    if (!detailsCard) throw new Error("Selected details card was not rendered");

    const reviewSection = within(detailsCard)
      .getByRole("heading", { name: "Tinjau Resolusi" })
      .closest("section");
    expect(reviewSection).toBeTruthy();
    if (!reviewSection) throw new Error("Review section was not rendered");

    fireEvent.click(
      within(reviewSection).getByRole("button", { name: "Tolak & Minta Revisi" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Tolak & Minta Revisi" });
    const submitButton = within(dialog).getByRole("button", { name: "Kirim permintaan revisi" });
    expect(submitButton.getAttribute("disabled")).not.toBeNull();

    fireEvent.change(within(dialog).getByLabelText("Alasan revisi"), {
      target: { value: "Bukti PDF belum menjelaskan hasil akhir di lapangan." },
    });
    expect(submitButton.getAttribute("disabled")).toBeNull();
    const revisionForm = within(dialog).getByLabelText("Alasan revisi").closest("form");
    expect(revisionForm).toBeTruthy();
    if (!revisionForm) throw new Error("Revision request form was not rendered");
    fireEvent.submit(revisionForm);

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("Permintaan revisi dicatat"),
    );
    expect(screen.getByText("Revisi telah diminta")).toBeTruthy();
    expect(
      screen.getAllByText(/Bukti PDF belum menjelaskan hasil akhir di lapangan/).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Warga meminta revisi")).toBeTruthy();
  });

});