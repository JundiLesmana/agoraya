import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import EducationApplicationPage from "@/app/(citizen)/citizen/apply/education/page";
import { EDUCATION_SERVICE_CATEGORY } from "@/app/(citizen)/citizen/apply/_components/education-service-data";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("EducationApplicationPage", () => {
  it("shows education service choices, disclaimers, and the help center", () => {
    render(<EducationApplicationPage />);

    expect(screen.getByRole("radio", { name: "Bantuan biaya" })).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: "Administrasi siswa" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: "Konsultasi pendidikan" }),
    ).toBeTruthy();
    expect(
      screen.getAllByText(EDUCATION_SERVICE_CATEGORY.disclaimer).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(EDUCATION_SERVICE_CATEGORY.infoBox)).toBeTruthy();
    expect(screen.getByText("Dinas Pendidikan")).toBeTruthy();

    expect(screen.getAllByText(/Butuh bantuan/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/08\.00.*16\.00/).length).toBeGreaterThan(0);
  });

  it("shows education-specific details for the selected assistance service", () => {
    render(<EducationApplicationPage />);

    fireEvent.click(screen.getByLabelText("Bantuan biaya"));

    expect(screen.getByRole("heading", { name: "Data pemohon" })).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Data siswa dan kebutuhan pendidikan",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: /Kontak notifikasi/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Kecamatan domisili *" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: /Ceritakan kebutuhan pendidikan/ }),
    ).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy();

    const applicantHeading = screen.getByRole("heading", {
      name: "Data pemohon",
    });
    const studentHeading = screen.getByRole("heading", {
      name: "Data siswa dan kebutuhan pendidikan",
    });
    expect(
      Boolean(
        applicantHeading.compareDocumentPosition(studentHeading) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
  }, 15000);

  it("shows administration-specific fields and mutasi copy", () => {
    render(<EducationApplicationPage />);

    fireEvent.click(screen.getByLabelText("Administrasi siswa"));

    expect(
      screen.getByRole("heading", {
        name: "Data Siswa, Sekolah & Kebutuhan Administrasi",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: /Judul pengajuan/ }),
    ).toHaveProperty(
      "value",
      "Permohonan Surat Keterangan Pindah / Mutasi Siswa",
    );
    expect(screen.getByRole("textbox", { name: /Nama sekolah/ })).toBeTruthy();
    const grade = screen.getByRole("combobox", {
      name: "Jenjang / kelas *",
    });
    fireEvent.change(grade, { target: { value: "SMP / Kelas VII" } });
    expect(grade).toHaveProperty("value", "SMP / Kelas VII");
    expect(
      screen.getByPlaceholderText(/Jelaskan kebutuhan administrasi siswa/),
    ).toBeTruthy();
    expect(screen.getByText(/Perlindungan data:/)).toBeTruthy();
  }, 15000);

  it("shows consultation questions, school context, and privacy guidance", () => {
    render(<EducationApplicationPage />);

    fireEvent.click(screen.getByLabelText("Konsultasi pendidikan"));

    expect(
      screen.getByRole("heading", {
        name: "Data Siswa & Pertanyaan Konsultasi",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: /Judul pengajuan/ }),
    ).toHaveProperty("value", "Konsultasi Pilihan Belajar & Dokumen Masuk SMP");
    expect(
      screen.getByPlaceholderText(
        /Ceritakan topik konsultasi, misalnya pilihan belajar/,
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Jenjang / kelas *" }),
    ).toBeTruthy();
    expect(screen.getByText(/Data pribadi hanya digunakan oleh/)).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Dokumen yang dapat disiapkan" }),
    ).toBeTruthy();
  }, 15000);

  it("navigates administrasi siswa to the review step with the attachment flow intact", async () => {
    render(<EducationApplicationPage />);

    fireEvent.click(screen.getByLabelText("Administrasi siswa"));
    fireEvent.change(screen.getByRole("textbox", { name: /Nama pemohon/ }), {
      target: { value: "Siti" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Kontak notifikasi/ }), {
      target: { value: "siti@example.com" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Kecamatan domisili *" }), {
      target: { value: "Kecamatan Melati" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Kelurahan \/ Desa/ }), {
      target: { value: "Kelurahan Melati" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Nama siswa/ }), {
      target: { value: "Rina" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Hubungan pemohon/ }), {
      target: { value: "Orang tua / wali" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Nama sekolah/ }), {
      target: { value: "SMP Negeri 1 Melati" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Jenjang / kelas *" }), {
      target: { value: "SMP / Kelas VIII" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: /Ceritakan kebutuhan layanan pendidikan/ }),
      { target: { value: "Meminta surat mutasi ke sekolah tujuan." } },
    );

    fireEvent.click(screen.getByRole("button", { name: "Lanjutkan" }));
    fireEvent.click(screen.getByRole("button", { name: "Lanjutkan" }));

    expect(screen.getByText("Langkah 4 dari 4")).toBeTruthy();
    expect(screen.getByText("Periksa kembali pengajuan Anda")).toBeTruthy();
    expect(screen.getByText("Lampiran")).toBeTruthy();
    expect(screen.getByText("Rina")).toBeTruthy();
  }, 15000);

  it("validates privacy, blocks NIK-like data, and shows success state", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Data mengandung informasi sensitif (NIK/KTP). Hapus atau gantikan sebelum mengirim." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<EducationApplicationPage />);

    fireEvent.click(screen.getByLabelText("Bantuan biaya"));
    fireEvent.change(screen.getByRole("textbox", { name: /Nama pemohon/ }), {
      target: { value: "Andi" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: /Kontak notifikasi/ }),
      { target: { value: "andi@example.com" } },
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Kecamatan domisili *" }),
      { target: { value: "Kecamatan Melati" } },
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: /Kelurahan \/ Desa/ }),
      { target: { value: "Kelurahan Melati" } },
    );
    fireEvent.change(screen.getByRole("textbox", { name: /Nama siswa/ }), {
      target: { value: "Siti" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: /Hubungan pemohon/ }),
      { target: { value: "Orang tua / wali" } },
    );
    fireEvent.change(screen.getByRole("textbox", { name: /Nama sekolah/ }), {
      target: { value: "SD Negeri Melati" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: /Jenjang pendidikan/ }),
      { target: { value: "SD / MI" } },
    );
    fireEvent.change(screen.getByRole("combobox", { name: /^Kelas/ }), {
      target: { value: "Kelas IV" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: /Ceritakan kebutuhan pendidikan/ }),
      { target: { value: "Membutuhkan perlengkapan sekolah." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Lanjutkan" }));
    fireEvent.click(screen.getByRole("button", { name: "Lanjutkan" }));

    expect(screen.getByText("Langkah 4 dari 4")).toBeTruthy();
    expect(screen.getByText("Data pemohon dan siswa")).toBeTruthy();
    expect(screen.getByText("Siti")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ubah data" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Preferensi tindak lanjut" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Jalur pembaruan" }),
    ).toHaveProperty("value", "Notifikasi akun + email");
    expect(
      screen.getByRole("combobox", { name: "Waktu dapat dihubungi" }),
    ).toHaveProperty("value", "Hari kerja, 08.00-16.00");

    fireEvent.change(screen.getByRole("textbox", { name: /Catatan/ }), {
      target: { value: "NISN 1234567890" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Kirim pengajuan/ }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/NIK|KTP|NISN/);
    expect(fetch).toHaveBeenCalledWith(
      "/api/education-applications",
      expect.objectContaining({ method: "POST" }),
    );
    expect(
      screen.queryByText("Pengajuan pendidikan berhasil disimulasikan"),
    ).toBeNull();
  }, 15000);
});
