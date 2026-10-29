import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import { Footer } from "@/components/footer";

describe("Footer links integration", () => {
  it("exposes all footer navigation and social links", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: /beranda/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /data pemerintah/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /layanan publik/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /lapor warga/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /insight/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /tentang/i })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /instagram/i }).getAttribute("target"),
    ).toBe("_blank");
    expect(
      screen.getByRole("link", { name: /youtube/i }).getAttribute("target"),
    ).toBe("_blank");
    expect(
      screen.getByRole("link", { name: /facebook/i }).getAttribute("target"),
    ).toBe("_blank");
  });
});
