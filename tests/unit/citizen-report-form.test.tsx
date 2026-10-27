/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReportForm } from "@/app/(citizen)/citizen/reporting/_components/report-form";

function completeDetails() {
  fireEvent.change(screen.getByLabelText(/judul laporan/i), {
    target: { value: "Jalan berlubang di Jalan Melati" },
  });
  fireEvent.change(screen.getByLabelText(/detail masalah/i), {
    target: {
      value:
        "Jalan berlubang cukup besar dan sudah beberapa kali menyebabkan pengendara hampir terjatuh.",
    },
  });
  fireEvent.change(screen.getByLabelText(/kategori laporan/i), {
    target: { value: "Jalan rusak" },
  });
  fireEvent.change(screen.getByLabelText(/provinsi/i), {
    target: { value: "Jawa Barat" },
  });
  fireEvent.change(screen.getByLabelText(/kabupaten \/ kota/i), {
    target: { value: "Kota Bandung" },
  });
  fireEvent.change(screen.getByLabelText(/alamat \/ patokan lokasi/i), {
    target: { value: "Jl. Melati, Kelurahan Sukamaju" },
  });
}

function advanceToAttachments() {
  completeDetails();
  fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));
}

describe("ReportForm", () => {
  it("starts at details when given a valid category", () => {
    render(<ReportForm initialCategory="Infrastruktur" />);

    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "2",
    );
    expect(
      screen.getByRole("heading", { name: "Detail masalah" }),
    ).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Infrastruktur" })).toBeNull();
    expect(
      screen.getByRole("button", { name: /lanjut/i }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("requires a category before continuing", () => {
    render(<ReportForm />);
    expect(
      screen.getByRole("button", { name: /lanjut/i }).hasAttribute("disabled"),
    ).toBe(true);
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.queryByRole("radio", { name: "Layanan lainnya" })).toBeNull();
  });

  it("keeps an invalid initial category on the category step", () => {
    render(<ReportForm initialCategory="Tidak dikenal" />);

    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "1",
    );
    expect(screen.getByRole("radio", { name: "Infrastruktur" })).toBeTruthy();
  });

  it("validates detail fields in real time and allows returning to a previous step", () => {
    render(<ReportForm />);
    fireEvent.click(screen.getByRole("radio", { name: "Infrastruktur" }));
    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));

    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "2",
    );
    const nextButton = screen.getByRole("button", { name: /lanjut/i });
    expect(nextButton.hasAttribute("disabled")).toBe(true);

    completeDetails();

    expect(nextButton.hasAttribute("disabled")).toBe(false);
    fireEvent.click(nextButton);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "3",
    );
    fireEvent.click(screen.getByRole("button", { name: /kembali/i }));
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "2",
    );
    expect(screen.getByLabelText(/judul laporan/i)).toHaveProperty(
      "value",
      "Jalan berlubang di Jalan Melati",
    );
  });

  it("rejects unsupported attachments, previews valid images, and removes files", () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: () => "blob:report-photo",
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: () => undefined,
    });

    try {
      const { container } = render(
        <ReportForm initialCategory="Infrastruktur" />,
      );
      advanceToAttachments();

      const input = container.querySelector('input[type="file"]');
      expect(input).toBeTruthy();
      if (!input) return;
      fireEvent.change(input, {
        target: {
          files: [
            new File(["image"], "bukti.gif", { type: "image/gif" }),
            new File(["photo"], "jalan.jpg", { type: "image/jpeg" }),
          ],
        },
      });

      expect(screen.getByRole("alert").textContent).toContain(
        "format harus JPG, PNG, MP4, atau PDF",
      );
      expect(screen.getByAltText("Pratinjau jalan.jpg")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Hapus jalan.jpg" }));
      expect(screen.queryByText("jalan.jpg")).toBeNull();
    } finally {
      if (originalCreate) {
        Object.defineProperty(URL, "createObjectURL", {
          configurable: true,
          value: originalCreate,
        });
      } else {
        Reflect.deleteProperty(URL, "createObjectURL");
      }
      if (originalRevoke) {
        Object.defineProperty(URL, "revokeObjectURL", {
          configurable: true,
          value: originalRevoke,
        });
      } else {
        Reflect.deleteProperty(URL, "revokeObjectURL");
      }
    }
  });

  it("enforces the 10 MB per-file and five-file limits", () => {
    const { container } = render(
      <ReportForm initialCategory="Infrastruktur" />,
    );
    advanceToAttachments();
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
    if (!input) return;

    fireEvent.change(input, {
      target: {
        files: [
          new File([new Uint8Array(10 * 1024 * 1024 + 1)], "besar.jpg", {
            type: "image/jpeg",
          }),
        ],
      },
    });
    expect(screen.getByRole("alert").textContent).toContain(
      "ukuran file melebihi 10 MB",
    );

    fireEvent.change(input, {
      target: {
        files: Array.from(
          { length: 6 },
          (_, index) =>
            new File(["dokumen"], `bukti-${index}.pdf`, {
              type: "application/pdf",
            }),
        ),
      },
    });
    expect(screen.getByRole("alert").textContent).toContain("Maksimal 5 file");
    expect(
      screen.getByRole("list", { name: "Bukti yang dipilih" }).children,
    ).toHaveLength(5);
  });

  it("requires valid contact details and never reports a false submission success", () => {
    render(<ReportForm initialCategory="Infrastruktur" />);
    completeDetails();
    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));
    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));

    const submitButton = screen.getByRole("button", {
      name: /submit laporan/i,
    });
    expect(submitButton.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "warga@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/no hp/i), {
      target: { value: "081234567890" },
    });
    expect(submitButton.hasAttribute("disabled")).toBe(false);

    fireEvent.click(submitButton);
    expect(screen.getByRole("alert").textContent).toContain(
      "Pengiriman laporan belum tersedia",
    );
    expect(screen.queryByText(/laporan terkirim/i)).toBeNull();
  });
});
