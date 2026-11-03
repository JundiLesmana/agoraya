// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import { SekilasCards } from "@/app/(public)/insights/_components/sekilas-cards";

const ITEMS = [
  {
    label: "Layanan",
    sublabel: "Tepat waktu",
    value: "88%",
    interpretation: "penyelesaian perizinan",
    delta: "Unggul 13 poin persentase",
    context: "Kota Bandung · 2024",
  },
  {
    label: "Realisasi",
    sublabel: "Anggaran",
    value: "+50%",
    interpretation: "Naik dari Rp1,8 triliun menjadi Rp2,7 triliun",
    delta: "90% anggaran terealisasi pada 2024",
    context: "Kota Bandung · 2020-2024",
  },
  {
    label: "Penduduk miskin",
    sublabel: "(%)",
    value: "3,8%",
    interpretation: "Turun 0,2 poin persentase",
    delta: "Lebih rendah = lebih baik",
    context: "Kota Bandung · 2024",
  },
];

let fetchMock: ReturnType<typeof vi.fn>;

function mockFetch(makeResponse: () => Response | Promise<Response>) {
  fetchMock = vi.fn(makeResponse);
  vi.stubGlobal("fetch", fetchMock);
}

function jsonResponse(json: unknown, status = 200) {
  return () =>
    Promise.resolve(
      new Response(JSON.stringify(json), {
        status,
        headers: { "content-type": "application/json" },
      }),
    );
}

beforeEach(() => {
  mockFetch(jsonResponse(ITEMS));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function waitForCards() {
  await waitFor(() => expect(screen.getByText("88%")).toBeTruthy());
}

describe("SekilasCards — sukses", () => {
  it("merender 3 kartu KPI dengan data sesuai acceptance criteria", async () => {
    render(<SekilasCards />);
    await waitForCards();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/insight/sekilas"),
      expect.anything(),
    );

    // Kartu 1 - Layanan
    expect(screen.getByText("Layanan")).toBeTruthy();
    expect(screen.getByText("Tepat waktu")).toBeTruthy();
    expect(screen.getByText("88%")).toBeTruthy();
    expect(screen.getByText("Unggul 13 poin persentase")).toBeTruthy();
    expect(screen.getByText("penyelesaian perizinan")).toBeTruthy();
    expect(
      screen.getAllByText("Kota Bandung · 2024"),
    ).toHaveLength(2);

    // Kartu 2 - Realisasi
    expect(screen.getByText("Realisasi")).toBeTruthy();
    expect(screen.getByText("Anggaran")).toBeTruthy();
    expect(screen.getByText("+50%")).toBeTruthy();
    expect(screen.getByText("90% anggaran terealisasi pada 2024")).toBeTruthy();
    expect(
      screen.getByText("Naik dari Rp1,8 triliun menjadi Rp2,7 triliun"),
    ).toBeTruthy();
    expect(
      screen.getByText("Kota Bandung · 2020-2024"),
    ).toBeTruthy();

    // Kartu 3 - Penduduk miskin
    expect(screen.getByText("Penduduk miskin")).toBeTruthy();
    expect(screen.getByText("(%)")).toBeTruthy();
    expect(screen.getByText("3,8%")).toBeTruthy();
    expect(screen.getByText("Turun 0,2 poin persentase")).toBeTruthy();
    expect(screen.getByText("Lebih rendah = lebih baik")).toBeTruthy();
    expect(
      screen.getAllByText("Kota Bandung · 2024"),
    ).toHaveLength(2);
  });

  it("tidak menampilkan badge simulasi atau data contoh pada kartu", async () => {
    render(<SekilasCards />);
    await waitForCards();

    expect(document.querySelectorAll('[data-source="SIMULATED"]')).toHaveLength(0);
    expect(screen.queryByText("Data contoh")).toBeNull();
    expect(screen.queryByText("Simulasi", { exact: true })).toBeNull();
    expect(screen.getAllByText("Kota Bandung · 2024")).toHaveLength(2);
    expect(screen.getByText("Kota Bandung · 2020-2024")).toBeTruthy();
  });

  it("menggunakan grid responsif 1 kolom mobile, 2 tablet, 3 desktop", async () => {
    render(<SekilasCards />);
    await waitForCards();

    const grid = document.querySelector<HTMLElement>(".lg\\:grid-cols-3");
    expect(grid).toBeTruthy();
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("sm:grid-cols-2");
    expect(grid?.className).toContain("lg:grid-cols-3");
  });

  it("menyertakan aria-label deskriptif pada setiap kartu untuk screen reader", async () => {
    render(<SekilasCards />);
    await waitForCards();

    const cards = document.querySelectorAll<HTMLElement>(
      '[role="group"][aria-label]',
    );
    expect(cards).toHaveLength(3);

    const layananValue = screen.getByText("88%");
    const layananGroup = layananValue.closest('[role="group"]');
    expect(layananGroup?.getAttribute("aria-label")).toContain(
      "delapan puluh delapan persen",
    );
    expect(layananGroup?.getAttribute("aria-label")).toContain(
      "unggul tiga belas poin persentase",
    );

    const miskinValue = screen.getByText("3,8%");
    const miskinGroup = miskinValue.closest('[role="group"]');
    expect(miskinGroup?.getAttribute("aria-label")).toContain(
      "tiga koma delapan persen",
    );
    expect(miskinGroup?.getAttribute("aria-label")).toContain(
      "turun nol koma dua poin persentase",
    );
  });

  it("mengirim parameter filter fokus ke API", async () => {
    render(<SekilasCards filters={{ fokus: "Kota Bandung" }} />);
    await waitForCards();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("fokus=Kota+Bandung"),
      expect.anything(),
    );
  });
});

describe("SekilasCards — muat ulang saat filter berubah", () => {
  it("memuat ulang data ketika properti filter berubah", async () => {
    const { rerender } = render(
      <SekilasCards filters={{ fokus: "Kota Bandung" }} />,
    );
    await waitForCards();
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("fokus=Kota+Bandung"),
      expect.anything(),
    );

    rerender(<SekilasCards filters={{ fokus: "Kota Bogor" }} />);
    await waitForCards();
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("fokus=Kota+Bogor"),
      expect.anything(),
    );
  });
});

describe("SekilasCards — state muat dan gagal", () => {
  it("menampilkan skeleton shimmer saat data belum tersedia", () => {
    mockFetch(() => new Promise(() => {}));
    render(<SekilasCards />);

    const status = screen.getByRole("status", { name: "Kartu KPI sekilas" });
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(document.querySelectorAll('[data-slot="card"]')).toHaveLength(3);
  });

  it("menampilkan state kosong saat API tidak memiliki data", async () => {
    mockFetch(jsonResponse([]));
    render(<SekilasCards />);

    expect(await screen.findByText("Belum ada data sekilas.")).toBeTruthy();
  });

  it("menampilkan pesan kesalahan dan tombol coba lagi saat API gagal", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Gagal jaringan"));
    render(<SekilasCards />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByText("Gagal memuat perubahan kunci")).toBeTruthy();
    expect(screen.getByRole("button", { name: /coba lagi/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /coba lagi/i }));
    await waitForCards();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("88%")).toBeTruthy();
  });
});
