import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PermitApplicationPage from "@/app/(citizen)/citizen/apply/permit/page";

function goToPermitAttachmentsStep() {
  fireEvent.click(
    screen.getByRole("radio", { name: /NIB \/ usaha mikro/i }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Pilih layanan" }));

  fireEvent.change(screen.getByRole("textbox", { name: "Nama pemohon *" }), {
    target: { value: "Budi" },
  });
  fireEvent.change(
    screen.getByRole("textbox", { name: "Kontak notifikasi *" }),
    {
      target: { value: "budi@example.com" },
    },
  );
  fireEvent.change(screen.getByRole("combobox", { name: "Kecamatan domisili" }), {
    target: { value: "Kecamatan Melati" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Kelurahan / desa" }), {
    target: { value: "Kelurahan Melati" },
  });
  fireEvent.change(
    screen.getByRole("textbox", { name: "Judul permohonan *" }),
    {
      target: { value: "Pengajuan NIB" },
    },
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Nama usaha *" }), {
    target: { value: "Warung Budi" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Bidang usaha" }), {
    target: { value: "Perdagangan" },
  });
  fireEvent.change(
    screen.getByRole("textbox", { name: "Alamat kegiatan usaha *" }),
    {
      target: { value: "Jl. Melati 1" },
    },
  );
  fireEvent.change(
    screen.getByRole("combobox", { name: "Status kepemilikan tempat" }),
    {
      target: { value: "Milik sendiri" },
    },
  );
  fireEvent.change(
    screen.getByRole("textbox", { name: "Ceritakan kebutuhan Anda *" }),
    {
      target: { value: "Mohon bantu proses izin usaha mikro." },
    },
  );

  fireEvent.click(
    screen.getByRole("button", { name: /Lanjut ke lampiran/i }),
  );
}

describe("PermitApplicationPage", () => {
  it("shows per-document upload actions for permit attachments", () => {
    render(<PermitApplicationPage />);

    goToPermitAttachmentsStep();

    expect(
      screen.getAllByRole("button", { name: "Unggah berkas" }).length,
    ).toBe(2);
    expect(
      screen.getByLabelText("Unggah KTP pemohon"),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Unggah Dokumen alamat usaha"),
    ).toBeTruthy();
  });

  it("disables review until all required attachments are selected", () => {
    render(<PermitApplicationPage />);

    goToPermitAttachmentsStep();

    const reviewButton = screen.getByRole("button", {
      name: /Tinjau pengajuan/i,
    });
    expect(reviewButton).toHaveProperty("disabled", true);

    const ktpInput = screen.getByLabelText("Unggah KTP pemohon");
    const addressInput = screen.getByLabelText("Unggah Dokumen alamat usaha");

    if (!(ktpInput instanceof HTMLInputElement)) {
      throw new Error("Expected KTP upload control to be an input element.");
    }
    if (!(addressInput instanceof HTMLInputElement)) {
      throw new Error("Expected address upload control to be an input element.");
    }

    fireEvent.change(ktpInput, {
      target: {
        files: [new File(["ktp"], "ktp-budi.pdf", { type: "application/pdf" })],
      },
    });
    expect(reviewButton).toHaveProperty("disabled", true);

    fireEvent.change(addressInput, {
      target: {
        files: [
          new File(["alamat"], "alamat-usaha.jpg", { type: "image/jpeg" }),
        ],
      },
    });

    expect(reviewButton).toHaveProperty("disabled", false);
    fireEvent.click(reviewButton);

    expect(screen.getByText("ktp-budi.pdf, alamat-usaha.jpg")).toBeTruthy();
  });
});
