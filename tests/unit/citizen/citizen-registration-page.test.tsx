/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import RegisterCitizenPage from "@/app/(auth)/register-citizen/page";

const fetchMock = vi.hoisted(() => ({
  response: null as Response | null,
  error: null as Error | null,
}));

vi.stubGlobal(
  "fetch",
  vi.fn(async () => {
    if (fetchMock.error) throw fetchMock.error;
    if (!fetchMock.response) {
      return new Response(JSON.stringify({ ok: false, error: "Server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    return fetchMock.response;
  }),
);

beforeEach(() => {
  fetchMock.response = new Response(
    JSON.stringify({
      ok: true,
      message: "Pendaftaran warga berhasil.",
      data: {
        nik: "3273010101010001",
        email: "budi@example.id",
        status: "pending",
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
  fetchMock.error = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function fileFromText(name: string, type: string, text: string): File {
  return new File([text], name, { type });
}

function mockImageCompression() {
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => ({ width: 100, height: 100, close: vi.fn() })),
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    (callback) =>
      callback(new Blob(["compressed-image"], { type: "image/jpeg" })),
  );
}

describe("RegisterCitizenPage", () => {
  it("renders the registration form with all required fields", () => {
    render(<RegisterCitizenPage />);

    expect(
      screen.getByRole("heading", { name: /Daftar sebagai warga Agoraya/i }),
    ).toBeDefined();
    expect(screen.getByLabelText(/NIK \(16 digit\)/i)).toBeDefined();
    expect(screen.getByLabelText(/Nama lengkap/i)).toBeDefined();
    expect(screen.getByLabelText(/Email/i)).toBeDefined();
    expect(screen.getByLabelText(/Nomor telepon/i)).toBeDefined();
    expect(screen.getByLabelText(/Kata sandi/i)).toBeDefined();
    expect(screen.getByLabelText(/Foto KTP/i)).toBeDefined();
    expect(screen.getByLabelText(/Foto selfie/i)).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Daftar Akun Warga/i }),
    ).toBeDefined();
  });

  it("shows an error when submitted without attachment", async () => {
    render(<RegisterCitizenPage />);

    fireEvent.change(screen.getByLabelText(/NIK \(16 digit\)/i), {
      target: { value: "3273010101010001" },
    });
    fireEvent.change(screen.getByLabelText(/Nama lengkap/i), {
      target: { value: "Budi Santoso" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "budi@example.id" },
    });
    fireEvent.change(screen.getByLabelText(/Nomor telepon/i), {
      target: { value: "081234567890" },
    });
    fireEvent.change(screen.getByLabelText(/Kata sandi/i), {
      target: { value: "rahasia123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Daftar Akun Warga/i }));

    const alert = screen.getByRole("alert");
    expect((alert.textContent ?? "")).toMatch(
      /Silakan unggah foto KTP dan foto selfie/,
    );
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("shows a preview when an image is selected", () => {
    render(<RegisterCitizenPage />);

    const input = screen.getByLabelText(/Foto KTP/i) as HTMLInputElement;
    const file = fileFromText("ktp.jpg", "image/jpeg", "fake-image-bytes");

    vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:mock-url");

    fireEvent.change(input, { target: { files: [file] } });

    const preview = screen.getByAltText(/Pratinjau foto ktp/i);
    expect(preview.getAttribute("src")).toBe("blob:mock-url");
    expect(screen.getByText(/ktp\.jpg/i)).toBeDefined();
  });

  it("rejects non-image and oversized files", () => {
    render(<RegisterCitizenPage />);

    fireEvent.change(screen.getByLabelText(/Foto KTP/i), {
      target: { files: [fileFromText("not-image.txt", "text/plain", "text")] },
    });
    expect(screen.getByText(/Gunakan foto JPG, PNG, atau WEBP/i)).toBeDefined();

    fireEvent.change(screen.getByLabelText(/Foto selfie/i), {
      target: {
        files: [
          new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
            type: "image/png",
          }),
        ],
      },
    });
    expect(screen.getByText(/Ukuran foto maksimal 5 MB/i)).toBeDefined();
  });

  it("submits registration and shows success state", async () => {
    render(<RegisterCitizenPage />);

    fireEvent.change(screen.getByLabelText(/NIK \(16 digit\)/i), {
      target: { value: "3273010101010001" },
    });
    fireEvent.change(screen.getByLabelText(/Nama lengkap/i), {
      target: { value: "Budi Santoso" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "budi@example.id" },
    });
    fireEvent.change(screen.getByLabelText(/Nomor telepon/i), {
      target: { value: "081234567890" },
    });
    fireEvent.change(screen.getByLabelText(/Kata sandi/i), {
      target: { value: "rahasia123" },
    });

    vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:mock-url");
    fireEvent.change(screen.getByLabelText(/Foto KTP/i), {
      target: { files: [fileFromText("ktp.jpg", "image/jpeg", "ktp-bytes")] },
    });
    fireEvent.change(screen.getByLabelText(/Foto selfie/i), {
      target: {
        files: [fileFromText("selfie.png", "image/png", "selfie-bytes")],
      },
    });

    mockImageCompression();
    fireEvent.click(screen.getByRole("button", { name: /Daftar Akun Warga/i }));

    await vi.waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Pendaftaran berhasil/i }),
      ).toBeDefined();
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/citizen/register");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body.nik).toBe("3273010101010001");
    expect(body.email).toBe("budi@example.id");
    expect(body.attachment).toContain("data:image/jpeg;base64,");
    expect(body.selfie).toContain("data:image/jpeg;base64,");
    expect(body.attachmentFileName).toBe("ktp.jpg");
    expect(body.selfieFileName).toBe("selfie.jpg");
  });

  it("shows API error when registration fails", async () => {
    fetchMock.response = new Response(
      JSON.stringify({ error: "NIK telah terdaftar." }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );

    render(<RegisterCitizenPage />);

    fireEvent.change(screen.getByLabelText(/NIK \(16 digit\)/i), {
      target: { value: "3273010101010001" },
    });
    fireEvent.change(screen.getByLabelText(/Nama lengkap/i), {
      target: { value: "Budi Santoso" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "budi@example.id" },
    });
    fireEvent.change(screen.getByLabelText(/Nomor telepon/i), {
      target: { value: "081234567890" },
    });
    fireEvent.change(screen.getByLabelText(/Kata sandi/i), {
      target: { value: "rahasia123" },
    });

    vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:mock-url");
    fireEvent.change(screen.getByLabelText(/Foto KTP/i), {
      target: { files: [fileFromText("ktp.jpg", "image/jpeg", "ktp-bytes")] },
    });
    fireEvent.change(screen.getByLabelText(/Foto selfie/i), {
      target: {
        files: [fileFromText("selfie.png", "image/png", "selfie-bytes")],
      },
    });

    mockImageCompression();
    fireEvent.click(screen.getByRole("button", { name: /Daftar Akun Warga/i }));

    await vi.waitFor(() => {
      const alert = screen.getByRole("alert");
      expect((alert.textContent ?? "")).toMatch(/NIK telah terdaftar/);
    });
  });
});
