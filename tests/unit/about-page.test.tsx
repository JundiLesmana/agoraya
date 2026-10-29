import { describe, expect, it, vi } from "vitest";
import {
  createElement,
  type AnchorHTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: (
    props: ImgHTMLAttributes<HTMLImageElement> & {
      fill?: boolean;
      priority?: boolean;
      sizes?: string;
    },
  ) => {
    const { fill, priority, sizes, ...imageProps } = props;
    void fill;
    void priority;
    void sizes;
    return createElement("img", imageProps);
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: ReactNode;
  }) => createElement("a", { href, ...props }, children),
}));

import AboutPage, { metadata } from "@/app/(public)/tentang/page";

describe("AboutPage", () => {
  it("matches the reference page sections and their order", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Lebih terbuka datanya. Lebih berarti partisipasinya.",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy();

    const sectionNames = [
      "Informasi yang jelas. Partisipasi yang bermakna.",
      "Dari memahami data hingga ikut berperan",
      "Peran berbeda, tujuan yang sama",
      "Terbuka untuk publik, tetap menghormati privasi",
      "Kenali sebelum menjelajahi",
      "Mulai dari rasa ingin tahu.Lanjutkan dengan peran Anda.",
    ];
    const headings = screen.getAllByRole("heading", { level: 2 });
    const renderedOrder = headings.map((heading) => heading.textContent);
    expect(renderedOrder).toEqual(sectionNames);

    const mission = screen.getByRole("region", {
      name: "Informasi yang jelas. Partisipasi yang bermakna.",
    });
    expect(within(mission).getAllByRole("article")).toHaveLength(3);
    expect(
      screen
        .getByRole("region", {
          name: "Dari memahami data hingga ikut berperan",
        })
        .querySelectorAll("article"),
    ).toHaveLength(4);
    expect(
      screen
        .getByRole("region", {
          name: "Peran berbeda, tujuan yang sama",
        })
        .querySelectorAll("article"),
    ).toHaveLength(2);
    expect(
      screen.getByRole("region", {
        name: "Terbuka untuk publik, tetap menghormati privasi",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: "Kenali sebelum menjelajahi" }),
    ).toBeTruthy();
  });

  it("uses the supplied desktop and mobile images in the hero and CTA", () => {
    render(<AboutPage />);

    const hero = screen.getByRole("region", {
      name: "Lebih terbuka datanya. Lebih berarti partisipasinya.",
    });
    expect(
      within(hero)
        .getByRole("img", { name: /monumen nasional/i })
        .getAttribute("src"),
    ).toBe("/landing/hero-desktop.png");
    expect(
      within(hero)
        .getByRole("img", { name: /monumen nasional/i })
        .closest("picture")
        ?.querySelector("source")
        ?.getAttribute("srcset"),
    ).toBe("/landing/hero-mobile.png");

    const ctaImage = document.querySelector(
      'img[src="/landing/footer-desktop.png"]',
    );
    expect(
      ctaImage
        ?.closest("picture")
        ?.querySelector("source")
        ?.getAttribute("srcset"),
    ).toBe("/landing/footer-mobile.png");
  });

  it("renders the hero links and CTA links from the design", () => {
    render(<AboutPage />);

    expect(
      screen
        .getByRole("link", { name: "Kenali empat pilar Agoraya" })
        .getAttribute("href"),
    ).toBe("/#ecosystem-title");
    expect(
      screen
        .getByRole("link", { name: "Cara berpartisipasi di Agoraya" })
        .getAttribute("href"),
    ).toBe("/tracking");
    expect(
      screen
        .getByRole("link", { name: /Jelajahi Data Pemerintah/i })
        .getAttribute("href"),
    ).toBe("/data");
    expect(
      screen
        .getByRole("link", { name: /Lihat Layanan Publik/i })
        .getAttribute("href"),
    ).toBe("/tracking");
  });

  it("shows all FAQ answers by default and lets each answer be collapsed", () => {
    render(<AboutPage />);

    const firstQuestion = screen.getByRole("button", {
      name: "Apakah Agoraya merupakan situs resmi pemerintah?",
    });
    const secondQuestion = screen.getByRole("button", {
      name: "Apakah semua data dan layanan sudah terhubung?",
    });

    expect(firstQuestion.getAttribute("aria-expanded")).toBe("true");
    expect(secondQuestion.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(firstQuestion);
    expect(firstQuestion.getAttribute("aria-expanded")).toBe("false");
    expect(secondQuestion.getAttribute("aria-expanded")).toBe("true");
  });

  it("exposes structured data and page metadata", () => {
    render(<AboutPage />);

    const schemas = [
      ...document.querySelectorAll('script[type="application/ld+json"]'),
    ].map(
      (script) => JSON.parse(script.textContent ?? "{}") as { "@type": string },
    );

    expect(schemas.map(({ "@type": type }) => type)).toEqual([
      "Organization",
      "FAQPage",
    ]);
    expect(metadata.title).toBe("Tentang Agoraya");
    expect(metadata.description).toContain("Agoraya adalah ruang digital");
    expect(metadata.openGraph?.images).toBeTruthy();
  });
});
