import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServiceApplicationWizard } from "@/app/(citizen)/citizen/apply/_components/service-application-wizard";

describe("ServiceApplicationWizard", () => {
  it("searches and filters the service catalog", () => {
    render(<ServiceApplicationWizard />);

    expect(
      screen.getByRole("heading", { name: "Ajukan Layanan Publik" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }).textContent,
    ).toContain("Ajukan Layanan");
    expect(
      screen
        .getByRole("link", { name: /Kembali ke pelacakan/ })
        .getAttribute("href"),
    ).toBe("/tracking");
    fireEvent.click(screen.getByRole("button", { name: "Simpan draft" }));
    expect(screen.getByRole("status").textContent).toContain(
      "Fitur simpan draft belum tersedia",
    );
    expect(screen.getByText("Izin usaha mikro")).toBeTruthy();

    fireEvent.change(screen.getByRole("textbox", { name: "Cari layanan" }), {
      target: { value: "pendidikan" },
    });
    expect(screen.getByText("Bantuan pendidikan")).toBeTruthy();
    expect(screen.queryByText("Izin usaha mikro")).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Cari layanan" }), {
      target: { value: "" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter kategori layanan" }),
      {
        target: { value: "Perizinan" },
      },
    );
    expect(screen.getByText("Izin usaha mikro")).toBeTruthy();
    expect(screen.queryByText("Bantuan pendidikan")).toBeNull();
  });

  it("walks through details, document upload, review, and simulated success", () => {
    render(<ServiceApplicationWizard />);

    fireEvent.click(
      screen.getByRole("button", { name: /Pengaduan fasilitas umum/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Pilih layanan" }));
    expect(screen.getByRole("heading", { name: "Data & Detail" })).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: "Nama pemohon" }),
    ).toHaveProperty("value", "Budi Santoso (SIMULATED)");
    const emailField = screen.getByRole("textbox", { name: "Email" });
    fireEvent.change(emailField, { target: { value: "invalid-email" } });
    expect(screen.getByRole("alert").textContent).toContain(
      "format yang benar",
    );
    fireEvent.change(emailField, {
      target: { value: "warga.simulasi@example.test" },
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Judul pengaduan" }), {
      target: { value: "Lampu jalan padam" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Alamat atau lokasi kejadian" }),
      {
        target: { value: "Jl. Melati" },
      },
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Ceritakan detail" }),
      {
        target: { value: "Lampu jalan di depan taman tidak menyala." },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Lanjut ke dokumen" }));

    const document = new File(["sample"], "foto.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText("Pilih dokumen pendukung"), {
      target: { files: [document] },
    });
    expect(screen.getByText("foto.jpg")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tinjau pengajuan" }));

    const review = screen.getByRole("region", {
      name: "Periksa kembali pengajuan Anda",
    });
    expect(within(review).getByText("Lampu jalan padam")).toBeTruthy();
    expect(within(review).getByText("foto.jpg")).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Kirim simulasi" }));

    expect(screen.getByText("Pengajuan berhasil disimulasikan")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Lacak Pengajuan/ })
        .getAttribute("href"),
    ).toBe("/tracking");
  });

  it("rejects unsupported document formats in the upload step", () => {
    render(<ServiceApplicationWizard />);
    fireEvent.click(
      screen.getByRole("button", { name: /Pengaduan fasilitas umum/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Pilih layanan" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Judul pengaduan" }), {
      target: { value: "Lampu jalan padam" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Alamat atau lokasi kejadian" }),
      {
        target: { value: "Jl. Melati" },
      },
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Ceritakan detail" }),
      {
        target: { value: "Lampu jalan padam sejak tadi malam." },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Lanjut ke dokumen" }));

    fireEvent.change(screen.getByLabelText("Pilih dokumen pendukung"), {
      target: {
        files: [
          new File(["bad"], "payload.exe", {
            type: "application/octet-stream",
          }),
        ],
      },
    });
    expect(screen.getByRole("alert").textContent).toContain("PDF atau JPG");
    expect(screen.queryByText("payload.exe")).toBeNull();
  });
});
