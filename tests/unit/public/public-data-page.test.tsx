// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import PublicDataPage from "@/app/(public)/data/page";
import PublicBudgetPage from "@/app/(public)/data/anggaran/page";
import PublicProjectsPage from "@/app/(public)/data/project/page";

const publishedApbd = {
  entries: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      agencyId: "pemda-jabar",
      regionId: "jabar",
      regionName: "Jawa Barat",
      sectorId: "pendidikan",
      referenceYear: 2025,
      publishedAt: "2026-11-10T00:00:00.000Z",
      items: [
        {
          code: "PENDIDIKAN",
          programName: "Layanan pendidikan",
          subactivityName: "Penyelenggaraan pendidikan",
          pagu: "80000000000000",
          realisasi: "60000000000000",
          periodValue: "Q1",
        },
        ...["Q2", "Q3", "Q4"].map((periodValue) => ({
          code: "PENDIDIKAN",
          programName: "Layanan pendidikan",
          subactivityName: "Penyelenggaraan pendidikan",
          pagu: "0",
          realisasi: "0",
          periodValue,
        })),
      ],
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      agencyId: "pemda-bogor",
      regionId: "bogor",
      regionName: "Kabupaten Bogor",
      sectorId: "pendidikan",
      referenceYear: 2024,
      publishedAt: "2026-11-10T00:00:00.000Z",
      items: [
        {
          code: "PENDIDIKAN",
          programName: "Layanan pendidikan",
          subactivityName: "Penyelenggaraan pendidikan",
          pagu: "8000000000000",
          realisasi: "4000000000000",
          periodValue: "Q1",
        },
        {
          code: "PENDIDIKAN",
          programName: "Layanan pendidikan",
          subactivityName: "Penyelenggaraan pendidikan",
          pagu: "8900000000000",
          realisasi: "4500000000000",
          periodValue: "Q2",
        },
        ...["Q3", "Q4"].map((periodValue) => ({
          code: "PENDIDIKAN",
          programName: "Layanan pendidikan",
          subactivityName: "Penyelenggaraan pendidikan",
          pagu: "0",
          realisasi: "0",
          periodValue,
        })),
      ],
    },
  ],
};

const publishedStatistics = {
  entries: [
    ...["tpt", "inflasi"].map((indicatorId, index) => ({
      id: index === 0
        ? "44444444-4444-4444-8444-444444444444"
        : "55555555-5555-4555-8555-555555555555",
      regionId: "bogor",
      regionName: "Kabupaten Bogor",
      sectorId: "economy",
      indicatorId,
      indicatorName: indicatorId === "tpt" ? "TPT" : "Inflasi",
      unit: "Persen",
      referenceYear: 2024,
      sourceName: "BPS",
      methodology: "Survei tahunan.",
      publishedAt: "2026-11-10T00:00:00.000Z",
      values: [{ periodValue: "Q2", value: index + 1 }],
    })),
  ],
};

const publishedProjects = {
  projects: [
    {
      id: "66666666-6666-4666-8666-666666666666",
      name: "Rehabilitasi 12 sekolah",
      agency: "Dinas Pendidikan",
      location: "Jawa Barat",
      sector: "pendidikan",
      budget: 80_000_000,
      startDate: "2025-01-01",
      endDate: "2027-12-31",
      fiscalYear: 2025,
      initialPhysicalProgress: 75,
      initialFinancialProgress: 25,
      status: "ongoing",
      reports: [],
    },
    {
      id: "77777777-7777-4777-8777-777777777777",
      name: "Sistem air bersih",
      agency: "Dinas Pekerjaan Umum",
      location: "Jawa Barat",
      sector: "infrastruktur",
      budget: 40_000_000,
      startDate: "2025-01-01",
      endDate: "2027-12-31",
      fiscalYear: 2025,
      initialPhysicalProgress: 30,
      initialFinancialProgress: 15,
      status: "delayed",
      reports: [],
    },
    {
      id: "88888888-8888-4888-8888-888888888888",
      name: "Peningkatan jalan kabupaten",
      agency: "Dinas Pekerjaan Umum",
      location: "Kabupaten Bogor",
      sector: "infrastruktur",
      budget: 50_000_000,
      startDate: "2024-01-01",
      endDate: "2026-12-31",
      fiscalYear: 2024,
      initialPhysicalProgress: 50,
      initialFinancialProgress: 40,
      status: "ongoing",
      reports: [],
    },
  ],
};

