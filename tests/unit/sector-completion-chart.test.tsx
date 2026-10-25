// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  buildSectorCompletionData,
  SectorCompletionChart,
  type SectorProjectCount,
} from "@/app/(executive)/executive/dashboard/_components/sector-completion-chart";

const SECTORS: SectorProjectCount[] = [
  { sector: "Infrastruktur", completed: 52, total: 80 },
  { sector: "Pendidikan", completed: 39, total: 60 },
  { sector: "Kesehatan", completed: 39, total: 60 },
  { sector: "Sektor lainnya", completed: 26, total: 40 },
];

describe("sector completion chart", () => {
  it("menghitung persentase penyelesaian tiap sektor", () => {
    expect(buildSectorCompletionData(SECTORS)).toEqual([
      { sector: "Infrastruktur", completed: 52, total: 80, percent: 65 },
      { sector: "Pendidikan", completed: 39, total: 60, percent: 65 },
      { sector: "Kesehatan", completed: 39, total: 60, percent: 65 },
      { sector: "Sektor lainnya", completed: 26, total: 40, percent: 65 },
    ]);
  });

  it("merender empat bar, angka, dan fallback tabel aksesibel", () => {
    render(<SectorCompletionChart />);

    expect(screen.getByText("Penyelesaian per sektor")).toBeTruthy();
    expect(screen.getByText("52 / 80 proyek")).toBeTruthy();
    expect(screen.getAllByText("39 / 60 proyek")).toHaveLength(2);
    expect(screen.getByText("26 / 40 proyek")).toBeTruthy();
    expect(screen.getByText("Penyelesaian proyek per sektor")).toBeTruthy();
    expect(screen.getAllByRole("progressbar")).toHaveLength(4);
    expect(screen.getAllByRole("row")).toHaveLength(5);
    expect(screen.getByText("Data Simulasi")).toBeTruthy();
  });

  it("menampilkan detail tooltip saat bar di-hover atau mendapat fokus", async () => {
    const user = userEvent.setup();
    render(<SectorCompletionChart />);

    const infrastructureBar = screen.getByRole("progressbar", {
      name: "Infrastruktur: 52 dari 80 proyek selesai, 65%",
    });
    await user.hover(infrastructureBar);
    expect(screen.getByRole("tooltip").textContent).toBe(
      "52 dari 80 proyek selesai (65%)",
    );

    await user.unhover(infrastructureBar);
    expect(screen.queryByRole("tooltip")).toBeNull();

    await user.tab();
    expect(screen.getByRole("tooltip").textContent).toBe(
      "52 dari 80 proyek selesai (65%)",
    );
  });
});
