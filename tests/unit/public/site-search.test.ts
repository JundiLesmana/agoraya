import { describe, expect, it } from "vitest";
import { searchPublicPages } from "@/modules/site-search";

describe("searchPublicPages", () => {
  it("ranks relevant pages and requires every query term", () => {
    const results = searchPublicPages("APBD anggaran");

    expect(results[0]).toMatchObject({
      title: "Anggaran dan APBD",
      href: "/data/anggaran",
    });
    expect(
      results.every((result) =>
        /anggaran|apbd/i.test(result.title + result.terms),
      ),
    ).toBe(true);
    expect(searchPublicPages("anggaran kata-tidak-terkait")).toEqual([]);
  });

  it("matches case-insensitively and ignores Indonesian diacritics", () => {
    expect(searchPublicPages("STATISTIK KESEJAHTERAAN")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: "/data/statistik" }),
      ]),
    );
    expect(searchPublicPages("layanan publik")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: "/citizen/service" }),
      ]),
    );
  });

  it("returns no results for an empty query", () => {
    expect(searchPublicPages("  ")).toEqual([]);
  });

  it("uses whole-word prefixes rather than accidental inner-word matches", () => {
    expect(searchPublicPages("anggar")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: "/data/anggaran" }),
      ]),
    );
    expect(searchPublicPages("or")).toEqual([]);
  });
});