const emptyDatasetResponse = {
  data: [],
  total: 0,
  page: 1,
  pageSize: 12,
  totalPages: 0,
  filters: { categories: [], agencies: [] },
};

describe("PublicDataPage", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/v1/apbd/published") {
        return Response.json(publishedApbd);
      }
      if (url === "/api/v1/statistics/published") {
        return Response.json(publishedStatistics);
      }
      if (url === "/api/v1/projects/published") {
        return Response.json(publishedProjects);
      }
      return Response.json(emptyDatasetResponse);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the public dashboard, charts, catalog, and disclaimer", async () => {
    render(<PublicDataPage />);
    expect(await screen.findByText("Rp80T")).toBeTruthy();

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(breadcrumb)
        .getByRole("link", { name: "Beranda" })
        .getAttribute("href"),
    ).toBe("/");
    expect(
      within(breadcrumb)
        .getByRole("link", { name: "Data Pemerintah" })
        .getAttribute("href"),
    ).toBe("/data");
    const currentBreadcrumb = within(breadcrumb).getByText("Ringkasan");
    expect(currentBreadcrumb.getAttribute("aria-current")).toBe("page");
    expect(currentBreadcrumb.className).toContain("text-primary");
    const summaryTitle = screen.getByRole("heading", {
      name: "Data Pemerintah",
    });
    expect(summaryTitle.closest(".hero-enter")).toBeTruthy();
    expect(
      breadcrumb.compareDocumentPosition(summaryTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const categoryNavigation = screen.getByRole("navigation", {
      name: "Kategori data pemerintah",
    });
    const summaryFilter = screen
      .getByRole("heading", { name: "Jelajahi data" })
      .closest('[data-slot="card"]') as HTMLElement | null;
    if (!summaryFilter) throw new Error("Ringkasan filter card was not found");
    const summaryRegionSelect = within(summaryFilter).getByRole("combobox", {
      name: "Wilayah",
    }) as HTMLSelectElement;
    const summaryRegions = Array.from(summaryRegionSelect.options);
    const summaryYearOptions = Array.from(
      (
        within(summaryFilter).getByRole("combobox", {
          name: "Tahun anggaran",
        }) as HTMLSelectElement
      ).options,
    ).map((option) => option.value);
    expect(summaryYearOptions).toEqual([
      "2026",
      "2025",
      "2024",
      "2023",
      "2022",
      "2021",
      "2020",
    ]);
    expect(
      summaryRegions.filter((option) => option.label.startsWith("Provinsi ")),
    ).toHaveLength(38);
    expect(summaryRegions.map((option) => option.label)).toContain(
      "Kabupaten Bogor",
    );
    expect(
      within(summaryFilter).getByRole("button", { name: "Terapkan filter" }),
    ).toBeTruthy();
    expect(
      categoryNavigation.compareDocumentPosition(summaryFilter) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      within(categoryNavigation)
        .getByRole("link", { name: "Ringkasan" })
        .getAttribute("href"),
    ).toBe("/data");
    expect(
      within(categoryNavigation)
        .getByRole("link", { name: "Anggaran" })
        .getAttribute("href"),
    ).toBe("/data/anggaran");
    expect(
      within(categoryNavigation)
        .getByRole("link", { name: "Proyek" })
        .getAttribute("href"),
    ).toBe("/data/project");
    expect(
      within(categoryNavigation)
        .getByRole("link", { name: "Statistik daerah" })
        .getAttribute("href"),
    ).toBe("/data/statistik");
    expect(
      screen.getByRole("heading", { name: "Data Pemerintah" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Ringkasan Anggaran dan Pembangunan",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Rp80T")).toBeTruthy();
    expect(screen.getByText("Rp60T")).toBeTruthy();
    expect(screen.getByText("0 / 2")).toBeTruthy();
    expect(screen.getByText("1 daerah")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Tren realisasi anggaran" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Anggaran per sektor" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Statistik daerah" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Pantau proyek, lihat dampaknya" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Eksplorasi lebih lanjut dengan dataset",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText("Data terbuka, konteks tetap penting."),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Definisi & metodologi/ })
        .getAttribute("href"),
    ).toBe("#metodologi");
  });

  it("connects uploaded dataset cards to their CSV resource URL", async () => {
    const csvUrl = "/api/asn/datasets/pos-klimatologi/download";
    const projectDatasetResponse = {
      data: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          slug: "pos-klimatologi",
          title: "Pos Klimatologi",
          summary: "Data pengamatan pos klimatologi.",
          category: "Proyek",
          sourceOrganization: "Pemerintah Daerah",
          sourceLabel: "CITIZEN_UNVERIFIED",
          tags: ["csv"],
          lastUpdatedAt: "2026-11-08T00:00:00.000Z",
          downloadsCount: 0,
          resources: [
            {
              id: "22222222-2222-4222-8222-222222222222",
              title: "Pos Klimatologi (CSV)",
              format: "CSV",
              url: csvUrl,
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      pageSize: 12,
      totalPages: 1,
      filters: { categories: ["Proyek"], agencies: ["Pemerintah Daerah"] },
    };
    const emptyDatasetResponse = {
      ...projectDatasetResponse,
      data: [],
      total: 0,
      totalPages: 0,
      filters: { categories: [], agencies: [] },
    };
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes("category=Proyek")) {
          return Response.json(projectDatasetResponse);
        }
        return Response.json(emptyDatasetResponse);
      });

    render(<PublicDataPage />);

    const projectDatasetSection = await screen.findByRole("region", {
      name: "Dataset Proyek dari ASN",
    });
    const downloadLink = within(projectDatasetSection).getByRole("link", {
      name: "Unduh Pos Klimatologi CSV",
    });
    expect(downloadLink.getAttribute("href")).toBe(csvUrl);
    expect(downloadLink.closest('[data-slot="card"]')).toBeTruthy();
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/asn/datasets",
      expect.objectContaining({ cache: "no-store" }),
    );
    fetchSpy.mockRestore();
  });

  it("loads Anggaran datasets on the dedicated budget page", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes("category=Anggaran")) {
          return Response.json({
            data: [
              {
                id: "33333333-3333-4333-8333-333333333333",
                slug: "apbd-2026",
                title: "APBD 2026",
                summary: "Anggaran daerah 2026.",
                category: "Anggaran",
                sourceOrganization: "Pemerintah Daerah",
                sourceLabel: "CITIZEN_UNVERIFIED",
                tags: ["anggaran"],
                lastUpdatedAt: "2026-11-08T00:00:00.000Z",
                downloadsCount: 0,
                resources: [],
              },
            ],
            total: 1,
            page: 1,
            pageSize: 12,
            totalPages: 1,
            filters: {
              categories: ["Anggaran"],
              agencies: ["Pemerintah Daerah"],
            },
          });
        }
        return Response.json({
          data: [],
          total: 0,
          page: 1,
          pageSize: 12,
          totalPages: 0,
          filters: { categories: [], agencies: [] },
        });
      });

    render(<PublicBudgetPage />);

    const budgetDatasetSection = await screen.findByRole("region", {
      name: "Dataset Anggaran dari ASN",
    });
    expect(within(budgetDatasetSection).getByText("APBD 2026")).toBeTruthy();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("category=Anggaran"),
      expect.objectContaining({ cache: "no-store" }),
    );
    fetchSpy.mockRestore();
  });

  it("renders the dedicated budget page with searchable sector details", async () => {
    render(<PublicBudgetPage />);
    expect((await screen.findAllByText("Pendidikan")).length).toBeGreaterThan(0);

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(breadcrumb)
        .getByRole("link", { name: "Data Pemerintah" })
        .getAttribute("href"),
    ).toBe("/data");
    const currentBreadcrumb = within(breadcrumb).getByText("Anggaran");
    expect(currentBreadcrumb.getAttribute("aria-current")).toBe("page");
    expect(currentBreadcrumb.className).toContain("text-primary");
    const budgetTitle = screen.getByRole("heading", {
      level: 1,
      name: "Anggaran & realisasi APBD",
    });
    expect(budgetTitle.closest(".hero-enter")).toBeTruthy();
    expect(
      breadcrumb.compareDocumentPosition(budgetTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const categoryNavigation = screen.getByRole("navigation", {
      name: "Kategori data pemerintah",
    });
    const budgetFilter = screen
      .getByRole("heading", { name: "Jelajahi anggaran" })
      .closest('[data-slot="card"]') as HTMLElement | null;
    if (!budgetFilter) throw new Error("Anggaran filter card was not found");
    const budgetRegions = Array.from(
      (
        within(budgetFilter).getByRole("combobox", {
          name: "Wilayah",
        }) as HTMLSelectElement
      ).options,
    );
    expect(
      budgetRegions.filter((option) => option.label.startsWith("Provinsi ")),
    ).toHaveLength(38);
    expect(
      Array.from(
        (
          within(budgetFilter).getByRole("combobox", {
            name: "Tahun anggaran",
          }) as HTMLSelectElement
        ).options,
      ).map((option) => option.value),
    ).toEqual(["2026", "2025", "2024", "2023", "2022", "2021", "2020"]);
    expect(budgetRegions.map((option) => option.label)).toContain(
      "Kota Bandung",
    );
    expect(
      within(budgetFilter).getByRole("button", { name: "Terapkan filter" }),
    ).toBeTruthy();
    expect(
      categoryNavigation.compareDocumentPosition(budgetFilter) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      within(categoryNavigation)
        .getByRole("link", { name: "Anggaran" })
        .getAttribute("aria-current"),
    ).toBe("location");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Anggaran & realisasi APBD",
      }),
    ).toBeTruthy();
    expect(screen.getAllByText("Sisa anggaran").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Tingkat realisasi").length).toBeGreaterThan(1);
    expect(
      screen.getByRole("heading", { name: "Rincian anggaran per sektor" }),
    ).toBeTruthy();

    fireEvent.change(
      screen.getByRole("textbox", { name: "Cari sektor atau urusan" }),
      { target: { value: "Pendidikan" } },
    );
    const table = screen.getByRole("table", {
      name: /Rincian alokasi anggaran/,
    });
    expect(within(table).getByText("Pendidikan")).toBeTruthy();
    expect(within(table).queryByText("Kesehatan")).toBeNull();
  });

  it("opens the project subpage with project-specific tabs and filters", async () => {
    render(<PublicProjectsPage />);
    expect(await screen.findByText("Sistem air bersih")).toBeTruthy();

    const categoryNavigation = screen.getByRole("navigation", {
      name: "Kategori data pemerintah",
    });
    expect(
      within(categoryNavigation)
        .getByRole("link", { name: "Proyek" })
        .getAttribute("aria-current"),
    ).toBe("location");
    expect(
      screen.getByRole("heading", { name: "Pantau proyek daerah" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("heading", { name: "Pantau proyek daerah" })
        .closest(".hero-enter"),
    ).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Sektor proyek" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Status proyek" }),
    ).toBeTruthy();
    expect(
      Array.from(
        (
          screen.getByRole("combobox", {
            name: "Periode kumulatif",
          }) as HTMLSelectElement
        ).options,
      ).map((option) => option.value),
    ).toContain("2020-q1");
    expect(
      (
        screen.getByRole("combobox", {
          name: "Periode kumulatif",
        }) as HTMLSelectElement
      ).options,
    ).toHaveLength(28);
    expect(screen.getByText("Progres penyelesaian")).toBeTruthy();
    expect(screen.getByText("Penyelesaian per sektor")).toBeTruthy();

    const projectTable = screen.getByRole("table", { name: /Daftar proyek/ });
    fireEvent.change(screen.getByRole("combobox", { name: "Status proyek" }), {
      target: { value: "Tertunda" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan filter" }));
    expect(within(projectTable).getByText("Sistem air bersih")).toBeTruthy();
    expect(
      within(projectTable).queryByText("Pembangunan Puskesmas"),
    ).toBeNull();
  });

  it("shows unavailable project percentages when no public projects are available", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(emptyDatasetResponse),
    );

    render(<PublicProjectsPage />);

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Progres penyelesaian" }),
    ).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("updates summary and chart data when region, year, and period filters change", async () => {
    render(<PublicDataPage />);
    expect(await screen.findByText("Rp80T")).toBeTruthy();

    fireEvent.change(screen.getByRole("combobox", { name: "Wilayah" }), {
      target: { value: "bogor" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Tahun anggaran" }), {
      target: { value: "2024" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Periode kumulatif" }),
      {
        target: { value: "q2" },
      },
    );

    expect(screen.getByText("Rp16,9T")).toBeTruthy();
    expect(screen.getByText("Rp8,5T")).toBeTruthy();
    expect(screen.getByText("1 daerah")).toBeTruthy();
    expect(
      screen.getAllByText(/Kabupaten Bogor · 2024 · s\.d\. Triwulan II/),
    ).toHaveLength(2);
    expect(screen.getByText(/Januari – Jun 2024/)).toBeTruthy();
  });

  it("allows selecting a province outside the original regional options", async () => {
    render(<PublicBudgetPage />);
    expect((await screen.findAllByText("Pendidikan")).length).toBeGreaterThan(0);

    const regionSelect = screen.getByRole("combobox", { name: "Wilayah" }) as HTMLSelectElement;
    fireEvent.change(regionSelect, {
      target: { value: "provinsi-aceh" },
    });

    expect(regionSelect.value).toBe("provinsi-aceh");
    expect(
      screen.getByRole("heading", { name: "Ringkasan anggaran Aceh" }),
    ).toBeTruthy();
  });

  it("filters and sorts project rows and opens project details", async () => {
    render(<PublicDataPage />);
    expect(await screen.findByText("Rehabilitasi 12 sekolah")).toBeTruthy();

    fireEvent.change(
      screen.getByRole("textbox", { name: "Cari nama proyek atau instansi" }),
      {
        target: { value: "Rehabilitasi" },
      },
    );
    const table = screen.getByRole("table", { name: /Daftar proyek/ });
    expect(within(table).getByText("Rehabilitasi 12 sekolah")).toBeTruthy();
    expect(within(table).queryByText("Pembangunan Puskesmas")).toBeNull();

    fireEvent.change(
      screen.getByRole("combobox", { name: "Periode kumulatif" }),
      {
        target: { value: "q1" },
      },
    );
    expect(within(table).getByText("Rp20.000.000")).toBeTruthy();

    fireEvent.click(within(table).getByRole("button", { name: "Detail" }));
    const dialog = screen.getByRole("dialog", {
      name: "Rehabilitasi 12 sekolah",
    });
    expect(within(dialog).getByText("75% · Berjalan")).toBeTruthy();
    expect(within(dialog).getByText("Laporan ASN terpublikasi")).toBeTruthy();
    expect(
      within(dialog).getByRole("heading", { name: "Timeline proyek" }),
    ).toBeTruthy();
  });

  it("downloads filtered summary, project CSV, catalog CSV, and metadata", async () => {
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    render(<PublicDataPage />);

    const projectDownloadButton = screen.getByRole("button", {
      name: "Unduh daftar",
    });
    expect(projectDownloadButton.closest('[data-slot="card"]')).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Unduh ringkasan" }));
    fireEvent.click(projectDownloadButton);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Unduh CSV Anggaran & realisasi APBD",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Unduh metadata Anggaran & realisasi APBD",
      }),
    );

    expect(createObjectURL).toHaveBeenCalledTimes(4);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    expect(anchorClick).toHaveBeenCalledTimes(4);
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledTimes(4), {
      timeout: 1500,
    });
    anchorClick.mockRestore();
    vi.unstubAllGlobals();
  });
});