/** @vitest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressForm } from "@/app/(asn)/project/_components/progress-form";
import type { ProjectDetail } from "@/modules/project-progress/types";

const PROJECT: ProjectDetail = {
  id: "project-002",
  namaPaket: "Rehabilitasi Ruang Kelas & Sanitasi 12 Sekolah",
  instansi: "Dinas Pendidikan",
  lokasi: "Kab. Bogor",
  sektor: "Pendidikan",
  nilaiKontrak: 80_000_000_000,
  penyedia: "PT Sarana Pembangunan Mandiri",
  tanggalMulai: "01 Januari 2025",
  tanggalSelesai: "31 Des 2025",
  tahunAnggaran: 2025,
  progresFisik: 75,
  progresKeuangan: 56.5,
  status: "Berjalan",
};

function renderForm({
  lastPhysical = 70,
  lastKeuangan = 52,
}: { lastPhysical?: number; lastKeuangan?: number } = {}) {
  let captured: {
    values: unknown;
    files: readonly File[];
    mode: string;
  } | null = null;
  const utils = render(
    <ProgressForm
      project={PROJECT}
      lastPhysicalProgress={lastPhysical}
      lastKeuanganProgress={lastKeuangan}
      onSave={async (values, files, mode) => {
        captured = { values, files, mode };
      }}
      saving={false}
    />,
  );
  const inputBerkas =
    utils.container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!inputBerkas) throw new Error("Input dokumentasi foto tidak ditemukan.");
  return { ...utils, inputBerkas, captured: () => captured };
}

function berkasJpg(nama = "foto.jpg"): File {
  return new File([new Uint8Array(100)], nama, { type: "image/jpeg" });
}

function berkasExe(): File {
  return new File([new Uint8Array(100)], "dokumen.exe", {
    type: "application/vnd.microsoft.portable-executable",
  });
}

function isiInput(label: string | RegExp, nilai: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value: nilai } });
}

describe("ProgressForm", () => {
  it("merender semua bidang wajib formulir input progres", () => {
    renderForm();
    expect(screen.getByLabelText(/bulan pelaporan/i)).toBeTruthy();
    const fiscalYear = screen.getByLabelText(
      /tahun anggaran/i,
    ) as HTMLInputElement;
    expect(fiscalYear.value).toBe("2025");
    expect(fiscalYear.readOnly).toBe(true);
    expect(screen.getByLabelText(/progres fisik/i)).toBeTruthy();
    expect(screen.getByLabelText(/progres keuangan/i)).toBeTruthy();
    expect(screen.getByLabelText(/catatan evaluasi/i)).toBeTruthy();
    expect(screen.getByLabelText(/dokumentasi foto lapangan/i)).toBeTruthy();
  });

  it("menampilkan referensi pelaporan bulan lalu", () => {
    renderForm({ lastPhysical: 70, lastKeuangan: 52 });
    expect(screen.getByText(/referensi pelaporan bulan lalu/i)).toBeTruthy();
    expect(screen.getByText(/70\.00%/)).toBeTruthy();
  });

  it("menolak progres fisik yang lebih kecil dari pelaporan bulan lalu", async () => {
    const { inputBerkas } = renderForm({ lastPhysical: 70 });
    isiInput(/progres fisik/i, "65");
    fireEvent.change(inputBerkas, { target: { files: [berkasJpg()] } });
    fireEvent.click(screen.getByRole("button", { name: /publikasikan/i }));

    await waitFor(() => {
      expect(screen.getByTestId("error-progresFisik").textContent).toContain(
        "65%",
      );
      expect(screen.getByTestId("error-progresFisik").textContent).toContain(
        "70%",
      );
    });
  });

  it("mengizinkan progres fisik yang sama atau lebih besar dari bulan lalu", async () => {
    const { captured, inputBerkas } = renderForm({ lastPhysical: 70 });
    isiInput(/progres fisik/i, "75");
    fireEvent.change(inputBerkas, { target: { files: [berkasJpg()] } });
    fireEvent.click(screen.getByRole("button", { name: /publikasikan/i }));

    await waitFor(() => expect(captured()).not.toBeNull());
    expect(screen.queryByTestId("error-progresFisik")).toBeNull();
    const hasil = captured();
    expect(hasil?.values).toMatchObject({
      periodeTahun: 2025,
      progresFisik: 75,
      progresKeuangan: 52,
    });
    expect(hasil?.mode).toBe("submit");
    expect(hasil?.files).toHaveLength(1);
  });

  it("menampilkan peringatan (tidak memblokir) saat selisih fisik vs keuangan lebih dari 15%", async () => {
    const { captured, inputBerkas } = renderForm();
    isiInput(/progres fisik/i, "90");
    isiInput(/progres keuangan/i, "50");
    fireEvent.change(inputBerkas, { target: { files: [berkasJpg()] } });
    fireEvent.click(screen.getByRole("button", { name: /publikasikan/i }));

    await waitFor(() =>
      expect(screen.getByText(/melebihi ambang peringatan 15%/i)).toBeTruthy(),
    );
    const hasil = captured();
    expect(hasil).not.toBeNull();
  });

  it("menolak lebih dari 5 file foto", () => {
    const { inputBerkas } = renderForm();
    const berkas6 = Array.from({ length: 6 }, (_, i) =>
      berkasJpg(`foto-${i}.jpg`),
    );
    fireEvent.change(inputBerkas, { target: { files: berkas6 } });
    expect(screen.getByRole("alert").textContent).toContain("Maksimal 5 foto");
  });

  it("menolak file berekstensi .exe berkedok foto", () => {
    const { inputBerkas } = renderForm();
    fireEvent.change(inputBerkas, { target: { files: [berkasExe()] } });
    expect(screen.getByRole("alert").textContent).toContain(
      "harus JPG atau PNG",
    );
  });

  it("menolak file foto lebih dari 5 MB", () => {
    const { inputBerkas } = renderForm();
    const berkasBesar = new File(
      [new Uint8Array(6 * 1024 * 1024 + 1)],
      "besar.jpg",
      { type: "image/jpeg" },
    );
    fireEvent.change(inputBerkas, { target: { files: [berkasBesar] } });
    expect(screen.getByRole("alert").textContent).toContain("maksimal 5 MB");
  });

  it("terima 5 file JPG dan tidak menunjukkan error berkas", async () => {
    const { captured, inputBerkas } = renderForm();
    const berkas5 = Array.from({ length: 5 }, (_, i) =>
      berkasJpg(`foto-${i}.jpg`),
    );
    fireEvent.change(inputBerkas, { target: { files: berkas5 } });
    fireEvent.click(screen.getByRole("button", { name: /simpan draf/i }));

    expect(screen.queryByRole("alert")).toBeNull();
    await waitFor(() => expect(captured()).not.toBeNull());
    const hasil = captured();
    expect(hasil?.files).toHaveLength(5);
    expect(hasil?.mode).toBe("draft");
  });
});
