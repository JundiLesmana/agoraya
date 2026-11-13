/** @vitest-environment jsdom */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { ProjectPrioritizationWorkspace } from "@/app/(asn)/asn/project/prioritization/_components/project-prioritization-workspace";
import type { DecisionRunSummary } from "@/modules/decision-engine/repository";
import type { ProjectDetail } from "@/modules/project-progress/types";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function runsBody(runs: readonly Record<string, unknown>[]): unknown {
  return { runs };
}

function runResponseBody(run: DecisionRunSummary): Record<string, unknown> {
  return {
    ...run,
    createdAt: run.createdAt.toISOString(),
    results: [],
  };
}

const baseRun: DecisionRunSummary = {
  runId: "66666666-6666-4666-8666-666666666666",
  fiscalYear: 2026,
  criteriaVersion: "1.0.0",
  algorithmVersion: "weighted-sum-v1",
  createdAt: new Date("2026-11-08T00:00:00.000Z"),
  projectCount: 1,
};

const baseDetail = {
  run: runResponseBody(baseRun),
  items: [
    {
      projectId: "44444444-4444-4444-8444-444444444444",
      rank: 1,
      score: 65,
      inputSnapshot: {
        projectId: "44444444-4444-4444-8444-444444444444",
        fiscalYear: 2026,
        contractValue: 1_000_000_000,
        progressDataAvailable: true,
      },
      scoreBreakdown: [
        {
          criterion: "physical_progress",
          sourceValue: 80,
          normalizedValue: 80,
          weight: 0.4,
          contribution: 32,
          source: {
            kind: "submitted_report",
            periodYear: 2026,
            periodMonth: 10,
          },
        },
        {
          criterion: "financial_progress",
          sourceValue: 60,
          normalizedValue: 60,
          weight: 0.3,
          contribution: 18,
          source: {
            kind: "submitted_report",
            periodYear: 2026,
            periodMonth: 10,
          },
        },
        {
          criterion: "contract_value",
          sourceValue: 50,
          normalizedValue: 50,
          weight: 0.3,
          contribution: 15,
          source: { kind: "initial_field", field: "initial_contract_value" },
        },
      ],
    },
  ],
};

const assignableProjects: readonly ProjectDetail[] = [
  {
    id: "44444444-4444-4444-8444-444444444444",
    namaPaket: "Peningkatan jalan provinsi",
    instansi: "Dinas Bina Marga",
    lokasi: "Kab. Bandung",
    sektor: "Infrastruktur",
    nilaiKontrak: 120_000_000_000,
    penyedia: "PT Sarana Pembangunan Mandiri",
    tanggalMulai: "01 Januari 2026",
    tanggalSelesai: "31 Des 2026",
    tahunAnggaran: 2026,
    progresFisik: 10,
    progresKeuangan: 5,
    status: "Berjalan",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    namaPaket: "Rehabilitasi 12 sekolah",
    instansi: "Dinas Pendidikan",
    lokasi: "Kab. Bogor",
    sektor: "Pendidikan",
    nilaiKontrak: 80_000_000_000,
    penyedia: "PT Contoh",
    tanggalMulai: "01 Januari 2026",
    tanggalSelesai: "31 Des 2026",
    tahunAnggaran: 2025,
    progresFisik: 20,
    progresKeuangan: 10,
    status: "Berjalan",
  },
];

