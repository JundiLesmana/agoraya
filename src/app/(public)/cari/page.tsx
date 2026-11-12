import type { Metadata } from "next";
import { SearchResults } from "./search-results";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hasil Pencarian | Agoraya",
  description:
    "Cari data pemerintah, dataset publik, layanan, dan informasi Agoraya.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 120) : "";
  const pageNumber = Number(page);
  const datasetPage =
    Number.isInteger(pageNumber) && pageNumber > 0 && pageNumber <= 10_000
      ? pageNumber
      : 1;

  return <SearchResults query={query} datasetPage={datasetPage} />;
}