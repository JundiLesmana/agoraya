// @vitest-environment jsdom
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectDataTable } from "@/app/(public)/data/_components/project-data-table";

describe("ProjectDataTable", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces search and displays matching projects", async () => {
    vi.useFakeTimers();
    render(<ProjectDataTable />);
    fireEvent.change(
      screen.getByPlaceholderText("Cari nama proyek atau instansi..."),
      {
        target: { value: "puskesmas" },
      },
    );

    expect(screen.getByText("Rehabilitasi 12 sekolah")).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByText("Pembangunan Puskesmas")).toBeTruthy();
    expect(screen.queryByText("Rehabilitasi 12 sekolah")).toBeNull();
  });

  it("opens the selected project drawer and restores focus after Escape", async () => {
    render(<ProjectDataTable />);
    const detailButton = screen.getByRole("button", {
      name: "Detail Rehabilitasi 12 sekolah",
    });
    fireEvent.click(detailButton);

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("3.600 siswa")).toBeTruthy();
    expect(screen.getByText("9 dari 12 sekolah selesai")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(detailButton);
    });
  });

  it("uses four rows per page and sorts by the largest budget", () => {
    render(<ProjectDataTable />);

    expect(screen.getAllByRole("row")).toHaveLength(5);
    fireEvent.change(screen.getByRole("combobox", { name: "Urutkan proyek" }), {
      target: { value: "budget-desc" },
    });

    expect(screen.getAllByRole("row")[1].textContent).toContain(
      "Peningkatan Jalan Provinsi",
    );
    expect(
      screen.getByText("Menampilkan 1–4 dari 8 contoh proyek"),
    ).toBeTruthy();
  });
});
