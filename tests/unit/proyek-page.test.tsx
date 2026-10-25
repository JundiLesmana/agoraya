// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock(
  "@/app/(public)/data-pemerintah/proyek/_components/proyek-data",
  () => ({
    ProyekData: () => null,
  }),
);

import ProyekPage from "@/app/(public)/data-pemerintah/proyek/page";

describe("ProyekPage — breadcrumb", () => {
  it("merender 3 item breadcrumb dengan separator yang benar", () => {
    render(<ProyekPage />);

    const breadcrumb = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(breadcrumb).toBeTruthy();

    const { getByRole, getByText } = within(breadcrumb);

    // "Beranda" mengarah ke "/"
    expect(getByRole("link", { name: /beranda/i }).getAttribute("href")).toBe(
      "/",
    );
    // "Data Pemerintah" mengarah ke "/data-pemerintah"
    expect(
      getByRole("link", { name: /data pemerintah/i }).getAttribute("href"),
    ).toBe("/data-pemerintah");

    // "Proyek" adalah halaman saat ini: tidak dapat diklik, aria-current="page"
    const currentPage = getByText("Proyek");
    const currentLi = currentPage.closest("li");
    expect(currentLi?.getAttribute("aria-current")).toBe("page");
    expect(currentLi?.querySelector("a")).toBeNull();

    // Separator ">" di antara setiap item (2 separator untuk 3 item)
    const separators = breadcrumb.querySelectorAll('li[aria-hidden="true"]');
    expect(separators.length).toBe(2);
    separators.forEach((sep: Element) => {
      expect(sep.textContent).toBe(">");
    });
  });
});

describe("ProyekPage — dataset card", () => {
  it("menautkan tombol unduh CSV ke ekspor dataset", () => {
    render(<ProyekPage />);

    expect(
      screen.getByRole("link", { name: "Unduh CSV" }).getAttribute("href"),
    ).toBe("/api/projects?format=csv");
  });
});
