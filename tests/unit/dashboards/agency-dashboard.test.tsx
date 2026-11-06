/** @vitest-environment jsdom */

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AgencyDashboard } from "@/app/(asn)/asn/dashboard/_components/agency-dashboard";
import {
  maskApplicantName,
  maskEmail,
  maskPhone,
} from "@/app/(asn)/asn/dashboard/_components/agency-dashboard-data";

const report = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Jalan berlubang di Jalan Melati",
  description:
    "Jalan berlubang cukup besar dan sudah beberapa kali menyebabkan pengendara hampir terjatuh.",
  category: "Infrastruktur",
  status: "submitted",
  submittedAt: "2026-10-27T08:15:00.000Z",
  responseDueAt: "2026-10-30T08:15:00.000Z",
  reportNumber: "LP-20261027-ABC123",
  subcategory: "Jalan rusak",
  province: "Jawa Barat",
  city: "Kota Bandung",
  address: "Jl. Melati",
  reporterName: "Siti Contoh",
  reporterEmail: "siti@example.com",
  reporterPhone: "081234567890",
  isPublic: true,
  showIdentity: true,
  attachments: ["jalan.jpg"],
};

function mockReports(reports = [report]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reports }),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("agency report privacy helpers", () => {
  it("masks phone numbers and emails while retaining limited identifying information", () => {
    expect(maskPhone("081234567890")).toBe("••••••••7890");
    expect(maskEmail("siti@example.com")).toBe("s***@example.com");
    expect(maskApplicantName("Siti Contoh")).toBe("Siti C***");
  });

  it("does not imply an anonymous report has a name", () => {
    expect(maskApplicantName("Pelapor anonim")).toBe("Pelapor anonim");
  });
});

describe("AgencyDashboard", () => {
  it("loads persisted reports and masks identifying details in the list", async () => {
    mockReports();
    render(<AgencyDashboard />);

    const table = await screen.findByRole("table", {
      name: "Daftar laporan tersimpan",
    });
    expect(within(table).getByText("LP-20261027-ABC123")).toBeTruthy();
    expect(
      within(table).getByText("Jalan berlubang di Jalan Melati"),
    ).toBeTruthy();
    expect(within(table).getByText("Siti C***")).toBeTruthy();
    expect(within(table).queryByText("081234567890")).toBeNull();
    expect(screen.getByText("Total laporan masuk")).toBeTruthy();
  });

  it("filters persisted reports by title, status, and category", async () => {
    mockReports([
      report,
      {
        ...report,
        id: "22222222-2222-4222-8222-222222222222",
        title: "Sampah menumpuk",
        category: "Lingkungan",
        status: "in_progress",
        reportNumber: "LP-20261026-DEF456",
        subcategory: "Sampah menumpuk",
      },
    ]);
    render(<AgencyDashboard />);

    const table = await screen.findByRole("table", {
      name: "Daftar laporan tersimpan",
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Cari nomor laporan atau judul" }),
      {
        target: { value: "Sampah" },
      },
    );
    expect(within(table).getByText("Sampah menumpuk")).toBeTruthy();
    expect(
      within(table).queryByText("Jalan berlubang di Jalan Melati"),
    ).toBeNull();

    fireEvent.change(
      screen.getByRole("textbox", { name: "Cari nomor laporan atau judul" }),
      {
        target: { value: "" },
      },
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter kategori" }),
      {
        target: { value: "Infrastruktur" },
      },
    );
    expect(
      within(table).getByText("Jalan berlubang di Jalan Melati"),
    ).toBeTruthy();
    expect(within(table).queryByText("Sampah menumpuk")).toBeNull();
  });

  it("shows report details with masked contact data until explicitly revealed", async () => {
    mockReports();
    render(<AgencyDashboard />);
    await screen.findByText("LP-20261027-ABC123");
    fireEvent.click(
      screen.getByRole("button", { name: "Lihat detail LP-20261027-ABC123" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Detail laporan" });
    expect(within(dialog).getByText("Siti C***")).toBeTruthy();
    expect(within(dialog).getByText("s***@example.com")).toBeTruthy();
    expect(within(dialog).getByText("••••••••7890")).toBeTruthy();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Tampilkan data pelapor" }),
    );
    expect(within(dialog).getByText("siti@example.com")).toBeTruthy();
    expect(within(dialog).getByText("081234567890")).toBeTruthy();
    expect(
      within(dialog).getByText("Jl. Melati, Kota Bandung, Jawa Barat"),
    ).toBeTruthy();
    expect(within(dialog).getByText("jalan.jpg")).toBeTruthy();
  });

  it("shows backend errors rather than presenting a success-shaped empty state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Gagal memuat laporan dari basis data." }),
      }),
    );
    render(<AgencyDashboard />);
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "Gagal memuat laporan dari basis data.",
      );
    });
  });
});
