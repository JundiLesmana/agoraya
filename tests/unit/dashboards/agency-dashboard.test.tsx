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
import { SubmissionQueue } from "@/app/(asn)/asn/dashboard/_components/submission-queue";
import {
  formatApplicantQueueLabel,
  getAverageWaitingTimeMinutes,
  getSubmissionQueueStatus,
  maskApplicantName,
  maskEmail,
  maskNik,
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
  reporterEmail: null,
  reporterPhone: null,
  isPublic: true,
  showIdentity: true,
  attachments: ["jalan.jpg"],
};

const serviceApplication = {
  id: "22222222-2222-4222-8222-222222222222",
  trackingNumber: "IZ-20261027-DEF456",
  category: "permit",
  serviceType: "Izin Usaha",
  serviceId: "izin-usaha",
  routeKey: "perizinan/izin-usaha",
  serviceName: "Izin Usaha",
  agency: "Dinas Penanaman Modal",
  status: "submitted",
  applicantName: "Budi Contoh",
  contactEmail: "budi@example.com",
  payload: { data: { alamatUsaha: "Jl. Merdeka" } },
  submittedAt: "2026-10-27T08:15:00.000Z",
  assigneeId: null,
  waitingTimeMinutes: 0,
};

function mockReports(
  reports = [report],
  applications: typeof serviceApplication[] = [],
) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const isServiceApplications = String(input).includes(
        "/api/asn/service-applications",
      );
      return Promise.resolve({
        ok: true,
        json: async () =>
          isServiceApplications ? { applications } : { reports },
      });
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

  it("masks queue applicants and derives queue statuses from workflow state", () => {
    expect(maskNik("3276012309876543")).toBe("••••••••••••6543");
    expect(
      formatApplicantQueueLabel("Siti Contoh", {
        data: { nik: "3276012309876543" },
      }),
    ).toBe("Siti C*** / ••••••••••••6543");
    expect(getSubmissionQueueStatus("submitted", null)).toBe(
      "Menunggu Asignasi",
    );
    expect(getSubmissionQueueStatus("verified", null)).toBe(
      "Sedang Ditangani",
    );
    expect(getSubmissionQueueStatus("submitted", "staff-1")).toBe(
      "Sedang Ditangani",
    );
    expect(getSubmissionQueueStatus("rejected", null)).toBe(
      "Menunggu Warga",
    );
    expect(getSubmissionQueueStatus("closed", null)).toBe("Selesai");
  });

  it("averages queue waiting times with rounding", () => {
    expect(
      getAverageWaitingTimeMinutes([
        {
          id: "1",
          trackingNumber: "A",
          serviceName: "Izin Usaha",
          serviceType: "izin-usaha",
          category: "Perizinan",
          agency: "DPMPTSP",
          applicantLabel: "Siti C*** / ••••••••••••6543",
          applicantName: "Siti Contoh",
          submittedAt: "2026-10-27T08:15:00.000Z",
          waitingTimeMinutes: 61,
          queueStatus: "Menunggu Asignasi",
          status: "submitted",
          assigneeId: null,
        },
        {
          id: "2",
          trackingNumber: "B",
          serviceName: "Bantuan Sosial",
          serviceType: "bansos",
          category: "Sosial",
          agency: "Dinas Sosial",
          applicantLabel: "Budi S***",
          applicantName: "Budi Santoso",
          submittedAt: "2026-10-27T09:15:00.000Z",
          waitingTimeMinutes: 30,
          queueStatus: "Sedang Ditangani",
          status: "verified",
          assigneeId: "staff-1",
        },
      ]),
    ).toBe(46);
  });

  it("does not imply an anonymous report has a name", () => {
    expect(maskApplicantName("Pelapor anonim")).toBe("Pelapor anonim");
  });
});

