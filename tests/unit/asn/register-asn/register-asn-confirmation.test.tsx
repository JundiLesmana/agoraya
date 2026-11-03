/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  RegisterAsnConfirmation,
  type RegistrationConfirmationDetails,
} from "@/app/(auth)/register-asn/_components/register-asn-form";

const details: RegistrationConfirmationDetails = {
  name: "Rani Pratama",
  email: "rani@example.id",
  agencyName: "Diskominfo",
  unitWork: "Dinas Komunikasi dan Informatika",
  status: "pending_approval",
};

const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);

afterEach(() => {
  if (originalClipboard) {
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  } else {
    Reflect.deleteProperty(navigator, "clipboard");
  }
});

describe("RegisterAsnConfirmation", () => {
  it("shows the submitted applicant details and accurate next steps", () => {
    render(<RegisterAsnConfirmation details={details} />);

    expect(
      screen.getByRole("heading", { name: "Terima kasih, Rani Pratama." }),
    ).toBeDefined();
    expect(screen.getByText("rani@example.id")).toBeDefined();
    expect(screen.getByText("Menunggu persetujuan")).toBeDefined();
    expect(screen.getByText("Dinas Komunikasi dan Informatika")).toBeDefined();
    expect(screen.queryByText(/REG-2026-/)).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Ke halaman masuk" })
        .getAttribute("href"),
    ).toBe("/login");
  });

  it("copies the registered email and announces the result", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<RegisterAsnConfirmation details={details} />);
    fireEvent.click(screen.getByRole("button", { name: "Salin email" }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("rani@example.id");
      expect(
        screen.getByText("Email terdaftar berhasil disalin."),
      ).toBeDefined();
    });
  });
});
