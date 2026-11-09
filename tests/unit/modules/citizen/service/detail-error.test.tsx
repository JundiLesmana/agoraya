/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => createElement("a", { href, ...props }, children),
}));

import CitizenSubmissionDetailError from "@/app/(citizen)/citizen/service/[id]/error";

describe("citizen service detail error", () => {
  it("renders recovery actions and calls reset", () => {
    const reset = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <CitizenSubmissionDetailError
        error={Object.assign(new Error("boom"), { digest: "digest-1" })}
        reset={reset}
      />,
    );

    expect(screen.getByRole("heading", { name: "Detail pengajuan gagal dimuat" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Kembali ke ruang warga" }).getAttribute("href")).toBe(
      "/citizen/service",
    );

    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));

    expect(reset).toHaveBeenCalledOnce();
    consoleErrorSpy.mockRestore();
  });
});
