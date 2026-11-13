/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RegisterAsnForm } from "@/app/(auth)/register-asn/_components/register-asn-form";
import RegisterAsnPage from "@/app/(auth)/register-asn/page";
import { registerAsnSchema } from "@/modules/asn/schema";

const fetchMock = vi.hoisted(() => ({
  urls: [] as string[],
  bodies: [] as Array<string | undefined>,
}));

beforeEach(() => {
  fetchMock.urls = [];
  fetchMock.bodies = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchMock.urls.push(String(input));
      fetchMock.bodies.push(
        typeof init?.body === "string" ? init.body : undefined,
      );
      return new Response(
        JSON.stringify({
          ok: true,
          success: true,
          message:
            String(input).includes("/step1")
              ? "Identitas tersimpan."
              : "Pendaftaran berhasil.",
          data:
            String(input).includes("/step1")
              ? { userId: "11111111-1111-1111-1111-111111111111" }
              : {
                  email: "rani@example.id",
                  status: "pending_approval",
                },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function fillIdentityStep() {
  const values: Record<string, string> = {
    fullName: "Rani Pratama",
    nik: "3273010101010001",
    birthPlace: "Bandung",
    birthDate: "1990-01-01",
    email: "Rani@Example.id",
    phone: "081234567890",
    password: "AmanPassword!123",
    confirmPassword: "AmanPassword!123",
  };

  for (const [id, value] of Object.entries(values)) {
    fireEvent.change(document.getElementById(id) as HTMLInputElement, {
      target: { value },
    });
  }
}

function uploadPdf(container: HTMLElement, id: string, name: string) {
  const input = container.querySelector<HTMLInputElement>(`#${id}`);
  if (!input) throw new Error(`Input #${id} tidak ditemukan`);

  fireEvent.change(input, {
    target: {
      files: [new File(["dokumen uji"], name, { type: "application/pdf" })],
    },
  });
}

function expectHeroStep(step: number, title: string, description: string) {
  expect(screen.getByText(`LANGKAH ${step} DARI 5`)).toBeDefined();
  expect(screen.getByRole("heading", { level: 1, name: title })).toBeDefined();
  expect(screen.getByText(description)).toBeDefined();
}

describe("RegisterAsnForm — alur lima langkah", () => {
  it("memvalidasi identitas, instansi, alamat, dokumen, dan mengirim pengajuan", async () => {
    const onStepChange = vi.fn();
    const onSuccess = vi.fn();
    const { container } = render(
      <RegisterAsnForm onStepChange={onStepChange} onSuccess={onSuccess} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Lanjut →" }));
    expect(screen.getByText("NIK harus 16 digit angka")).toBeDefined();
    expect(fetchMock.urls).toHaveLength(0);

    fillIdentityStep();
    fireEvent.click(screen.getByRole("button", { name: "Lanjut →" }));
    expect(
      screen.getByRole("heading", { name: "Status kepegawaian" }),
    ).toBeDefined();
    expect(onStepChange).toHaveBeenLastCalledWith(2, [1]);

    fireEvent.click(screen.getByRole("button", { name: "Lanjut →" }));
    expect(screen.getByText("NIP harus 18 digit angka")).toBeDefined();
    expect(fetchMock.urls).toHaveLength(1);

    fireEvent.change(document.getElementById("nip") as HTMLInputElement, {
      target: { value: "198501012010011001" },
    });
    fireEvent.change(
      document.getElementById("rankGradePns") as HTMLSelectElement,
      { target: { value: "Penata/I-C" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Lanjut →" }));
    await screen.findByRole("heading", { name: "Alamat sesuai KTP" });
    expect(fetchMock.urls).toContain("/api/asn/register/step2");

    fireEvent.click(screen.getByRole("button", { name: "Lanjut →" }));
    expect(
      screen.getByText("Alamat jalan domisili minimal 10 karakter"),
    ).toBeDefined();
    expect(fetchMock.urls).toHaveLength(4);

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Alamat domisili sama dengan alamat KTP",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Lanjut →" }));
    await screen.findByRole("heading", { name: "KTP *" });
    expect(fetchMock.urls).toContain("/api/asn/register/step3");

    fireEvent.click(screen.getByRole("button", { name: "Lanjut →" }));
    expect(screen.getByText("KTP wajib diunggah")).toBeDefined();

    uploadPdf(container, "ktpUpload", "ktp.pdf");
    uploadPdf(container, "skUpload", "sk-pengangkatan.pdf");
    uploadPdf(container, "idCardUpload", "kartu-pegawai.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Lanjut →" }));
    await screen.findByRole("heading", { name: "Identitas & akun" });

    const submitButton = screen.getByRole("button", {
      name: "Kirim pengajuan",
    });
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(
      screen.getByRole("checkbox", { name: /Saya menyatakan data/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Kirim pengajuan" }));

    await screen.findByRole("heading", {
      name: "Terima kasih, Rani Pratama.",
    });
    expect(fetchMock.urls).toContain("/api/asn/register");
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Rani Pratama",
        email: "rani@example.id",
        status: "pending_approval",
      }),
    );
    const registrationPayload = JSON.parse(
      fetchMock.bodies[fetchMock.urls.indexOf("/api/asn/register")] ?? "{}",
    ) as Record<string, unknown>;
    expect(registerAsnSchema.safeParse(registrationPayload).success).toBe(true);
    expect(registrationPayload).toMatchObject({
      employmentStatus: "PNS",
      nip: "198501012010011001",
      rankGradePns: "Penata/I-C",
      agencyType: "Instansi daerah",
      field: "Pengelolaan Data dan Statistik",
      positionType: "Jabatan fungsional",
      domicileSameAsKtp: true,
      domicileAddress: "Jl. Melati No. 23, Blok A",
      idCardFileName: "kartu-pegawai.pdf",
    });
    expect(onStepChange).toHaveBeenCalledTimes(4);
  });

  it("menolak file dengan tipe yang tidak didukung pada langkah dokumen", () => {
    const { container } = render(<RegisterAsnForm initialStep={4} />);
    uploadPdf(container, "ktpUpload", "ktp.pdf");

    const skUpload = container.querySelector<HTMLInputElement>("#skUpload");
    if (!skUpload) throw new Error("Input #skUpload tidak ditemukan");
    fireEvent.change(skUpload, {
      target: {
        files: [new File(["dokumen"], "dokumen.txt", { type: "text/plain" })],
      },
    });

    expect(
      screen.getByText("Format file tidak valid. Gunakan JPG, PNG, atau PDF."),
    ).toBeDefined();
  });

  it("shows all five hero states and keeps them in sync while navigating back", async () => {
    const { container } = render(<RegisterAsnPage />);

    expectHeroStep(
      1,
      "Mari mulai dari identitas Anda",
      "Gunakan data sesuai KTP dan kontak aktif agar proses verifikasi lebih mudah.",
    );
    fillIdentityStep();
    fireEvent.click(screen.getByRole("button", { name: "Lanjut →" }));
    expectHeroStep(
      2,
      "Hubungkan dengan instansi Anda",
      "Data ini membantu admin mencocokkan penempatan dan menentukan akses yang sesuai.",
    );

    fireEvent.change(document.getElementById("nip") as HTMLInputElement, {
      target: { value: "198501012010011001" },
    });
    fireEvent.change(
      document.getElementById("rankGradePns") as HTMLSelectElement,
      { target: { value: "Penata/I-C" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Lanjut →" }));
    await screen.findByRole("heading", { name: "Alamat sesuai KTP" });
    expectHeroStep(
      3,
      "Lengkapi informasi alamat",
      "Pisahkan alamat sesuai KTP dan tempat tinggal saat ini agar data administrasi tetap akurat.",
    );

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Alamat domisili sama dengan alamat KTP",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Lanjut →" }));
    await screen.findByRole("heading", { name: "KTP *" });
    expectHeroStep(
      4,
      "Unggah dokumen verifikasi",
      "Unggah dokumen yang jelas dan terbaca agar petugas dapat memverifikasi data Anda.",
    );

    uploadPdf(container, "ktpUpload", "ktp.pdf");
    uploadPdf(container, "skUpload", "sk-pengangkatan.pdf");
    uploadPdf(container, "idCardUpload", "kartu-pegawai.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Lanjut →" }));
    await screen.findByRole("heading", { name: "Identitas & akun" });
    expectHeroStep(
      5,
      "Tinjau & persetujuan",
      "Periksa kembali data Anda sebelum mengirim pengajuan. Anda masih dapat mengedit setiap bagian.",
    );

    const backButton = () => screen.getByRole("button", { name: "Kembali" });
    fireEvent.click(backButton());
    expectHeroStep(
      4,
      "Unggah dokumen verifikasi",
      "Unggah dokumen yang jelas dan terbaca agar petugas dapat memverifikasi data Anda.",
    );
    fireEvent.click(backButton());
    expectHeroStep(
      3,
      "Lengkapi informasi alamat",
      "Pisahkan alamat sesuai KTP dan tempat tinggal saat ini agar data administrasi tetap akurat.",
    );
    fireEvent.click(backButton());
    expectHeroStep(
      2,
      "Hubungkan dengan instansi Anda",
      "Data ini membantu admin mencocokkan penempatan dan menentukan akses yang sesuai.",
    );
    fireEvent.click(backButton());
    expectHeroStep(
      1,
      "Mari mulai dari identitas Anda",
      "Gunakan data sesuai KTP dan kontak aktif agar proses verifikasi lebih mudah.",
    );
  });
});
