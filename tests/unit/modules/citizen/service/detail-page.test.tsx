/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => createElement("a", { href, ...props }, children),
}));

const { notFoundMock, requireAuthMock, dbMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  requireAuthMock: vi.fn(),
  dbMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAuth: requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  db: dbMock,
}));

vi.mock("@/lib/tenancy/reporting", () => ({
  resolveReportingTenantId: vi.fn(async () => null),
}));

import CitizenSubmissionDetailPage from "@/app/(citizen)/citizen/service/[id]/page";

function mockDetailQuery(row?: Record<string, unknown>) {
  const rows = row ? [row] : [];
  const updates = [
    {
      status: "Diverifikasi",
      message: "Pengajuan sedang diproses",
      createdAt: new Date("2026-10-11T09:00:00.000Z"),
    },
  ];
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockResolvedValue(updates);
  const where = vi.fn().mockReturnValue({ limit, orderBy });
  const from = vi.fn().mockReturnValue({ where });
  const select = vi.fn().mockReturnValue({ from });
  dbMock.mockReturnValue({ select });
  return { select, from, where, limit, orderBy };
}

describe("citizen service detail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthMock.mockResolvedValue({
      userId: "user-1",
      tenantId: "tenant-1",
      roles: ["citizen"],
    });
  });

  it("renders the logged-in user's submission details", async () => {
    const query = mockDetailQuery({
      id: "app-1",
      trackingNumber: "PGD-261010-00001",
      category: "social",
      serviceType: "kebersihan",
      serviceId: "svc-1",
      routeKey: "sosial-kesehatan",
      serviceName: "Lampu jalan padam di Jl. Melati",
      agency: "Dinas Pekerjaan Umum",
      status: "in_progress",
      applicantName: "Warga Contoh",
      contactEmail: "warga@example.com",
      payload: {},
      submittedAt: new Date("2026-10-10T08:00:00.000Z"),
      updatedAt: new Date("2026-10-11T08:00:00.000Z"),
    });

    const page = await CitizenSubmissionDetailPage({
      params: Promise.resolve({ id: "app-1" }),
    });

    render(page);

    expect(requireAuthMock).toHaveBeenCalledWith();
    expect(query.where).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("heading", { name: "Lampu jalan padam di Jl. Melati" })).toBeTruthy();
    expect(screen.getByText("PGD-261010-00001")).toBeTruthy();
    expect(screen.getByText("Warga Contoh")).toBeTruthy();
    expect(screen.getByText("warga@example.com")).toBeTruthy();
    expect(
      screen.getByText(
        /Halaman ini hanya menampilkan detail pengajuan yang terhubung ke akun Anda/i,
      ),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: /Kembali ke daftar pengajuan/i }).getAttribute("href")).toBe(
      "/citizen/service",
    );
  });

  it("calls notFound when the submission does not belong to the logged-in user", async () => {
    mockDetailQuery();

    await expect(
      CitizenSubmissionDetailPage({ params: Promise.resolve({ id: "missing-app" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});
