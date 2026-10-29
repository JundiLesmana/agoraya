import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const navigation = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";

describe("Navbar", () => {
  it("renders the main navigation and login CTA", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("img", { name: "Agoraya" }).getAttribute("src"),
    ).toBe("/logo/logo-light.svg");
    expect(
      screen.getAllByRole("link", { name: /beranda/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /masuk \/ daftar/i }).length,
    ).toBeGreaterThan(0);
  });

  it.each(["/data/anggaran", "/data/project"])(
    "highlights the Data Pemerintah navigation on %s for desktop and mobile",
    (pathname) => {
      navigation.pathname = pathname;
      const { unmount } = render(<Navbar />);

      const dataLinks = screen.getAllByRole("link", {
        name: "Data Pemerintah",
      });
      expect(dataLinks).toHaveLength(2);
      expect(dataLinks[0].getAttribute("aria-current")).toBe("location");
      expect(dataLinks[0].className).toContain("text-primary");
      expect(dataLinks[1].getAttribute("aria-current")).toBe("location");
      expect(dataLinks[1].className).toContain("bg-primary/10");

      for (const homeLink of screen.getAllByRole("link", { name: "Beranda" })) {
        expect(homeLink.hasAttribute("aria-current")).toBe(false);
      }

      unmount();
      navigation.pathname = "/";
    },
  );

  it("uses the dark logo when dark mode is selected", async () => {
    window.localStorage.setItem("agoraya-theme", "dark");
    render(
      <ThemeProvider>
        <Navbar />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: "Agoraya" }).getAttribute("src"),
      ).toBe("/logo/logo-dark.svg");
    });
    window.localStorage.removeItem("agoraya-theme");
  });

  it("toggles the mobile menu open and closed", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole("button", { name: /buka menu/i }));
    expect(screen.getByLabelText(/navigasi mobile/i)).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.queryByLabelText(/navigasi mobile/i)).toBeTruthy();
  });
});
