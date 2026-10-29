import { describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    className,
  }: {
    alt: string;
    src: string;
    className?: string;
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => createElement("img", { alt, src, className }),
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

import AboutPage, { metadata } from "@/app/(public)/tentang/page";

describe("AboutPage", () => {
  it("renders the headline, breadcrumb, and copy from the design", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Lebih terbuka datanya. Lebih berarti partisipasinya.",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy();
    expect(screen.getByText("TENTANG Agoraya")).toBeTruthy();
    expect(
      screen.getByText(
        "Agoraya adalah ruang digital untuk memahami data pemerintah, mengenali layanan publik, dan menyuarakan persoalan di sekitar kita.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Dirancang untuk mendekatkan informasi dan partisipasi, agar warga dan instansi dapat berdialog dengan dasar yang lebih jelas.",
      ),
    ).toBeTruthy();
  });

  it("uses the desktop and mobile hero images and responsive layout", () => {
    render(<AboutPage />);

    const hero = screen.getByRole("region", { name: /lebih terbuka datanya/i });
    const container = hero.querySelector("div");
    const image = screen.getByRole("img", { name: /monumen nasional/i });

    expect(container?.className).toContain("lg:min-h-[492px]");
    expect(container?.className).toContain("max-w-[1320px]");
    expect(container?.className).toContain("lg:items-center");
    expect(image.getAttribute("src")).toBe("/landing/hero-desktop.png");
    expect(
      within(hero)
        .getByRole("img", { name: /monumen nasional/i })
        .closest("picture")
        ?.querySelector("source")
        ?.getAttribute("srcset"),
    ).toBe("/landing/hero-mobile.png");
  });

  it("renders the two accessible actions with their destinations and arrow icons", () => {
    render(<AboutPage />);

    const pillars = screen.getByRole("link", {
      name: "Kenali empat pilar Agoraya",
    });
    const participation = screen.getByRole("link", {
      name: "Cara berpartisipasi di Agoraya",
    });

    expect(pillars.getAttribute("href")).toBe("/#ecosystem-title");
    expect(pillars.className).toContain("bg-blue-700");
    expect(pillars.className).toContain("hover:bg-blue-800");
    expect(participation.getAttribute("href")).toBe("/tracking");
    expect(pillars.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(
      participation.querySelector("svg")?.getAttribute("aria-hidden"),
    ).toBe("true");
  });

  it("renders the mission section matching the reference layout", () => {
    render(<AboutPage />);

    const mission = screen.getByRole("region", {
      name: "Informasi yang jelas. Partisipasi yang bermakna.",
    });
    const cards = within(mission).getAllByRole("article");

    expect(cards).toHaveLength(3);
    expect(
      within(mission).getByRole("heading", {
        level: 2,
        name: "Informasi yang jelas. Partisipasi yang bermakna.",
      }),
    ).toBeTruthy();
    expect(within(mission).getByText("TUJUAN KAMI")).toBeTruthy();
    expect(
      within(mission).getByText(
        "Kami ingin membantu warga memahami isu publik dan memberi masukan yang relevan. Bagi instansi, informasi yang tertata dapat menjadi bahan untuk menjelaskan proses dan melihat kebutuhan masyarakat.",
      ),
    ).toBeTruthy();
    expect(
      within(mission).getByText(
        "Keterbukaan bukan hanya menyediakan data, tetapi juga membuatnya dapat dipahami dan dipertanyakan.",
      ),
    ).toBeTruthy();
    const grid = cards[0].parentElement;
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("md:grid-cols-2");
    expect(grid?.className).toContain("lg:grid-cols-3");

    const expectedPillars = [
      [
        "Terbuka dan mudah dipahami",
        "Informasi perlu disertai sumber, periode, dan konteks agar dapat dibaca tanpa menebak maknanya.",
      ],
      [
        "Akuntabel dalam proses",
        "Status, penjelasan, dan tindak lanjut perlu dapat ditelusuri, bukan sekadar ditampilkan sebagai hasil akhir.",
      ],
      [
        "Partisipatif dan inklusif",
        "Sudut pandang warga dan instansi sama-sama penting untuk mengenali kebutuhan dan ruang perbaikan.",
      ],
    ];

    expectedPillars.forEach(([title, description]) => {
      const card = within(mission).getByRole("article", { name: title });
      expect(card.getAttribute("tabindex")).toBe("0");
      expect(
        within(card).getByRole("heading", { level: 3, name: title }),
      ).toBeTruthy();
      expect(within(card).getByText(description)).toBeTruthy();
      expect(card.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
        "true",
      );
    });

    const firstCard = within(mission).getByRole("article", {
      name: "Terbuka dan mudah dipahami",
    });

    expect(firstCard.className).toContain("hover:-translate-y-1");
    expect(firstCard.className).toContain("hover:border-blue-600");
    expect(firstCard.className).toContain("hover:shadow-md");
    expect(firstCard.querySelector("svg")?.getAttribute("class")).toContain(
      "size-6",
    );
  });

  it("sets the page title and SEO description", () => {
    expect(metadata.title).toBe("Tentang Agoraya");
    expect(metadata.description).toBe(
      "Agoraya adalah ruang digital untuk memahami data pemerintah, mengenali layanan publik, dan menyuarakan persoalan di sekitar kita.",
    );
  });
});
