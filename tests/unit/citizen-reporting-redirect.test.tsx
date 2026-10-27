import { describe, expect, it, vi } from "vitest";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(path);
  }),
}));

vi.mock("next/navigation", () => ({ redirect }));

import CitizenReportingPage from "@/app/(citizen)/citizen/reporting/page";

describe("CitizenReportingPage", () => {
  it("redirects the legacy route to the tracking page", () => {
    expect(() => CitizenReportingPage()).toThrow("/tracking");
    expect(redirect).toHaveBeenCalledWith("/tracking");
  });
});
