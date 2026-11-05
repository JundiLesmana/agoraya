// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExecutiveAsnPerformance } from "@/app/(executive)/executive/asn-performance/_components/executive-asn-performance";

const MOCK_SUMMARY = {
  data: {
    totals: {
      asnCount: 6,
      assignedTasks: 66,
      completedTasks: 40,
      completionRate: 0.606,
    },
    byTaskType: {
      layanan_kesehatan: { assignedTasks: 8, completedTasks: 5, completionRate: 0.625 },
      layanan_pendidikan: { assignedTasks: 8, completedTasks: 5, completionRate: 0.625 },
      layanan_sosial: { assignedTasks: 8, completedTasks: 5, completionRate: 0.625 },
      laporan_warga: { assignedTasks: 8, completedTasks: 5, completionRate: 0.625 },
      perizinan: { assignedTasks: 8, completedTasks: 5, completionRate: 0.625 },
      submit_cms: { assignedTasks: 10, completedTasks: 6, completionRate: 0.6 },
      review_cms: { assignedTasks: 8, completedTasks: 5, completionRate: 0.625 },
      review_kyc: { assignedTasks: 8, completedTasks: 4, completionRate: 0.5 },
    },
  },
};

const MOCK_TRENDS = {
  data: {
    items: [
      { periodStart: "2026-10-01", totalCompleted: 8, taskBreakdown: { layanan_kesehatan: 1, layanan_pendidikan: 1, layanan_sosial: 1, laporan_warga: 1, perizinan: 1, submit_cms: 1, review_cms: 1, review_kyc: 1 } },
      { periodStart: "2026-10-08", totalCompleted: 10, taskBreakdown: { layanan_kesehatan: 1, layanan_pendidikan: 1, layanan_sosial: 2, laporan_warga: 1, perizinan: 1, submit_cms: 2, review_cms: 1, review_kyc: 1 } },
      { periodStart: "2026-10-15", totalCompleted: 12, taskBreakdown: { layanan_kesehatan: 2, layanan_pendidikan: 1, layanan_sosial: 1, laporan_warga: 2, perizinan: 1, submit_cms: 2, review_cms: 2, review_kyc: 1 } },
      { periodStart: "2026-10-22", totalCompleted: 10, taskBreakdown: { layanan_kesehatan: 1, layanan_pendidikan: 2, layanan_sosial: 1, laporan_warga: 1, perizinan: 2, submit_cms: 1, review_cms: 1, review_kyc: 1 } },
    ],
  },
};

const MOCK_LOWEST = {
  data: {
    items: [
      { name: "Eka Wulandari", email: "eka@example.com", opd: "Dinas Kesehatan", position: "Analis", taskBreakdown: { layanan_kesehatan: 1, layanan_pendidikan: 0, layanan_sosial: 0, laporan_warga: 0, perizinan: 0, submit_cms: 1, review_cms: 0, review_kyc: 0 }, completedTasks: 2, assignedTasks: 8 },
      { name: "Dewa Mahendra", email: "dewa@example.com", opd: "Dinas Pendidikan", position: "Staf", taskBreakdown: { layanan_kesehatan: 0, layanan_pendidikan: 1, layanan_sosial: 0, laporan_warga: 0, perizinan: 0, submit_cms: 1, review_cms: 1, review_kyc: 0 }, completedTasks: 3, assignedTasks: 8 },
      { name: "Citra Larasati", email: "citra@example.com", opd: "Dinas Sosial", position: "Analis", taskBreakdown: { layanan_kesehatan: 0, layanan_pendidikan: 0, layanan_sosial: 1, laporan_warga: 1, perizinan: 0, submit_cms: 1, review_cms: 0, review_kyc: 1 }, completedTasks: 4, assignedTasks: 8 },
    ],
  },
};

