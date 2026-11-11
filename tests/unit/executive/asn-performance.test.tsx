// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExecutiveAsnPerformance } from "@/app/(executive)/executive/asn-performance/_components/executive-asn-performance";

const MOCK_SUMMARY = {
  data: {
    totals: {
      asnCount: 6,
      assignedTasks: 40,
      completedTasks: 40,
      completionRate: null,
      withActivityCount: 6,
      noActivityCount: 0,
    },
    byTaskType: {
      layanan_kesehatan: { assignedTasks: 5, completedTasks: 5, completionRate: null },
      layanan_pendidikan: { assignedTasks: 5, completedTasks: 5, completionRate: null },
      layanan_sosial: { assignedTasks: 5, completedTasks: 5, completionRate: null },
      laporan_warga: { assignedTasks: 5, completedTasks: 5, completionRate: null },
      perizinan: { assignedTasks: 4, completedTasks: 4, completionRate: null },
      submit_cms: { assignedTasks: 6, completedTasks: 6, completionRate: null },
      review_cms: { assignedTasks: 5, completedTasks: 5, completionRate: null },
      review_kyc: { assignedTasks: 5, completedTasks: 5, completionRate: null },
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
      { name: "Eka Wulandari", email: "eka@example.com", opd: "Dinas Kesehatan", position: "Analis", taskBreakdown: { layanan_kesehatan: 1, layanan_pendidikan: 0, layanan_sosial: 0, laporan_warga: 0, perizinan: 0, submit_cms: 1, review_cms: 0, review_kyc: 0 }, completedTasks: 2, assignedTasks: 2 },
      { name: "Dewa Mahendra", email: "dewa@example.com", opd: "Dinas Pendidikan", position: "Staf", taskBreakdown: { layanan_kesehatan: 0, layanan_pendidikan: 1, layanan_sosial: 0, laporan_warga: 0, perizinan: 0, submit_cms: 1, review_cms: 1, review_kyc: 0 }, completedTasks: 3, assignedTasks: 3 },
      { name: "Citra Larasati", email: "citra@example.com", opd: "Dinas Sosial", position: "Analis", taskBreakdown: { layanan_kesehatan: 0, layanan_pendidikan: 0, layanan_sosial: 1, laporan_warga: 1, perizinan: 0, submit_cms: 1, review_cms: 0, review_kyc: 1 }, completedTasks: 4, assignedTasks: 4 },
    ],
  },
};

const MOCK_DETAILS = {
  data: {
    items: [
      { userId: "u1", name: "Eka Wulandari", email: "eka@example.com", nip: "1", opd: "Dinas Kesehatan", unit: null, position: "Analis", roles: ["Operator"], assignedTasks: 2, completedTasks: 2, completionRate: null, taskBreakdown: { layanan_kesehatan: 1, layanan_pendidikan: 0, layanan_sosial: 0, laporan_warga: 0, perizinan: 0, submit_cms: 1, review_cms: 0, review_kyc: 0 }, statusLabel: "Aktivitas tercatat" },
      { userId: "u2", name: "Dewa Mahendra", email: "dewa@example.com", nip: "2", opd: "Dinas Pendidikan", unit: null, position: "Staf", roles: ["Admin"], assignedTasks: 3, completedTasks: 3, completionRate: null, taskBreakdown: { layanan_kesehatan: 0, layanan_pendidikan: 1, layanan_sosial: 0, laporan_warga: 0, perizinan: 0, submit_cms: 1, review_cms: 1, review_kyc: 0 }, statusLabel: "Aktivitas tercatat" },
      { userId: "u3", name: "Citra Larasati", email: "citra@example.com", nip: "3", opd: "Dinas Sosial", unit: null, position: "Analis", roles: ["Verifikator"], assignedTasks: 4, completedTasks: 4, completionRate: null, taskBreakdown: { layanan_kesehatan: 0, layanan_pendidikan: 0, layanan_sosial: 1, laporan_warga: 1, perizinan: 0, submit_cms: 1, review_cms: 0, review_kyc: 1 }, statusLabel: "Aktivitas tercatat" },
      { userId: "u4", name: "Bima Santosa", email: "bima@example.com", nip: "4", opd: "Dinas Perizinan", unit: null, position: "Staf", roles: ["ASN"], assignedTasks: 9, completedTasks: 9, completionRate: null, taskBreakdown: { layanan_kesehatan: 1, layanan_pendidikan: 1, layanan_sosial: 1, laporan_warga: 1, perizinan: 2, submit_cms: 1, review_cms: 1, review_kyc: 1 }, statusLabel: "Aktivitas tercatat" },
      { userId: "u5", name: "Aditya Nugraha", email: "aditya@example.com", nip: "5", opd: "Sekretariat", unit: null, position: "Kepala", roles: ["Superadmin"], assignedTasks: 11, completedTasks: 11, completionRate: null, taskBreakdown: { layanan_kesehatan: 2, layanan_pendidikan: 2, layanan_sosial: 1, laporan_warga: 1, perizinan: 1, submit_cms: 1, review_cms: 2, review_kyc: 1 }, statusLabel: "Aktivitas tercatat" },
      { userId: "u6", name: "Farah Anindita", email: "farah@example.com", nip: "6", opd: "Bagian Umum", unit: null, position: "Staf", roles: ["Operator"], assignedTasks: 11, completedTasks: 11, completionRate: null, taskBreakdown: { layanan_kesehatan: 1, layanan_pendidikan: 1, layanan_sosial: 2, laporan_warga: 2, perizinan: 1, submit_cms: 1, review_cms: 1, review_kyc: 2 }, statusLabel: "Aktivitas tercatat" },
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
    await waitFor(() => expect(screen.getAllByText("Aktivitas tercatat").length).toBeGreaterThan(0));
    expect(screen.getByText("Petugas beraktivitas")).toBeTruthy();
    expect(screen.getByText("Submit dan review")).toBeTruthy();
    expect(screen.getByText("Akses dan keputusan")).toBeTruthy();
  });

  it("renders metric cards and details matching illustrative dataset", async () => {
    render(<ExecutiveAsnPerformance />);

    await waitFor(() => expect(screen.getByText("40")).toBeTruthy());
    expect(screen.getAllByText("6").length).toBeGreaterThan(0);
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

  it("renders activity charts without inferring completion from activity events", async () => {
    render(<ExecutiveAsnPerformance />);

    await waitFor(() => expect(screen.getByText("Tren aktivitas")).toBeTruthy());
    expect(screen.getByText("Aktivitas terendah")).toBeTruthy();
    expect(screen.queryByText(/Tingkat penyelesaian/)).toBeNull();
    expect(screen.queryByText(/Perlu tindak lanjut/)).toBeNull();
  });

  it("handles filter changes and reset", () => {
    render(<ExecutiveAsnPerformance />);

    const resetButton = screen.getByRole("button", { name: "Atur ulang" });
    fireEvent.click(resetButton);

    expect(screen.getByText("Cakupan analisis")).toBeTruthy();
  });
});