describe("ProjectPrioritizationWorkspace", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("menampilkan state kosong ketika belum ada riwayat run", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(runsBody([]))));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ProjectPrioritizationWorkspace
        assignableProjects={assignableProjects}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Belum ada riwayat run prioritisasi/i),
      ).toBeTruthy();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/projects/prioritization/runs",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("menampilkan state loading saat memuat daftar run", async () => {
    let resolveFetch: (value: Response) => void = () => {};
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ProjectPrioritizationWorkspace
        assignableProjects={assignableProjects}
      />,
    );

    expect(
      screen.getByLabelText(/memuat daftar run prioritisasi/i),
    ).toBeTruthy();

    resolveFetch(jsonResponse(runsBody([])));
    await waitFor(() => {
      expect(
        screen.queryByLabelText(/memuat daftar run prioritisasi/i),
      ).toBeNull();
    });
    expect(
      screen.getByText(/Belum ada riwayat run prioritisasi/i),
    ).toBeTruthy();
  });

  it("menampilkan state error ketika API daftar run gagal dan mencoba ulang saat ditekan", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse({ error: "Gagal memuat run." }, 500)),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ProjectPrioritizationWorkspace
        assignableProjects={assignableProjects}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Gagal memuat run\./i)).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: /Coba lagi/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Coba lagi/i }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("menampilkan detail run, breakdown skor, versi, periode input, dan keterangan non-otomatis", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(runsBody([runResponseBody(baseRun)])))
      .mockResolvedValueOnce(jsonResponse(baseDetail));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ProjectPrioritizationWorkspace
        assignableProjects={assignableProjects}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText("65.00")).toHaveLength(2);
    });

    expect(screen.getByText(/Tahun 2026/)).toBeTruthy();
    expect(screen.getByText(/1\.0\.0/i)).toBeTruthy();
    expect(screen.getByText(/weighted-sum-v1/i)).toBeTruthy();

    const table = screen.getByRole("table");
    expect(within(table).getByText("1")).toBeTruthy();
    expect(screen.getAllByText(/Peningkatan jalan provinsi/i).length).toBeGreaterThan(1);
    expect(screen.getAllByText("65.00")).toHaveLength(2);
    expect(screen.getByText(/32\.00/)).toBeTruthy();
    expect(screen.getByText(/18\.00/)).toBeTruthy();
    expect(screen.getByText(/15\.00/)).toBeTruthy();
    expect(screen.getAllByText(/Progres fisik/i).length).toBeGreaterThan(1);
    expect(screen.getByText(/Laporan diserahkan/i)).toBeTruthy();
    expect(screen.getByText(/Data awal proyek/i)).toBeTruthy();

    expect(screen.getByText(/Oktober 2026/i)).toBeTruthy();

    expect(
      screen.getByText(/belum tentu diverifikasi secara independen/i),
    ).toBeTruthy();

    expect(screen.getByText(/rekomendasi pendukung/i)).toBeTruthy();
    expect(
      screen.getByText(
        /bukan persetujuan, penolakan, perubahan anggaran, atau keputusan otomatis/i,
      ),
    ).toBeTruthy();

    expect(screen.queryByText(/inputSnapshot/i)).toBeNull();
    expect(screen.queryByText(/attachment/i)).toBeNull();
    expect(screen.queryByText(/catatan/i)).toBeNull();
  });

  it("menghubungkan penjelasan AI ke run terpilih tanpa mengubah peringkat", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(runsBody([runResponseBody(baseRun)])))
      .mockResolvedValueOnce(jsonResponse(baseDetail))
      .mockResolvedValueOnce(
        jsonResponse({
          summary: "Hasil dihitung dari data progres dan nilai kontrak.",
          keyFactors: ["Data progres fisik dan keuangan."],
          limitations: ["Progres yang dikirim belum tentu terverifikasi."],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ProjectPrioritizationWorkspace
        assignableProjects={assignableProjects}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: /Jelaskan hasil dengan AI/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Hasil dihitung dari data progres dan nilai kontrak/i),
      ).toBeTruthy();
    });
    expect(
      fetchMock.mock.calls.some(
        ([url, options]) =>
          url ===
            `/api/v1/projects/prioritization/runs/${baseRun.runId}/explanation` &&
          options?.method === "POST",
      ),
    ).toBe(true);
    expect(
      screen.getByText(/bukan keputusan atau rekomendasi tindakan/i),
    ).toBeTruthy();
    expect(screen.getAllByText("65.00")).toHaveLength(2);
  });

  it("menampilkan error konfigurasi saat penjelasan AI gagal", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(runsBody([runResponseBody(baseRun)])))
      .mockResolvedValueOnce(jsonResponse(baseDetail))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            code: "EXTERNAL_SERVICE_ERROR",
            message: "Fitur penjelasan AI tidak dikonfigurasi.",
          },
          503,
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ProjectPrioritizationWorkspace
        assignableProjects={assignableProjects}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: /Jelaskan hasil dengan AI/i }),
    );

    expect(
      await screen.findByText(/Fitur penjelasan AI tidak dikonfigurasi/i),
    ).toBeTruthy();
    expect(screen.queryByText(/Hasil dihitung dari data progres/i)).toBeNull();
  });

  it("menampilkan error saat gagal memuat detail run terpilih", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(runsBody([runResponseBody(baseRun)])))
      .mockResolvedValueOnce(
        jsonResponse({ error: "Run tidak ditemukan." }, 404),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<ProjectPrioritizationWorkspace assignableProjects={[]} />);

    await waitFor(() => {
      expect(screen.getByText(/Run tidak ditemukan\./i)).toBeTruthy();
    });
  });

  it("mengirim hanya fiscalYear dan projectIds saat menjalankan prioritisasi, tanpa tenantId/skor/bobot", async () => {
    const createdRun: DecisionRunSummary = {
      ...baseRun,
      runId: "77777777-7777-4777-8777-777777777777",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(runsBody([])))
      .mockResolvedValueOnce(jsonResponse(runResponseBody(createdRun), 201))
      .mockResolvedValueOnce(
        jsonResponse(runsBody([runResponseBody(createdRun)])),
      )
      .mockResolvedValueOnce(jsonResponse(baseDetail));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ProjectPrioritizationWorkspace
        assignableProjects={assignableProjects}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Belum ada riwayat run prioritisasi/i),
      ).toBeTruthy();
    });

    const fiscalYearSelect = document.getElementById(
      "prioritization-fiscal-year",
    ) as HTMLSelectElement | null;
    if (!fiscalYearSelect)
      throw new Error("Select tahun anggaran tidak ditemukan.");
    fiscalYearSelect.value = "2025";
    fireEvent.change(fiscalYearSelect);
    fireEvent.click(
      screen.getByLabelText(/Rehabilitasi 12 sekolah — Dinas Pendidikan/i),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Jalankan prioritisasi/i }),
    );
    await act(async () => {});

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/projects/prioritization/runs",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const postCall = fetchMock.mock.calls.find(
      (call) =>
        call[0] === "/api/v1/projects/prioritization/runs" &&
        call[1]?.method === "POST",
    );
    expect(postCall).toBeDefined();
    const parsedBody = JSON.parse(postCall?.[1]?.body as string);
    expect(parsedBody.fiscalYear).toBe(2025);
    expect(parsedBody.projectIds).toEqual([
      "55555555-5555-4555-8555-555555555555",
    ]);
    expect(parsedBody.tenantId).toBeUndefined();
    expect(parsedBody.weights).toBeUndefined();
    expect(parsedBody.scores).toBeUndefined();
    expect(parsedBody.criteriaVersion).toBeUndefined();
    expect(parsedBody.algorithmVersion).toBeUndefined();
    expect(JSON.stringify(parsedBody)).not.toContain("breakdown");
    expect(JSON.stringify(parsedBody)).not.toContain("contribution");

    // Run baru muncul sebagai opsi selektor dan detailnya dimuat.
    await waitFor(() => {
      expect(screen.getByText(/Detail Hasil Prioritasi/i)).toBeTruthy();
    });
    expect(screen.getByText(/Run prioritisasi berhasil dibuat/i)).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText(/Tahun 2026/)).toBeTruthy();
    });
    expect(screen.getByText(/Run prioritisasi berhasil dibuat/i)).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText(/Tahun 2026/)).toBeTruthy();
    });
  });

  it("mengirim projectIds undefined ketika tidak ada proyek yang dipilih", async () => {
    const createdRun: DecisionRunSummary = {
      ...baseRun,
      runId: "77777777-7777-4777-8777-777777777777",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(runsBody([])))
      .mockResolvedValueOnce(jsonResponse(runResponseBody(createdRun), 201))
      .mockResolvedValueOnce(
        jsonResponse(runsBody([runResponseBody(createdRun)])),
      )
      .mockResolvedValueOnce(jsonResponse(baseDetail));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ProjectPrioritizationWorkspace
        assignableProjects={assignableProjects}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Belum ada riwayat run prioritisasi/i),
      ).toBeTruthy();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Jalankan prioritisasi/i }),
    );

    const postCall = fetchMock.mock.calls.find(
      (call) =>
        call[0] === "/api/v1/projects/prioritization/runs" &&
        call[1]?.method === "POST",
    );
    const parsedBody = JSON.parse(postCall?.[1]?.body as string);
    expect(parsedBody.fiscalYear).toBe(new Date().getFullYear());
    expect(parsedBody.projectIds).toBeUndefined();
  });

  it("halaman proyek menautkan halaman prioritas tanpa mengganggu formulir input progres", () => {
    const source = readFileSync("src/app/(asn)/asn/project/page.tsx", "utf-8");
    expect(source).toContain('href="/asn/project/prioritization"');
    expect(source).toContain("ProjectInputProgressPage");
    expect(source).toContain("Lihat Prioritasi Proyek");
  });
});
