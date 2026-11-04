import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { z } from "zod";

const resetMocks = vi.hoisted(() => ({
  createPasswordResetToken: vi.fn(),
  resetPassword: vi.fn(),
  sendEmail: vi.fn(),
  renderEmail: vi.fn(),
}));

vi.mock("@/modules/identity/password-reset/service", () => ({
  createPasswordResetToken: resetMocks.createPasswordResetToken,
  resetPassword: resetMocks.resetPassword,
  forgotPasswordSchema: z.object({ identifier: z.string().min(1).max(255) }),
  resetPasswordSchema: z.object({
    token: z.string().length(64).regex(/^[a-f\d]{64}$/i),
    password: z
      .string()
      .min(12, "Kata sandi minimal 12 karakter.")
      .max(256, "Kata sandi maksimal 256 karakter.")
      .regex(/\d/, "Kata sandi harus mengandung minimal 1 angka.")
      .regex(/[^a-zA-Z0-9]/, "Kata sandi harus mengandung minimal 1 simbol."),
  }),
  resetPasswordTokenSchema: z.string().length(64).regex(/^[a-f\d]{64}$/i),
}));

vi.mock("@/lib/env", () => ({
  getEnv: () => ({
    BREVO_API_KEY: "test-key",
    BREVO_SENDER_EMAIL: "no-reply@example.test",
    BREVO_SENDER_NAME: "Agoraya",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  }),
}));

vi.mock("@/modules/notifications", () => ({
  BrevoEmailClient: class {
    send = resetMocks.sendEmail;
  },
  renderNotificationTemplate: resetMocks.renderEmail,
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => createElement("img", props),
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
import { POST as forgotPasswordPost } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordPost } from "@/app/api/auth/reset-password/route";

const resetToken = "a".repeat(64);

function getContainingForm(element: HTMLElement): HTMLFormElement {
  const form = element.closest("form");
  if (!(form instanceof HTMLFormElement)) {
    throw new Error("Expected the control to belong to a form.");
  }
  return form;
}

function jsonResponse(response: Response): Promise<{
  ok: boolean;
  json: () => Promise<unknown>;
}> {
  return Promise.resolve({
    ok: response.ok,
    json: () => response.json(),
  });
}

describe("password reset complete flow", () => {
  beforeEach(() => {
    resetMocks.createPasswordResetToken.mockReset().mockResolvedValue({
      issued: true,
      token: resetToken,
      recipientEmail: "citizen@example.id",
    });
    resetMocks.resetPassword.mockReset().mockResolvedValue(undefined);
    resetMocks.sendEmail.mockReset().mockResolvedValue(undefined);
    resetMocks.renderEmail.mockReset().mockImplementation((_name, input) => ({
      to: input.recipient,
      subject: "Reset password",
      html: `<a href="${input.variables.resetUrl}">Reset</a>`,
      text: input.variables.resetUrl,
      templateName: "password-reset",
      variables: input.variables,
    }));

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = String(input);
        const request = new Request(`http://localhost${path}`, {
          method: init?.method,
          headers: init?.headers,
          body: init?.body,
        });
        if (path === "/api/auth/forgot-password") {
          return jsonResponse(await forgotPasswordPost(request));
        }
        if (path === "/api/auth/reset-password") {
          return jsonResponse(await resetPasswordPost(request));
        }
        throw new Error(`Unexpected request: ${path}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests a reset link, validates the password, succeeds, and links to login", async () => {
    const forgotPage = render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText("NIK atau email"), {
      target: { value: "citizen@example.id" },
    });
    fireEvent.submit(
      getContainingForm(screen.getByLabelText("NIK atau email")),
    );

    await screen.findByText(/Jika akun Anda terdaftar/i);
    expect(resetMocks.createPasswordResetToken).toHaveBeenCalledWith(
      "citizen@example.id",
    );
    expect(resetMocks.sendEmail).toHaveBeenCalledOnce();

    const generatedUrl = resetMocks.renderEmail.mock.results[0]?.value.text as
      | string
      | undefined;
    expect(generatedUrl).toBeDefined();
    const token = new URL(generatedUrl as string).searchParams.get("token");
    expect(token).toBe(resetToken);

    forgotPage.unmount();
    const resetPage = await ResetPasswordPage({
      searchParams: Promise.resolve({ token: token ?? "" }),
    });
    render(resetPage);

    const passwordInput = screen.getByLabelText("Kata sandi baru");
    const confirmationInput = screen.getByLabelText(
      "Konfirmasi kata sandi baru",
    );
    const submit = screen.getByRole("button", { name: /reset kata sandi/i });

    fireEvent.change(passwordInput, { target: { value: "Weak123!" } });
    fireEvent.change(confirmationInput, { target: { value: "Weak123!" } });
    fireEvent.click(submit);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Kata sandi minimal 12 karakter.",
    );
    expect(resetMocks.resetPassword).not.toHaveBeenCalled();

    fireEvent.change(passwordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.change(confirmationInput, {
      target: { value: "Password123!" },
    });
    expect(screen.getByText("Minimal 12 karakter").className).toContain(
      "text-[#1767cf]",
    );
    expect(screen.getByText("Minimal 1 angka").className).toContain(
      "text-[#1767cf]",
    );
    expect(screen.getByText("Minimal 1 simbol").className).toContain(
      "text-[#1767cf]",
    );
    fireEvent.click(submit);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Kata sandi diperbarui" }),
      ).toBeTruthy();
    });
    expect(screen.getByText(/Kata sandi berhasil direset/)).toBeTruthy();
    expect(screen.getByText(/Gunakan kata sandi baru saat masuk kembali/)).toBeTruthy();
    expect(resetMocks.resetPassword).toHaveBeenCalledWith(
      resetToken,
      "Password123!",
    );

    const loginLink = screen.getByRole("link", { name: /login/i });
    expect(loginLink.getAttribute("href")).toBe("/login");
    fireEvent.click(loginLink);
    expect(loginLink.getAttribute("href")).toBe("/login");
  });
});
