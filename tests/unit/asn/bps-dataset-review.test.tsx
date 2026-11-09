// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BpsDatasetReview } from "@/app/(asn)/asn/data/_components/bps-dataset-review";

describe("BpsDatasetReview", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reloads the pending review after a successful BPS import", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ dataset: null }))
      .mockResolvedValueOnce(
        Response.json({
          dataset: {
            slug: "statistik-bps",
            title: "Statistik BPS",
            summary: "Agregat indikator BPS.",
            lastUpdatedAt: "2026-11-08T00:00:00.000Z",
            recordCount: 1,
            preview: [
              {
                indicatorCode: "ipm",
                regionCode: "32",
                year: 2025,
                value: 75.2,
                unit: "indeks",
              },
            ],
          },
        }),
      );

    const onPublished = vi.fn();
    const { rerender } = render(
      <BpsDatasetReview onPublished={onPublished} refreshKey={0} />,
    );
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    rerender(<BpsDatasetReview onPublished={onPublished} refreshKey={1} />);

    expect(await screen.findByText("Tinjauan dataset BPS")).toBeTruthy();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
