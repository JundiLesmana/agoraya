// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchResults } from "@/app/(public)/cari/search-results";

describe("SearchResults", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("searches the published dataset catalog and renders matching results", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        data: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            slug: "apbd-jabar",
            title: "Data APBD Jawa Barat",
            summary: "Pagu dan realisasi anggaran daerah.",
            category: "Anggaran",
            sourceOrganization: "Pemerintah Daerah",
            sourceLabel: "BPS_API",
            tags: ["APBD"],
            lastUpdatedAt: "2026-11-12T00:00:00.000Z",
            downloadsCount: 0,
            resources: [],
          },
        ],
        total: 1,
        page: 1,
        pageSize: 12,
        totalPages: 1,
        filters: { categories: ["Anggaran"], agencies: [] },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<SearchResults query="APBD" />);

    expect(await screen.findByText("Data APBD Jawa Barat")).toBeTruthy();
    expect(screen.getByText("Anggaran · Pemerintah Daerah")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /lihat kategori/i })
        .getAttribute("href"),
    ).toBe("/data/anggaran");
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/asn/datasets?search=APBD&sort=relevance&page=1",
        expect.objectContaining({ cache: "no-store" }),
      );
    });
  });

  it("does not query the catalog for an empty search", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<SearchResults query="" />);

    expect(screen.getByText(/masukkan minimal dua karakter/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});