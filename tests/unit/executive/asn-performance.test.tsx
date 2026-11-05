// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutiveAsnPerformance } from "@/app/(executive)/executive/asn-performance/_components/executive-asn-performance";

describe("ExecutiveAsnPerformance Component", () => {
  it("renders page header and scope analysis correctly", () => {
    render(<ExecutiveAsnPerformance />);

    expect(screen.getByRole("heading", { level: 1, name: "Kinerja ASN" })).toBeTruthy();
    expect(screen.getByText("Cakupan analisis")).toBeTruthy();
    expect(screen.getByText("Tugas ditugaskan")).toBeTruthy();
    expect(screen.getByText("Total selesai")).toBeTruthy();
    expect(screen.getByText("Tingkat penyelesaian")).toBeTruthy();
    expect(screen.getByText("Tugas tertunda")).toBeTruthy();
  });

  it("renders metric cards and details matching illustrative dataset", () => {
    render(<ExecutiveAsnPerformance />);

    expect(screen.getByText("66")).toBeTruthy();
    expect(screen.getByText("40")).toBeTruthy();
    expect(screen.getByText("60,6%")).toBeTruthy();
    expect(screen.getByText("26")).toBeTruthy();
  });

  it("renders ASN performance details table and rows", () => {
    render(<ExecutiveAsnPerformance />);

    expect(screen.getByText("Eka Wulandari")).toBeTruthy();
    expect(screen.getByText("Dewa Mahendra")).toBeTruthy();
    expect(screen.getByText("Citra Larasati")).toBeTruthy();
    expect(screen.getByText("Bima Santosa")).toBeTruthy();
    expect(screen.getByText("Aditya Nugraha")).toBeTruthy();
    expect(screen.getByText("Farah Anindita")).toBeTruthy();
  });

  it("renders charts and action needed notice", () => {
    render(<ExecutiveAsnPerformance />);

    expect(screen.getByText("Tren penyelesaian tugas")).toBeTruthy();
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
