// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { GET } from "@/app/api/projects/route";
import { ProyekData } from "@/app/(public)/data-pemerintah/proyek/_components/proyek-data";

describe("ProyekData", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the selected project details in an accessible dialog", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(String(input), "http://localhost");
      return GET(new Request(url));
    });

    render(<ProyekData />);

    const detailButton = await screen.findByRole("button", {
      name: "Lihat detail Peningkatan jalan provinsi",
    });
    fireEvent.click(detailButton);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Dinas Bina Marga")).toBeTruthy();
    expect(within(dialog).getByText("Rp120 M")).toBeTruthy();
  });

  it("loads the next 40 projects when the next-page button is selected", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const url = new URL(String(input), "http://localhost");
        return GET(new Request(url));
      });

    render(<ProyekData />);
    await screen.findByRole("button", {
      name: "Lihat detail Peningkatan jalan provinsi",
    });
    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }));

    await waitFor(() => {
      expect(
        screen.getByText("Menampilkan 40 proyek · Halaman 2 dari 6"),
      ).toBeTruthy();
      expect(fetchSpy).toHaveBeenLastCalledWith(
        expect.stringContaining("page=2"),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });
  });
});
