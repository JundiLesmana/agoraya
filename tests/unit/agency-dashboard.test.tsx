import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgencyDashboard } from "@/app/(asn)/asn/reporting/_components/agency-dashboard";
import {
  maskApplicantName,
  maskNik,
  maskPhone,
} from "@/app/(asn)/asn/reporting/_components/agency-dashboard-data";

describe("agency applicant masking", () => {
  it("masks NIK and phone numbers while retaining only their last four digits", () => {
    expect(maskNik("0000000000001001")).toBe("••••••••••••1001");
    expect(maskPhone("080000000101")).toBe("••••••••0101");
  });

  it("masks short values completely", () => {
    expect(maskNik("1234")).toBe("••••");
    expect(maskPhone("12")).toBe("••");
  });

  it("masks applicant names after the first name", () => {
    expect(maskApplicantName("Siti Contoh")).toBe("Siti C***");
  });
});

describe("AgencyDashboard", () => {
  it("renders summary cards and masks identifying details in the list", () => {
    render(<AgencyDashboard />);

    expect(screen.getByText("Total pengajuan masuk")).toBeTruthy();
    expect(screen.getByText("Sedang diproses")).toBeTruthy();
    expect(screen.getByText("Perlu tindakan")).toBeTruthy();
    expect(screen.getAllByText("Selesai").length).toBeGreaterThan(0);

    const table = screen.getByRole("table", {
      name: "Daftar pengajuan layanan instansi",
    });
    expect(within(table).getByText("PGD-261027-00128")).toBeTruthy();
    expect(within(table).getByText(/NIK •{12}1001/)).toBeTruthy();
    expect(within(table).queryByText("0000000000001001")).toBeNull();
  });

  it("searches and filters by applicant, tracking number, status, and service type", () => {
    render(<AgencyDashboard />);
    const table = screen.getByRole("table", {
      name: "Daftar pengajuan layanan instansi",
    });
    const search = screen.getByRole("textbox", {
      name: "Cari nomor pelacakan atau nama pemohon",
    });

    fireEvent.change(search, { target: { value: "PGD-261026-00035" } });
    expect(within(table).getByText("Rambu lalu lintas rusak")).toBeTruthy();
    expect(
      within(table).queryByText("Lampu jalan padam di Jl. Melati"),
    ).toBeNull();

    fireEvent.change(search, { target: { value: "Siti Contoh" } });
    expect(within(table).getByText("Permintaan perbaikan halte")).toBeTruthy();

    fireEvent.change(search, { target: { value: "" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Filter status" }), {
      target: { value: "Perlu Dokumen" },
    });
    expect(within(table).getByText("Permintaan perbaikan halte")).toBeTruthy();
    expect(within(table).queryByText("Rambu lalu lintas rusak")).toBeNull();

    fireEvent.change(screen.getByRole("combobox", { name: "Filter status" }), {
      target: { value: "all" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter jenis layanan" }),
      {
        target: { value: "Permohonan fasilitas" },
      },
    );
    expect(within(table).getByText("Permohonan zebra cross")).toBeTruthy();
    expect(
      within(table).queryByText("Lampu jalan padam di Jl. Melati"),
    ).toBeNull();
  });

  it("shows details, reveals sensitive mock data on request, and records a local status update", () => {
    render(<AgencyDashboard />);
    fireEvent.click(
      screen.getByRole("button", { name: "Lihat detail PGD-261027-00128" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Detail pengajuan" });
    expect(
      within(dialog).getByText("Foto lokasi dan titik lampu.jpg"),
    ).toBeTruthy();
    expect(within(dialog).getByText("••••••••••••1001")).toBeTruthy();
    expect(within(dialog).queryByText("0000000000001001")).toBeNull();
    expect(within(dialog).getByText("Warga S*** A***")).toBeTruthy();
    expect(within(dialog).queryByText("Warga Simulasi A")).toBeNull();

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Tampilkan data pemohon" }),
    );
    expect(within(dialog).getByText("0000000000001001")).toBeTruthy();
    expect(within(dialog).getByText("080000000101")).toBeTruthy();
    expect(within(dialog).getByText("Warga Simulasi A")).toBeTruthy();

    fireEvent.change(
      within(dialog).getByRole("combobox", { name: "Status pengajuan baru" }),
      {
        target: { value: "Selesai" },
      },
    );
    fireEvent.change(
      within(dialog).getByRole("combobox", { name: "Visibilitas catatan" }),
      {
        target: { value: "public" },
      },
    );
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: "Catatan tanggapan" }),
      {
        target: { value: "Perbaikan telah selesai." },
      },
    );
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Simpan pembaruan (simulasi)",
      }),
    );

    expect(
      within(dialog).getByText(
        "Pembaruan hanya tersimpan sementara di pratinjau ini.",
      ),
    ).toBeTruthy();
    expect(within(dialog).getByText("Perbaikan telah selesai.")).toBeTruthy();
    expect(within(dialog).getByText(/Catatan publik/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Tutup dialog" }));
    const table = screen.getByRole("table", {
      name: "Daftar pengajuan layanan instansi",
    });
    expect(within(table).getByText("PGD-261027-00128")).toBeTruthy();
    expect(within(table).getAllByText("Selesai").length).toBeGreaterThan(0);
  });

  it("does not allow editing an application already marked complete", () => {
    render(<AgencyDashboard />);
    fireEvent.click(
      screen.getByRole("button", { name: "Lihat detail PGD-261022-00011" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Detail pengajuan" });
    expect(
      within(dialog).getByText(/Pengajuan selesai dan tidak dapat diubah lagi/),
    ).toBeTruthy();
    expect(
      within(dialog).queryByRole("button", {
        name: "Simpan pembaruan (simulasi)",
      }),
    ).toBeNull();
  });

  it("shows a useful empty state when filters find no applications", () => {
    render(<AgencyDashboard />);
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "Cari nomor pelacakan atau nama pemohon",
      }),
      {
        target: { value: "tidak ada" },
      },
    );

    expect(screen.getByText("Pengajuan tidak ditemukan")).toBeTruthy();
  });
});
