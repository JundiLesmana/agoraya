// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(),
}));

import {
  DEFAULT_FILTERS,
  FilterControls,
} from "@/app/(public)/insights/_components/filter-controls";

describe("default filter values", () => {
  it("DEFAULT_FILTERS memiliki nilai default yang benar", () => {
    expect(DEFAULT_FILTERS).toEqual({
      wilayah: "Provinsi Jawa Barat",
      fokus: "Kota Bandung",
      periode: "2024",
      topik: "Semua topik",
    });
  });
});

describe("FilterControls — render default values", () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
  });

  it("menampilkan default value semua filter", () => {
    render(
      <FilterControls
        filters={DEFAULT_FILTERS}
        onApply={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const wilayahSelect = screen.getByLabelText(
      /pilih wilayah perbandingan provinsi/i,
    ) as HTMLSelectElement;
    expect(wilayahSelect.value).toBe("Provinsi Jawa Barat");

    const fokusSelect = screen.getByLabelText(
      /pilih kabupaten atau kota fokus daerah/i,
    ) as HTMLSelectElement;
    expect(fokusSelect.value).toBe("Kota Bandung");

    const periodeSelect = screen.getByLabelText(
      /pilih tahun periode/i,
    ) as HTMLSelectElement;
    expect(periodeSelect.value).toBe("2024");

    const topikSelect = screen.getByLabelText(
      /pilih topik insight/i,
    ) as HTMLSelectElement;
    expect(topikSelect.value).toBe("Semua topik");
  });

  it("menampilkan seluruh 38 provinsi Indonesia", () => {
    render(
      <FilterControls
        filters={DEFAULT_FILTERS}
        onApply={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const provinceSelect = screen.getByLabelText(
      /pilih wilayah perbandingan provinsi/i,
    ) as HTMLSelectElement;
    const provinceNames = Array.from(provinceSelect.options).map(
      (option) => option.value,
    );

    expect(provinceNames).toHaveLength(38);
    expect(provinceNames).toContain("Provinsi Aceh");
    expect(provinceNames).toContain("Provinsi Jawa Barat");
    expect(provinceNames).toContain("Provinsi Papua Barat Daya");
    expect(provinceNames).not.toContain("Kabupaten Bogor");
  });

  it("mengubah fokus daerah sesuai provinsi yang dipilih", () => {
    render(
      <FilterControls
        filters={DEFAULT_FILTERS}
        onApply={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const provinceSelect = screen.getByLabelText(
      /pilih wilayah perbandingan provinsi/i,
    );
    const focusSelect = screen.getByLabelText(
      /pilih kabupaten atau kota fokus daerah/i,
    ) as HTMLSelectElement;

    fireEvent.change(provinceSelect, {
      target: { value: "Provinsi Aceh" },
    });

    const acehOptions = Array.from(focusSelect.options).map(
      (option) => option.value,
    );
    expect(focusSelect.value).toBe("Semua kabupaten/kota");
    expect(acehOptions).toContain("Kabupaten Aceh Selatan");
    expect(acehOptions).toContain("Kota Banda Aceh");
    expect(acehOptions).not.toContain("Kabupaten Bogor");
    expect(acehOptions).toHaveLength(24);

    fireEvent.change(provinceSelect, {
      target: { value: "Provinsi Jawa Tengah" },
    });
    const centralJavaOptions = Array.from(focusSelect.options).map(
      (option) => option.value,
    );
    expect(centralJavaOptions).toContain("Kabupaten Cilacap");
    expect(centralJavaOptions).toContain("Kota Semarang");
    expect(centralJavaOptions).not.toContain("Kabupaten Aceh Selatan");
  });

  it("menampilkan tombol terapkan biru penuh dan reset sebagai tautan biru", () => {
    render(
      <FilterControls
        filters={DEFAULT_FILTERS}
        onApply={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const applyButton = screen.getByRole("button", {
      name: /terapkan filter/i,
    });
    expect(applyButton.className).toContain("w-full");
    expect(applyButton.className).toContain("bg-[#1745e8]");
    expect(applyButton.className).toContain("hover:-translate-y-0.5");
    expect(applyButton.hasAttribute("disabled")).toBe(true);

    const resetButton = screen.getByRole("button", { name: /reset filter/i });
    expect(resetButton.className).toContain("text-blue-700");
    expect(resetButton.className).toContain("transition-colors");
    expect(resetButton.hasAttribute("disabled")).toBe(false);
  });

  it("mengubah nilai dropdown fokus daerah saat dipilih", () => {
    render(
      <FilterControls
        filters={DEFAULT_FILTERS}
        onApply={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const fokusSelect = screen.getByLabelText(
      /pilih kabupaten atau kota fokus daerah/i,
    );
    fireEvent.change(fokusSelect, { target: { value: "Kabupaten Bogor" } });
    expect((fokusSelect as HTMLSelectElement).value).toBe("Kabupaten Bogor");
  });

  it("memicu onApply dengan nilai yang dipilih saat klik Terapkan filter", () => {
    const onApply = vi.fn();
    render(
      <FilterControls
        filters={DEFAULT_FILTERS}
        onApply={onApply}
        onReset={vi.fn()}
      />,
    );

    const fokusSelect = screen.getByLabelText(
      /pilih kabupaten atau kota fokus daerah/i,
    );
    fireEvent.change(fokusSelect, { target: { value: "Kabupaten Bogor" } });
    fireEvent.click(screen.getByRole("button", { name: /terapkan filter/i }));

    expect(onApply).toHaveBeenCalledWith({
      wilayah: "Provinsi Jawa Barat",
      fokus: "Kabupaten Bogor",
      periode: "2024",
      topik: "Semua topik",
    });
  });

  it("memicu onReset saat klik Reset filter", () => {
    const onReset = vi.fn();
    render(
      <FilterControls
        filters={{ ...DEFAULT_FILTERS, topik: "Anggaran" }}
        onApply={vi.fn()}
        onReset={onReset}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /reset filter/i }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("menyinkronkan filter ke URL query params saat Terapkan filter diklik", () => {
    render(
      <FilterControls
        filters={DEFAULT_FILTERS}
        onApply={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const fokusSelect = screen.getByLabelText(
      /pilih kabupaten atau kota fokus daerah/i,
    );
    fireEvent.change(fokusSelect, { target: { value: "Kabupaten Bogor" } });
    fireEvent.click(screen.getByRole("button", { name: /terapkan filter/i }));

    expect(replace).toHaveBeenCalledTimes(1);
    const calledWith = replace.mock.calls[0][0];
    expect(calledWith).toContain("wilayah=Provinsi+Jawa+Barat");
    expect(calledWith).toContain("fokus=Kabupaten+Bogor");
    expect(calledWith).toContain("periode=2024");
    expect(calledWith).toContain("topik=Semua+topik");
  });
});
