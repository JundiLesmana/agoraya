// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AsnAccessDirectory } from "@/app/(executive)/executive/dashboard/_components/asn-access-directory";

const person = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "ASN contoh",
  emailMasked: "a***@example.test",
  nipMasked: "********1234",
  opd: "Instansi contoh",
  unit: null,
  position: "Analis",
  accountStatus: "active",
  applicationRoles: [{ key: "operator", name: "Operator" }],
  modules: ["ogd"],
  executiveStatus: "not_granted",
} as const;

const requirements = [
  { key: "email_verification", status: "fulfilled", completedAt: null },
  { key: "identity_verification", status: "verified" },
  { key: "admin_approval", status: "fulfilled" },
];

const currentAccess = {
  accountStatus: "active",
  applicationRoles: person.applicationRoles,
  modules: ["ogd"],
  executiveStatus: "not_granted",
} as const;

const accessOptions = {
  data: {
    applicationRoles: [
      { key: "operator", name: "Operator" },
      { key: "cms-editor", name: "CMS Editor" },
    ],
    modules: [
      {
        key: "ogd",
        label: "CMS Data Pemerintah",
        group: "CMS & KYC",
        page: "/bantuan/cms-ruang-asn/cms-data-pemerintah",
      },
      {
        key: "pst",
        label: "CMS Layanan Publik",
        group: "CMS & KYC",
        page: "/bantuan/cms-ruang-asn/cms-layanan-publik",
      },
      {
        key: "civic_reporting",
        label: "CMS Lapor Warga",
        group: "CMS & KYC",
        page: "/bantuan/cms-ruang-asn/cms-lapor-warga",
      },
      {
        key: "insight",
        label: "CMS Insight",
        group: "CMS & KYC",
        page: "/bantuan/cms-ruang-asn/cms-insight",
      },
      {
        key: "kyc",
        label: "Verifikasi akun ASN",
        group: "CMS & KYC",
        page: "/admin/kyc/asn/[id]",
      },
    ],
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ASN access directory", () => {
  it("applies validated filters to the directory request", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/v1/asn/access/options")) {
        return Response.json(accessOptions);
      }
      if (url.endsWith("/api/v1/asn/access/summary")) {
        return Response.json({
          data: {
            total: 1,
            activeAndVerified: 1,
            executiveAccess: 0,
            requirementsIncomplete: 0,
          },
        });
      }
      return Response.json({ data: [person], total: 1, limit: 7, offset: 0 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AsnAccessDirectory />);
    expect(await screen.findByText("ASN contoh")).toBeTruthy();
    expect(screen.getByRole("option", { name: "CMS · Data Pemerintah" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "KYC · Verifikasi akun ASN" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "CMS Editor" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Cari nama atau NIP"), {
      target: { value: "  contoh  " },
    });
    fireEvent.change(screen.getByLabelText("Status akun"), {
      target: { value: "active" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan filter" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) => String(url).includes("q=contoh")),
      ).toBe(true);
    });
    const filteredCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("q=contoh"),
    );
    expect(String(filteredCall?.[0])).toContain("accountStatus=active");
  });

  it("filters CMS pages through their registered module access key", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/v1/asn/access/options")) {
        return Response.json(accessOptions);
      }
      if (url.endsWith("/api/v1/asn/access/summary")) {
        return Response.json({
          data: {
            total: 1,
            activeAndVerified: 1,
            executiveAccess: 0,
            requirementsIncomplete: 0,
          },
        });
      }
      return Response.json({ data: [person], total: 1, limit: 7, offset: 0 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AsnAccessDirectory />);
    await screen.findByText("ASN contoh");
    fireEvent.change(screen.getByLabelText("Peran aplikasi"), {
      target: { value: "module:ogd" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan filter" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url]) =>
            String(url).includes("/api/v1/asn/access?") &&
            String(url).includes("module=ogd"),
        ),
      ).toBe(true);
    });
  });

  it("requires draft and preview before confirming an access change", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void init;
      const url = String(input);
      if (url.endsWith("/api/v1/asn/access/options")) {
        return Response.json(accessOptions);
      }
      if (url.endsWith("/api/v1/asn/access/summary")) {
        return Response.json({
          data: {
            total: 1,
            activeAndVerified: 1,
            executiveAccess: 0,
            requirementsIncomplete: 0,
          },
        });
      }
      if (url.endsWith("/access-detail")) {
        return Response.json({ data: { ...person, requirements } });
      }
      if (url.includes("/executive-access/draft")) {
        return Response.json({
          data: {
            after: currentAccess,
            draftToken: "signed-draft-token",
            expiresAt: "2030-01-01T00:15:00.000Z",
          },
        });
      }
      if (url.includes("/access-preview?")) {
        return Response.json({
          data: {
            current: currentAccess,
            draft: {
              ...currentAccess,
              executiveStatus: "observer",
            },
            expiresAt: "2030-01-01T00:15:00.000Z",
          },
        });
      }
      if (url.endsWith("/executive-access/confirm")) {
        return Response.json({ data: { updated: true } });
      }
      return Response.json({ data: [person], total: 1, limit: 7, offset: 0 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AsnAccessDirectory />);
    await screen.findByText("ASN contoh");
    fireEvent.click(screen.getByRole("button", { name: "Kelola akses ASN contoh" }));

    fireEvent.click(
      await screen.findByRole("button", { name: "Tinjau perubahan" }),
    );
    expect(await screen.findByText("Perubahan yang diajukan")).toBeTruthy();
    expect(
      fetchMock.mock.calls.some(
        ([url]) => String(url).includes("/access-preview?draftToken="),
      ),
    ).toBe(true);

    const draftCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("/executive-access/draft"),
    );
    expect(draftCall).toBeTruthy();
    expect(JSON.parse(String(draftCall?.[1]?.body))).not.toHaveProperty("accountStatus");

    fireEvent.click(screen.getByRole("button", { name: "Konfirmasi perubahan" }));
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) =>
          String(url).endsWith("/executive-access/confirm"),
        ),
      ).toBe(true);
    });
    const confirmCall = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("/executive-access/confirm"),
    );
    expect(JSON.parse(String(confirmCall?.[1]?.body))).toEqual({
      draftToken: "signed-draft-token",
    });
  });

  it("shows a clear authorization error when ASN APIs deny access", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { error: "Superadmin access required" },
          { status: 403 },
        ),
      ),
    );

    render(<AsnAccessDirectory />);

    expect(
      await screen.findByText(
        "Akses ditolak. Direktori dan endpoint akses ASN hanya dapat digunakan oleh Superadmin.",
      ),
    ).toBeTruthy();
  });

  it("loads the selected ASN's activation requirements", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/v1/asn/access/options")) {
        return Response.json(accessOptions);
      }
      if (url.endsWith("/api/v1/asn/access/summary")) {
        return Response.json({
          data: {
            total: 1,
            activeAndVerified: 1,
            executiveAccess: 0,
            requirementsIncomplete: 0,
          },
        });
      }
      if (url.includes("/requirements")) {
        return Response.json({
          data: {
            userId: person.id,
            accountStatus: "active",
            requirements,
          },
        });
      }
      return Response.json({ data: [person], total: 1, limit: 7, offset: 0 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AsnAccessDirectory />);
    await screen.findByText("ASN contoh");
    fireEvent.click(screen.getByRole("button", { name: "Lihat syarat ASN contoh" }));

    expect(await screen.findByText("Syarat yang tercatat")).toBeTruthy();
    expect(screen.getAllByText("Terpenuhi").length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/v1/asn/${person.id}/requirements`,
      { cache: "no-store" },
    );
  });
});
