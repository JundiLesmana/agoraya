// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, within } from "@testing-library/react";

vi.mock("@/components/source-badges/source-badge", () => ({
  SourceBadge: ({ source }: { source: string }) => (
    <span data-source={source} />
  ),
}));

import { BudgetSummary } from "@/components/budget-summary";

describe("BudgetSummary", () => {
  const props = {
    totalAnggaran: 80,
    realisasi: 60,
    sisaAnggaran: 20,
    tingkatRealisasi: 75,
  };

  it("menampilkan 4 kartu: Total Anggaran, Realisasi, Sisa Anggaran, Tingkat Realisasi", () => {
    const { container } = render(<BudgetSummary {...props} />);
    const c = within(container);

    expect(c.getByText("Total Anggaran")).toBeTruthy();
    expect(c.getByText("Realisasi Anggaran")).toBeTruthy();
    expect(c.getByText("Sisa Anggaran")).toBeTruthy();
    expect(c.getByText("Tingkat Realisasi")).toBeTruthy();
  });

  it("menampilkan angka yang diformat dengan benar", () => {
    const { container } = render(<BudgetSummary {...props} />);
    const c = within(container);

    expect(c.getByText("Rp80 T")).toBeTruthy();
    expect(c.getByText("Rp60 T")).toBeTruthy();
    expect(c.getByText("Rp20 T")).toBeTruthy();
    // "75%" muncul dua kali: sebagai nilai kartu dan sebagai label progress bar
    expect(c.getAllByText("75%")).toHaveLength(2);
  });

  it("menampilkan teks konteks kecil di bawah kartu", () => {
    const { container } = render(<BudgetSummary {...props} />);
    const c = within(container);

    expect(c.getByText("Pagu APBD tahun 2025")).toBeTruthy();
    expect(c.getByText("Kumulatif s.d. September")).toBeTruthy();
    expect(c.getByText("25% belum terealisis")).toBeTruthy();
    expect(c.getByText("Rp60 T dari pagu Rp80 T")).toBeTruthy();
  });

  it("kartu Tingkat Realisasi menampilkan progress bar dengan persentase", () => {
    const { container } = render(<BudgetSummary {...props} />);
    const c = within(container);

    const progress = c.getByRole("progressbar");
    expect(progress).toBeTruthy();
    expect(progress.getAttribute("aria-valuenow")).toBe("75");
    expect(progress.getAttribute("aria-valuemin")).toBe("0");
    expect(progress.getAttribute("aria-valuemax")).toBe("100");
  });

  it("kartu responsif: 1 kolom mobile, 2 kolom tablet, 4 kolom desktop", () => {
    const { container } = render(<BudgetSummary {...props} />);
    const c = within(container);

    const grid = c
      .getByRole("region", { name: /ringkasan anggaran daerah/i })
      .querySelector(".grid");
    expect(grid).toBeTruthy();
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("sm:grid-cols-2");
    expect(grid?.className).toContain("lg:grid-cols-4");
  });

  it("menampilkan SourceBadge SIMULATED pada setiap kartu data", () => {
    const { container } = render(<BudgetSummary {...props} />);

    const badges = container.querySelectorAll('[data-source="SIMULATED"]');
    expect(badges.length).toBe(4);
  });

  it('menampilkan "-" saat nilai null/undefined', () => {
    const { container } = render(
      <BudgetSummary
        totalAnggaran={null}
        realisasi={undefined}
        sisaAnggaran={null}
        tingkatRealisasi={undefined}
      />,
    );
    const c = within(container);

    // 4 nilai kartu + 1 label progress bar = 5 elemen "-"
    expect(c.getAllByText("-")).toHaveLength(5);
    // Konteks kartu Sisa dan Tingkat Realisasi menunjukkan data belum tersedia
    expect(c.getAllByText("Data belum tersedia")).toHaveLength(2);
  });

  it("render skeleton saat loading agar layout stabil", () => {
    const { container } = render(<BudgetSummary {...props} loading />);
    const c = within(container);

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
    // Nilai asli tidak boleh muncul saat loading
    expect(c.queryByText("Rp80 T")).toBeNull();
    expect(c.queryByText("75%")).toBeNull();
  });
});