const MOCK_DETAILS = {
  data: {
    items: [
      { userId: "u1", name: "Eka Wulandari", email: "eka@example.com", nip: "1", opd: "Dinas Kesehatan", unit: null, position: "Analis", assignedTasks: 8, completedTasks: 2, completionRate: 0.25, taskBreakdown: { layanan_kesehatan: 1, layanan_pendidikan: 0, layanan_sosial: 0, laporan_warga: 0, perizinan: 0, submit_cms: 1, review_cms: 0, review_kyc: 0 }, statusLabel: "Perlu perhatian" },
      { userId: "u2", name: "Dewa Mahendra", email: "dewa@example.com", nip: "2", opd: "Dinas Pendidikan", unit: null, position: "Staf", assignedTasks: 8, completedTasks: 3, completionRate: 0.375, taskBreakdown: { layanan_kesehatan: 0, layanan_pendidikan: 1, layanan_sosial: 0, laporan_warga: 0, perizinan: 0, submit_cms: 1, review_cms: 1, review_kyc: 0 }, statusLabel: "Perlu perhatian" },
      { userId: "u3", name: "Citra Larasati", email: "citra@example.com", nip: "3", opd: "Dinas Sosial", unit: null, position: "Analis", assignedTasks: 8, completedTasks: 4, completionRate: 0.5, taskBreakdown: { layanan_kesehatan: 0, layanan_pendidikan: 0, layanan_sosial: 1, laporan_warga: 1, perizinan: 0, submit_cms: 1, review_cms: 0, review_kyc: 1 }, statusLabel: "Cukup" },
      { userId: "u4", name: "Bima Santosa", email: "bima@example.com", nip: "4", opd: "Dinas Perizinan", unit: null, position: "Staf", assignedTasks: 14, completedTasks: 9, completionRate: 0.643, taskBreakdown: { layanan_kesehatan: 1, layanan_pendidikan: 1, layanan_sosial: 1, laporan_warga: 1, perizinan: 2, submit_cms: 1, review_cms: 1, review_kyc: 1 }, statusLabel: "Baik" },
      { userId: "u5", name: "Aditya Nugraha", email: "aditya@example.com", nip: "5", opd: "Sekretariat", unit: null, position: "Kepala", assignedTasks: 14, completedTasks: 11, completionRate: 0.786, taskBreakdown: { layanan_kesehatan: 2, layanan_pendidikan: 2, layanan_sosial: 1, laporan_warga: 1, perizinan: 1, submit_cms: 1, review_cms: 2, review_kyc: 1 }, statusLabel: "Baik" },
      { userId: "u6", name: "Farah Anindita", email: "farah@example.com", nip: "6", opd: "Bagian Umum", unit: null, position: "Staf", assignedTasks: 14, completedTasks: 11, completionRate: 0.786, taskBreakdown: { layanan_kesehatan: 1, layanan_pendidikan: 1, layanan_sosial: 2, laporan_warga: 2, perizinan: 1, submit_cms: 1, review_cms: 1, review_kyc: 2 }, statusLabel: "Baik" },
    ],
  },
};

function mockFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    let body: unknown = { data: {} };
    if (url.includes("/api/v1/user/me")) body = { data: { name: "Admin", email: "admin@example.com", roles: ["admin"] } };
    else if (url.includes("/asn-performance/summary")) body = MOCK_SUMMARY;
    else if (url.includes("/asn-performance/trends")) body = MOCK_TRENDS;
    else if (url.includes("/asn-performance/lowest-activity")) body = MOCK_LOWEST;
    else if (url.includes("/asn-performance/details")) body = MOCK_DETAILS;
    return { ok: true, json: async () => body, blob: async () => new Blob() } as Response;
  });
}

describe("ExecutiveAsnPerformance Component", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it("renders page header and scope analysis correctly", async () => {
    render(<ExecutiveAsnPerformance />);

    expect(screen.getByRole("heading", { level: 1, name: "Kinerja ASN" })).toBeTruthy();
    expect(screen.getByText("Cakupan analisis")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("Tugas ditugaskan")).toBeTruthy());
    expect(screen.getByText("Total selesai")).toBeTruthy();
    expect(screen.getByText("Tingkat penyelesaian")).toBeTruthy();
    expect(screen.getByText("Tugas tertunda")).toBeTruthy();
  });

  it("renders metric cards and details matching illustrative dataset", async () => {
    render(<ExecutiveAsnPerformance />);

    await waitFor(() => expect(screen.getByText("66")).toBeTruthy());
    expect(screen.getByText("40")).toBeTruthy();
    expect(screen.getByText("60,6%")).toBeTruthy();
    expect(screen.getByText("26")).toBeTruthy();
  });

  it("renders ASN performance details table and rows", async () => {
    render(<ExecutiveAsnPerformance />);

    await waitFor(() => expect(screen.getByText("Eka Wulandari")).toBeTruthy());
    expect(screen.getByText("Dewa Mahendra")).toBeTruthy();
    expect(screen.getByText("Citra Larasati")).toBeTruthy();
    expect(screen.getByText("Bima Santosa")).toBeTruthy();
    expect(screen.getByText("Aditya Nugraha")).toBeTruthy();
    expect(screen.getByText("Farah Anindita")).toBeTruthy();
  });

  it("renders charts and action needed notice", async () => {
    render(<ExecutiveAsnPerformance />);

    await waitFor(() => expect(screen.getByText("Tren penyelesaian tugas")).toBeTruthy());
    expect(screen.getByText("Aktivitas terendah")).toBeTruthy();
    expect(screen.getByText(/Perlu tindak lanjut/)).toBeTruthy();
  });

  it("handles filter changes and reset", () => {
    render(<ExecutiveAsnPerformance />);

    const resetButton = screen.getByRole("button", { name: "Atur ulang" });
    fireEvent.click(resetButton);

    expect(screen.getByText("Cakupan analisis")).toBeTruthy();
  });
});