describe("SubmissionQueue", () => {
  it("filters queue entries and refreshes from the backend without a full-page reload", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          applications: [
            {
              id: "11111111-1111-4111-8111-111111111111",
              trackingNumber: "SV-20261027-ABC123",
              category: "permit",
              serviceType: "izin-usaha",
              serviceId: "permit-business",
              routeKey: "perizinan-usaha",
              serviceName: "Izin Usaha Mikro",
              agency: "DPMPTSP",
              status: "submitted",
              applicantName: "Siti Contoh",
              contactEmail: "siti@example.com",
              payload: { data: { nik: "3276012309876543" } },
              submittedAt: "2026-10-27T08:15:00.000Z",
              assigneeId: null,
              waitingTimeMinutes: 120,
            },
            {
              id: "22222222-2222-4222-8222-222222222222",
              trackingNumber: "SV-20261026-DEF456",
              category: "social",
              serviceType: "bansos",
              serviceId: "social-aid",
              routeKey: "bantuan-sosial",
              serviceName: "Bantuan Sosial",
              agency: "Dinas Sosial",
              status: "verified",
              applicantName: "Budi Santoso",
              contactEmail: "budi@example.com",
              payload: { data: {} },
              submittedAt: "2026-10-26T08:15:00.000Z",
              assigneeId: "staff-1",
              waitingTimeMinutes: 45,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          applications: [
            {
              id: "33333333-3333-4333-8333-333333333333",
              trackingNumber: "SV-20261025-GHI789",
              category: "health",
              serviceType: "rujukan",
              serviceId: "health-referral",
              routeKey: "rujukan-kesehatan",
              serviceName: "Rujukan Kesehatan",
              agency: "Dinas Kesehatan",
              status: "submitted",
              applicantName: "Rina Pratiwi",
              contactEmail: "rina@example.com",
              payload: { data: {} },
              submittedAt: "2026-10-25T08:15:00.000Z",
              assigneeId: null,
              waitingTimeMinutes: 30,
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <SubmissionQueue
        initialItems={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            trackingNumber: "SV-20261027-ABC123",
            serviceName: "Izin Usaha Mikro",
            serviceType: "izin-usaha",
            category: "Perizinan",
            agency: "DPMPTSP",
            applicantLabel: "Siti C*** / ••••••••••••6543",
            applicantName: "Siti Contoh",
            submittedAt: "2026-10-27T08:15:00.000Z",
            waitingTimeMinutes: 120,
            queueStatus: "Menunggu Asignasi",
            status: "submitted",
            assigneeId: null,
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            trackingNumber: "SV-20261026-DEF456",
            serviceName: "Bantuan Sosial",
            serviceType: "bansos",
            category: "Sosial",
            agency: "Dinas Sosial",
            applicantLabel: "Budi S***",
            applicantName: "Budi Santoso",
            submittedAt: "2026-10-26T08:15:00.000Z",
            waitingTimeMinutes: 45,
            queueStatus: "Sedang Ditangani",
            status: "verified",
            assigneeId: "staff-1",
          },
        ]}
        staff={[{ id: "staff-1", name: "Petugas Satu" }]}
      />,
    );

    const table = screen.getByRole("table", { name: "Tabel antrean pengajuan" });
    expect(within(table).getByText("SV-20261027-ABC123")).toBeTruthy();
    expect(within(table).getByText("SV-20261026-DEF456")).toBeTruthy();

    fireEvent.change(
      screen.getByRole("textbox", { name: "Cari nomor pengajuan atau pemohon" }),
      { target: { value: "Budi" } },
    );
    expect(within(table).getByText("SV-20261026-DEF456")).toBeTruthy();
    expect(within(table).queryByText("SV-20261027-ABC123")).toBeNull();

    fireEvent.change(screen.getByRole("combobox", { name: "Filter status antrean" }), {
      target: { value: "Sedang Ditangani" },
    });
    expect(within(table).getByText("SV-20261026-DEF456")).toBeTruthy();

    fireEvent.change(screen.getByRole("combobox", { name: "Filter jenis layanan" }), {
      target: { value: "Sosial" },
    });
    expect(within(table).getByText("Bantuan Sosial")).toBeTruthy();

    fireEvent.change(
      screen.getByRole("textbox", { name: "Cari nomor pengajuan atau pemohon" }),
      { target: { value: "" } },
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Filter status antrean" }), {
      target: { value: "all" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Filter jenis layanan" }), {
      target: { value: "all" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Segarkan Antrean" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/asn/service-applications", {
        cache: "no-store",
      });
    });
    await waitFor(() => {
      expect(within(table).getByText("SV-20261025-GHI789")).toBeTruthy();
    });
    expect(within(table).queryByText("SV-20261027-ABC123")).toBeNull();
  });

  it("paginates queue entries and resets back to the first page after refresh", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        applications: [
          {
            id: "99999999-9999-4999-8999-999999999999",
            trackingNumber: "SV-REFRESH-001",
            category: "permit",
            serviceType: "izin-refresh",
            serviceId: "permit-refresh",
            routeKey: "izin-refresh",
            serviceName: "Izin Refresh",
            agency: "DPMPTSP",
            status: "submitted",
            applicantName: "Pemohon Refresh",
            contactEmail: "refresh@example.com",
            payload: { data: {} },
            submittedAt: "2026-10-10T08:15:00.000Z",
            assigneeId: null,
            waitingTimeMinutes: 20,
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const initialItems = Array.from({ length: 12 }, (_, index) => ({
      id: `${index + 1}`.padStart(8, "0") + "-1111-4111-8111-111111111111",
      trackingNumber: `SV-QUEUE-${String(index + 1).padStart(3, "0")}`,
      serviceName: `Layanan ${index + 1}`,
      serviceType: `service-${index + 1}`,
      category: index % 2 === 0 ? "Perizinan" : "Sosial",
      agency: index % 2 === 0 ? "DPMPTSP" : "Dinas Sosial",
      applicantLabel: `Pemohon ${index + 1}`,
      applicantName: `Pemohon ${index + 1}`,
      submittedAt: `2026-10-${String((index % 9) + 1).padStart(2, "0")}T08:15:00.000Z`,
      waitingTimeMinutes: 15 + index,
      queueStatus: "Menunggu Asignasi" as const,
      status: "submitted",
      assigneeId: null,
    }));

    render(<SubmissionQueue initialItems={initialItems} staff={[]} />);

    const table = screen.getByRole("table", { name: "Tabel antrean pengajuan" });
    expect(within(table).getByText("SV-QUEUE-001")).toBeTruthy();
    expect(within(table).getByText("SV-QUEUE-010")).toBeTruthy();
    expect(within(table).queryByText("SV-QUEUE-011")).toBeNull();
    expect(screen.getByText("Halaman 1 / 2")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Berikutnya" }));
    expect(within(table).getByText("SV-QUEUE-011")).toBeTruthy();
    expect(within(table).getByText("SV-QUEUE-012")).toBeTruthy();
    expect(within(table).queryByText("SV-QUEUE-001")).toBeNull();
    expect(screen.getByText("Halaman 2 / 2")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Segarkan Antrean" }));
    await waitFor(() => {
      expect(within(table).getByText("SV-REFRESH-001")).toBeTruthy();
    });
    expect(screen.getByText("Halaman 1 / 1")).toBeTruthy();
    expect(within(table).queryByText("SV-QUEUE-011")).toBeNull();
  });

  it("shows the recommended assignee in the assignment modal when staff scope matches the submission", () => {
    render(
      <SubmissionQueue
        initialItems={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            trackingNumber: "SV-20261027-ABC123",
            serviceName: "Bantuan Sosial Lansia",
            serviceType: "bansos-lansia",
            category: "Sosial",
            agency: "Dinas Sosial",
            applicantLabel: "Siti C***",
            applicantName: "Siti Contoh",
            submittedAt: "2026-10-27T08:15:00.000Z",
            waitingTimeMinutes: 120,
            queueStatus: "Menunggu Asignasi",
            status: "submitted",
            assigneeId: null,
          },
        ]}
        staff={[
          {
            id: "staff-1",
            name: "Petugas Umum",
            opdName: "Sekretariat Daerah",
            unitName: "Layanan Umum",
          },
          {
            id: "staff-2",
            name: "Petugas Sosial",
            opdName: "Dinas Sosial",
            unitName: "Sosial dan Bantuan Sosial Lansia",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Asignasikan (disarankan)" }));
    const dialog = screen.getByRole("dialog", { name: /Asignasikan SV-20261027-ABC123/i });
    expect(within(dialog).getByText("Rekomendasi asignasi tersedia.")).toBeTruthy();
    expect(
      within(dialog).getByText(
        "Direkomendasikan karena profil petugas terkait Sosial dan Bantuan Sosial Lansia.",
      ),
    ).toBeTruthy();
    const select = within(dialog).getByRole("combobox", { name: "Pilih petugas" }) as HTMLSelectElement;
    expect(select.value).toBe("staff-2");
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

  it("routes report details to the tenant-scoped management review page", async () => {
    mockReports();
    render(<AgencyDashboard />);
    await screen.findByText("LP-20261027-ABC123");
    const detailLink = screen.getByRole("link", {
      name: "Lihat detail LP-20261027-ABC123",
    });
    expect(detailLink.getAttribute("href")).toBe(
      "/asn/management/review?kind=report&id=11111111-1111-4111-8111-111111111111",
    );
  });

  it("routes service application details without conflating them with citizen reports", async () => {
    mockReports([report], [serviceApplication]);
    render(<AgencyDashboard />);
    await screen.findByText("IZ-20261027-DEF456");

    const detailLink = screen.getByRole("link", {
      name: "Lihat detail IZ-20261027-DEF456",
    });
    expect(detailLink.getAttribute("href")).toBe(
      "/asn/management/review?kind=service_application&id=22222222-2222-4222-8222-222222222222",
    );
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
