import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServiceApplicationWizard } from "@/app/(citizen)/citizen/apply/_components/service-application-wizard";

describe("ServiceApplicationWizard", () => {
  it("searches and filters the service catalog", () => {
    render(<ServiceApplicationWizard />);

    expect(
      screen.getByRole("heading", { name: "Ajukan Layanan Publik" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }).textContent,
    ).toContain("Ajukan Layanan");
    expect(
      screen
        .getByRole("link", { name: /Kembali ke pelacakan/ })
        .getAttribute("href"),
    ).toBe("/tracking");
    fireEvent.click(screen.getByRole("button", { name: "Simpan draft" }));
    expect(screen.getByRole("status").textContent).toContain(
      "Fitur simpan draft belum tersedia",
    );
    expect(screen.getByRole("button", { name: /Perizinan/ })).toBeTruthy();

    fireEvent.change(screen.getByRole("textbox", { name: "Cari layanan" }), {
      target: { value: "pendidikan" },
    });
    expect(screen.getByRole("button", { name: /Pendidikan/ })).toBeTruthy();
    expect(screen.queryByText("Perizinan")).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Cari layanan" }), {
      target: { value: "" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter kategori layanan" }),
      {
        target: { value: "Perizinan" },
      },
    );
    expect(screen.getByRole("button", { name: /Perizinan/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Pendidikan/ })).toBeNull();
  });

  it("opens the education-specific wizard after choosing Pendidikan", () => {
    render(<ServiceApplicationWizard />);

    fireEvent.click(screen.getByRole("button", { name: /Pendidikan/ }));

    const continueLink = screen.getByRole("link", { name: "Pilih layanan" });
    expect(continueLink.getAttribute("href")).toBe("/citizen/apply/education");
    expect(
      screen.getByRole("button", { name: /Pendidikan/ }).textContent,
    ).toContain("Dinas Pendidikan");
  });

  it("opens the permit-specific wizard after choosing Perizinan", () => {
    render(<ServiceApplicationWizard />);

    fireEvent.click(screen.getByRole("button", { name: /Perizinan/ }));

    expect(
      screen.getByRole("link", { name: "Pilih layanan" }).getAttribute("href"),
    ).toBe("/citizen/apply/permit");
  });

  it("keeps the existing social-specific route", () => {
    render(<ServiceApplicationWizard />);

    fireEvent.click(screen.getByRole("button", { name: /^Sosial/ }));

    expect(
      screen.getByRole("link", { name: "Pilih layanan" }).getAttribute("href"),
    ).toBe("/citizen/apply/social");
  });
});
