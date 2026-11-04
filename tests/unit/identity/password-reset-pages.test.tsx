import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme-provider";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) =>
    createElement("img", { alt, src }),
}));

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

import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";
import ResetPasswordPage from "@/app/(auth)/reset-password/page";
import { ResetPasswordForm } from "@/app/(auth)/reset-password/_components/reset-form";

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.removeItem("agoraya-theme");
  document.documentElement.classList.remove("dark");
});

function getContainingForm(element: HTMLElement): HTMLFormElement {
  const form = element.closest("form");
  if (!(form instanceof HTMLFormElement)) {
    throw new Error("Expected the control to belong to a form.");
  }
  return form;
}

describe("reset password page", () => {
  it("passes the search token to the reset form", async () => {
    const page = await ResetPasswordPage({
      searchParams: Promise.resolve({ token: "reset-token" }),
    });

    expect(page.props.token).toBe("reset-token");
  });

  it("renders the reset form without a token when the query parameter is missing", async () => {
    const page = await ResetPasswordPage({
      searchParams: Promise.resolve({}),
    });

    expect(page.props.token).toBe("");
  });

  it("uses the first value when the token query parameter is repeated", async () => {
    const page = await ResetPasswordPage({
      searchParams: Promise.resolve({ token: ["first-token", "second-token"] }),
    });

    expect(page.props.token).toBe("first-token");
  });
});

describe("forgot password page", () => {
  it("uses the global theme toggle and applies the selected theme", async () => {
    render(
      <ThemeProvider>
        <ForgotPasswordPage />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Tema terang" }).getAttribute("aria-pressed"),
      ).toBe("true");
    });

    fireEvent.click(screen.getByRole("button", { name: "Tema gelap" }));

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(window.localStorage.getItem("agoraya-theme")).toBe("dark");
      expect(
        screen.getByRole("button", { name: "Tema gelap" }).getAttribute("aria-pressed"),
      ).toBe("true");
    });
  });

  it("submits the identifier and displays the generic success response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Periksa email Anda." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("NIK atau email"), {
      target: { value: "citizen@example.id" },
    });
    fireEvent.submit(
      getContainingForm(screen.getByLabelText("NIK atau email")),
    );

    await waitFor(() => {
      expect(screen.getByText("Periksa email Anda.")).toBeTruthy();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/forgot-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ identifier: "citizen@example.id" }),
      }),
    );
  });

  it("displays API errors without exposing success state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Terlalu banyak permintaan." }),
      }),
    );
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("NIK atau email"), {
      target: { value: "citizen@example.id" },
    });
    fireEvent.submit(
      getContainingForm(screen.getByLabelText("NIK atau email")),
    );

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Terlalu banyak permintaan.",
    );
  });
});

describe("reset password form", () => {
  it("uses the global theme toggle and applies the selected theme", async () => {
    render(
      <ThemeProvider>
        <ResetPasswordForm token={"a".repeat(64)} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Tema terang" }).getAttribute("aria-pressed"),
      ).toBe("true");
    });

    fireEvent.click(screen.getByRole("button", { name: "Tema gelap" }));

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(window.localStorage.getItem("agoraya-theme")).toBe("dark");
      expect(
        screen.getByRole("button", { name: "Tema gelap" }).getAttribute("aria-pressed"),
      ).toBe("true");
    });
  });

  it("keeps the reset button clickable when the token is missing", () => {
    render(<ResetPasswordForm token="" />);

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("link", { name: "Minta link reset baru" })).toBeNull();
    expect(
      screen.getByRole("button", { name: /reset kata sandi/i }).hasAttribute("disabled"),
    ).toBe(false);
  });

  it("allows submitting once all password requirements and confirmation match", () => {
    render(<ResetPasswordForm token={"a".repeat(64)} />);
    const submit = screen.getByRole("button", { name: /reset kata sandi/i });

    expect(submit.hasAttribute("disabled")).toBe(false);
    fireEvent.change(screen.getByLabelText("Kata sandi baru"), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText("Konfirmasi kata sandi baru"), {
      target: { value: "Password123!" },
    });
    expect(submit.hasAttribute("disabled")).toBe(false);
  });

  it("shows unmet password requirements after clicking reset", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ResetPasswordForm token={"a".repeat(64)} />);
    fireEvent.change(screen.getByLabelText("Kata sandi baru"), {
      target: { value: "Password12345" },
    });
    fireEvent.change(screen.getByLabelText("Konfirmasi kata sandi baru"), {
      target: { value: "Password12345" },
    });
    fireEvent.submit(
      getContainingForm(
        screen.getByRole("button", { name: /reset kata sandi/i }),
      ),
    );

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Kata sandi harus mengandung minimal 1 simbol.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a simple warning when the confirmation does not match", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ResetPasswordForm token={"a".repeat(64)} />);
    fireEvent.change(screen.getByLabelText("Kata sandi baru"), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText("Konfirmasi kata sandi baru"), {
      target: { value: "Different123!" },
    });
    fireEvent.submit(
      getContainingForm(
        screen.getByRole("button", { name: /reset kata sandi/i }),
      ),
    );

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Konfirmasi kata sandi tidak sama.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits a matching strong password and shows the success state", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ResetPasswordForm token={"a".repeat(64)} />);

    fireEvent.change(screen.getByLabelText("Kata sandi baru"), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText("Konfirmasi kata sandi baru"), {
      target: { value: "Password123!" },
    });
    fireEvent.submit(
      getContainingForm(
        screen.getByRole("button", { name: /reset kata sandi/i }),
      ),
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Kata sandi diperbarui" })).toBeTruthy();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/reset-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          token: "a".repeat(64),
          password: "Password123!",
        }),
      }),
    );
  });

  it("displays API errors and remains on the reset form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Token tidak valid." }),
      }),
    );
    render(<ResetPasswordForm token={"b".repeat(64)} />);
    fireEvent.change(screen.getByLabelText("Kata sandi baru"), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText("Konfirmasi kata sandi baru"), {
      target: { value: "Password123!" },
    });
    fireEvent.submit(
      getContainingForm(
        screen.getByRole("button", { name: /reset kata sandi/i }),
      ),
    );

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Token tidak valid.",
    );
    expect(screen.getByLabelText("Kata sandi baru")).toBeTruthy();
  });
});
