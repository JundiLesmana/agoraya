// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProjectDashboard } from "@/app/(public)/data-pemerintah/proyek/_components/project-dashboard";
import type { ProjectDashboardSummary } from "@/lib/summary";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/charts/pie-chart", () => ({
  PieChart: () => <div data-testid="progress-donut" />,
}));

vi.mock(
  "@/app/(public)/data-pemerintah/proyek/_components/featured-project",
  () => ({
    FeaturedProject: () => <section>Sorotan proyek</section>,
  }),
);

vi.mock(
  "@/app/(public)/data-pemerintah/proyek/_components/dataset-information",
  () => ({
    DatasetInformation: () => <section>Informasi dataset</section>,
  }),
);

vi.mock(
  "@/app/(public)/data-pemerintah/proyek/_components/proyek-data",
  () => ({
    ProyekData: ({ filters }: { filters: { sektor: string } }) => (
      <div data-testid="project-data" data-sector={filters.sektor} />
    ),
  }),
);

const SUMMARY: ProjectDashboardSummary = {
  totalProyek: 240,
  totalWilayah: 27,
  selesai: 156,
  berjalan: 72,
  tertunda: 12,
  sektor: [
    { nama: "Infrastruktur", selesai: 52, total: 80 },
    { nama: "Pendidikan", selesai: 39, total: 60 },
    { nama: "Kesehatan", selesai: 39, total: 60 },
    { nama: "Sektor lainnya", selesai: 26, total: 40 },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ProjectDashboard", () => {
  it("shows the default portfolio summary and project tab", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(SUMMARY),
    );
    render(<ProjectDashboard />);

    expect(
      screen.getByRole("heading", { name: "Pantau proyek daerah" }),
    ).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Proyek" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(await screen.findByText("156")).toBeTruthy();
    expect(screen.getByText("27")).toBeTruthy();
    expect(screen.getByTestId("progress-donut")).toBeTruthy();
    expect(screen.getByText("52 / 80 proyek")).toBeTruthy();
  });

  it("applies one selected sector to summary requests and the project table", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const requestUrl = new URL(String(input), "http://localhost");
      const response =
        requestUrl.searchParams.get("sektor") === "Pendidikan"
          ? { ...SUMMARY, totalProyek: 60, selesai: 39, berjalan: 18, tertunda: 3 }
          : SUMMARY;
      return Promise.resolve(Response.json(response));
    });

    render(<ProjectDashboard />);
    await screen.findByText("156");

    fireEvent.change(screen.getByLabelText("Pilih sektor proyek"), {
      target: { value: "Pendidikan" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan filter" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(String(fetchSpy.mock.calls[1]?.[0])).toContain(
        "sektor=Pendidikan",
      );
      expect(screen.getByTestId("project-data").getAttribute("data-sector")).toBe(
        "Pendidikan",
      );
    });
    expect(await screen.findByText("60")).toBeTruthy();
  });

  it("switches tabs and exposes their selected panel", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(SUMMARY),
    );
    render(<ProjectDashboard />);
    await screen.findByText("156");

    fireEvent.click(screen.getByRole("tab", { name: "Anggaran" }));

    expect(
      screen.getByRole("tab", { name: "Anggaran" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByRole("tabpanel").textContent).toContain(
      "Sorotan proyek",
    );
    expect(screen.queryByTestId("project-data")).toBeNull();
  });
});
