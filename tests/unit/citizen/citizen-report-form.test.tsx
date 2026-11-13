/** @vitest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import React, { useState } from "react";
import { ReportForm } from "@/app/(citizen)/citizen/reporting/_components/report-form";

// Mock the LocationPicker component for testing
vi.mock("@/components/forms/location-picker", () => ({
  LocationPicker: function MockLocationPicker({
    value,
    onChange,
  }: {
    value: { province: string; city: string; address: string; latitude: number; longitude: number } | null;
    onChange: (value: { province: string; city: string; address: string; latitude: number; longitude: number } | null) => void;
  }) {
    const [searchValue, setSearchValue] = useState("");
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && searchValue.trim()) {
        const location = {
          province: "Jawa Barat",
          city: "Kota Bandung",
          address: "Jl. Melati, Kelurahan Sukamaju",
          latitude: -6.9175,
          longitude: 107.6191,
        };
        onChange(location);
      }
    };
    return (
      <div data-testid="location-picker" className="space-y-3">
        <label htmlFor="location-search" className="sr-only">
          Cari lokasi
        </label>
        <input
          id="location-search"
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Cari alamat, kelurahan, atau patokan..."
          aria-label="Cari lokasi"
          data-testid="location-search-input"
        />
        {value && (
          <div className="bg-muted/50 rounded p-3 text-xs" data-testid="selected-location">
            <p>Provinsi: {value.province}</p>
            <p>Kabupaten/Kota: {value.city}</p>
            <p>Alamat: {value.address}</p>
            <p>Koordinat: {value.latitude}, {value.longitude}</p>
          </div>
        )}
      </div>
    );
  },
}));

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
  // Use the mocked location picker search input to select a location
  const locationSearch = screen.getByTestId("location-search-input");
  fireEvent.change(locationSearch, { target: { value: "Jawa Barat, Bandung" } });
  fireEvent.keyDown(locationSearch, { key: "Enter", code: "Enter" });
}

function advanceToAttachments() {
  completeDetails();
  fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));
}

describe("ReportForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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
    expect(screen.getByRole("radio", { name: /Infrastruktur/ })).toBeTruthy();
  });

  it("validates detail fields in real time and allows returning to a previous step", () => {
    render(<ReportForm />);
    fireEvent.click(screen.getByRole("radio", { name: /Infrastruktur/ }));
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

  it("saves all report fields and displays the persisted report number", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reportNumber: "LP-20261106-ABC123",
        submittedAt: "2026-11-06T00:00:00.000Z",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ReportForm initialCategory="Infrastruktur" />);
    completeDetails();
    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));
    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));

    const submitButton = screen.getByRole("button", {
      name: /submit laporan/i,
    });
    expect(submitButton.hasAttribute("disabled")).toBe(true);
    expect(screen.queryByLabelText(/email/i)).toBeNull();
    expect(screen.queryByLabelText(/no hp/i)).toBeNull();

    fireEvent.change(screen.getByLabelText(/nama samaran anda/i), {
      target: { value: "Melati Senja" },
    });
    expect(submitButton.hasAttribute("disabled")).toBe(false);

    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain(
        "LP-20261106-ABC123",
      );
    });
    const trackingLink = screen
      .getByRole("status")
      .querySelector<HTMLAnchorElement>(
        'a[href="/report/tracking?reportNumber=LP-20261106-ABC123"]',
      );
    expect(trackingLink).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/reports",
      expect.objectContaining({ method: "POST" }),
    );
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody).toMatchObject({
      category: "Infrastruktur",
      subcategory: "Jalan rusak",
      title: "Jalan berlubang di Jalan Melati",
      location: expect.objectContaining({
        province: expect.any(String),
        city: expect.any(String),
        address: expect.any(String),
        latitude: expect.any(Number),
        longitude: expect.any(Number),
      }),
      name: "Melati Senja",
      isPublic: true,
      showIdentity: false,
      attachments: [],
    });
    expect(requestBody).not.toHaveProperty("email");
    expect(requestBody).not.toHaveProperty("phone");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
