/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme-provider";
import RegisterAsnPage from "@/app/(auth)/register-asn/page";

describe("RegisterAsnPage theme toggle", () => {
  beforeEach(() => {
    window.localStorage.removeItem("agoraya-theme");
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    cleanup();
    window.localStorage.removeItem("agoraya-theme");
    document.documentElement.classList.remove("dark");
  });

  it("uses the shared theme provider to toggle and persist dark mode", async () => {
    render(
      <ThemeProvider>
        <RegisterAsnPage />
      </ThemeProvider>,
    );

    const themeButton = await screen.findByRole("button", {
      name: "Beralih ke tema gelap",
    });
    expect(themeButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(themeButton);

    expect(
      screen.getByRole("button", { name: "Beralih ke tema terang" })
        .textContent,
    ).toContain("Gelap");
    expect(
      screen
        .getByRole("button", { name: "Beralih ke tema terang" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem("agoraya-theme")).toBe("dark");
  });
});
