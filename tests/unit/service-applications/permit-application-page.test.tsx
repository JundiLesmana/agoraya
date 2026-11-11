import React from "react";
import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PermitApplicationPage from "@/app/(citizen)/citizen/apply/permit/page";

vi.mock("@/components/forms/location-picker", () => {
  return {
    LocationPicker: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => {
      const [selected, setSelected] = React.useState(value);
      React.useEffect(() => {
        setSelected(value);
      }, [value]);
      
      const handleSearch = () => {
        const mockLocation = {
          province: "DKI Jakarta",
          city: "Jakarta Pusat",
          kecamatan: "Kecamatan Menteng",
          kelurahan: "Kelurahan Menteng",
          address: "Jl. Menteng Raya No. 1, Menteng, Jakarta Pusat",
          latitude: -6.1944,
          longitude: 106.8229,
        };
        onChange(mockLocation);
        setSelected(mockLocation);
      };
      
      return (
        <div data-testid="location-picker">
          <input
            role="textbox"
            aria-label="Cari lokasi"
            placeholder="Cari alamat, kelurahan, atau patokan..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            value={selected ? `${selected.address}` : ""}
          />
          {selected && <div>Lokasi terpilih: {selected.address}</div>}
        </div>
      );
    },
  };
});

async function goToPermitAttachmentsStep() {
  fireEvent.click(
    screen.getByRole("radio", { name: /NIB \/ usaha mikro/i }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Pilih layanan" }));

  // Fill all required fields before location picker
  fireEvent.change(screen.getByRole("textbox", { name: "Nama pemohon *" }), {
    target: { value: "Budi" },
  });
  fireEvent.change(
    screen.getByRole("textbox", { name: "Kontak notifikasi *" }),
    {
      target: { value: "budi@example.com" },
    },
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Judul permohonan *" }), {
    target: { value: "Pengajuan NIB" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Nama usaha *" }), {
    target: { value: "Warung Budi" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Bidang usaha" }), {
    target: { value: "Perdagangan" },
  });
  fireEvent.change(
    screen.getByRole("textbox", { name: "Alamat kegiatan usaha *" }),
    { target: { value: "Jl. Melati 1" } },
  );
  fireEvent.change(
    screen.getByRole("combobox", { name: "Status kepemilikan tempat" }),
    { target: { value: "Milik sendiri" } },
  );
  fireEvent.change(
    screen.getByRole("textbox", { name: "Ceritakan kebutuhan Anda *" }),
    { target: { value: "Mohon bantu proses izin usaha mikro." } },
  );

  // Use the location picker search to select a location
  const locationSearch = screen.getByRole("textbox", { name: "Cari lokasi" });
  fireEvent.change(locationSearch, { target: { value: "Jakarta" } });
  fireEvent.keyDown(locationSearch, { key: "Enter" });
  // Wait for the location to be selected in the mock
  await waitFor(() => {
    screen.getByText(/Lokasi terpilih/i);
  });
  // Wait for parent state to propagate (React batched updates)
  await waitFor(() => {});

  fireEvent.click(
    screen.getByRole("button", { name: /Lanjut ke lampiran/i }),
  );
  // Wait for step to advance to attachments (step 3)
  await waitFor(() => {
    screen.getAllByRole("button", { name: "Unggah berkas" });
  });
}

describe("PermitApplicationPage", () => {
  it("shows per-document upload actions for permit attachments", async () => {
    render(<PermitApplicationPage />);

    await goToPermitAttachmentsStep();

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

  it("disables review until all required attachments are selected", async () => {
    render(<PermitApplicationPage />);

    await goToPermitAttachmentsStep();

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
