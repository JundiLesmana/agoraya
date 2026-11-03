// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/(public)/insights/_components/info-banner", () => ({
  InfoBanner: () => null,
}));

vi.mock("@/app/(public)/insights/_components/sekilas-cards", () => ({
  SekilasCards: ({ topik }: { topik: string }) => (
    <div data-testid="sekilas">{topik}</div>
  ),
}));

vi.mock(
  "@/app/(public)/insights/_components/timely-service-comparison",
  () => ({
    TimelyServiceComparison: ({ fokus }: { fokus: string }) => (
      <div data-testid="layanan">{fokus}</div>
    ),
  }),
);

vi.mock("@/app/(public)/insights/_components/budget-trend", () => ({
  BudgetTrend: () => <div data-testid="anggaran" />,
}));

vi.mock("@/app/(public)/insights/_components/wellbeing-indicators", () => ({
  WellbeingIndicators: () => <div data-testid="kesejahteraan" />,
}));

import { InsightDashboard } from "@/app/(public)/insights/_components/insight-dashboard";

describe("InsightDashboard filters", () => {
  it("uses the applied topic to update all visible sections and the shareable URL", () => {
    replace.mockClear();
    render(<InsightDashboard />);

    expect(screen.getByTestId("sekilas").textContent).toBe("Semua topik");
    expect(screen.getByTestId("layanan")).toBeTruthy();
    expect(screen.getByTestId("anggaran")).toBeTruthy();
    expect(screen.getByTestId("kesejahteraan")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Pilih topik insight"), {
      target: { value: "Layanan" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan filter" }));

    expect(screen.getByTestId("sekilas").textContent).toBe("Layanan");
    expect(screen.getByTestId("layanan")).toBeTruthy();
    expect(screen.queryByTestId("anggaran")).toBeNull();
    expect(screen.queryByTestId("kesejahteraan")).toBeNull();
    expect(replace).toHaveBeenCalledWith(
      "?wilayah=Provinsi+Jawa+Barat&fokus=Kota+Bandung&periode=2024&topik=Layanan",
    );
  });

  it("passes the selected focus city to the five-city comparison", () => {
    render(<InsightDashboard />);

    fireEvent.change(
      screen.getByLabelText("Pilih kabupaten atau kota fokus daerah"),
      { target: { value: "Kota Bogor" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Terapkan filter" }));

    expect(screen.getByTestId("layanan").textContent).toBe("Kota Bogor");
    expect(
      screen.getByText(
        /ringkasan sekilas simulasi tersedia untuk kota bandung/i,
      ),
    ).toBeTruthy();
  });
});
