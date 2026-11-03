// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DownloadButton } from "@/app/(public)/data-pemerintah/proyek/_components/download-button";

describe("downloadData", () => {
  it("mengunduh CSV yang sesuai dengan pencarian dan filter aktif", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nama_proyek\nRehabilitasi 12 sekolah\n", {
        headers: { "Content-Type": "text/csv" },
      }),
    );
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("mock-blob-url");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(
      <DownloadButton
        search="sekolah"
        sort="anggaran_desc"
        status="Berjalan"
        wilayah="Kabupaten Bogor"
        periode="2025 · s.d. TW III"
        sektor="Pendidikan"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Unduh daftar" }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0][0]).toContain("search=sekolah");
    expect(fetchSpy.mock.calls[0][0]).toContain("status=Berjalan");
    expect(fetchSpy.mock.calls[0][0]).toContain("wilayah=Kabupaten");
    expect(fetchSpy.mock.calls[0][0]).toContain("sektor=Pendidikan");
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalledTimes(1));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    await waitFor(
      () => expect(revokeSpy).toHaveBeenCalledWith("mock-blob-url"),
      { timeout: 1500 },
    );
    fetchSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeSpy.mockRestore();
    clickSpy.mockRestore();
  });
});
