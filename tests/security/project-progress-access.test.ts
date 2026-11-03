import { describe, expect, it } from "vitest";
import { handleSubmit } from "@/modules/project-progress/service";
import type { Session } from "@/lib/auth/session";

const SESSION: Session = {
  userId: "11111111-1111-4111-8111-111111111111",
  tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  role: "asn",
  roles: ["asn"],
};

function requestWithFile(file: File): Request {
  const entries: [string, string | File][] = [
    ["project_id", "22222222-2222-4222-8222-222222222222"],
    ["periode_bulan", "10"],
    ["periode_tahun", "2025"],
    ["progres_fisik", "10"],
    ["progres_keuangan", "10"],
    ["catatan", "Catatan pengujian"],
    ["mode", "submit"],
    ["dokumen", file],
  ];
  return {
    async formData() {
      return {
        entries: () => entries,
        getAll: (name: string) =>
          entries.filter(([key]) => key === name).map(([, value]) => value),
      };
    },
  } as unknown as Request;
}

function jpegFile(name = "foto.jpg"): File {
  return new File(
    [new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(96).fill(0)])],
    name,
    { type: "image/jpeg" },
  );
}

describe("Project progress access and upload validation", () => {
  it("denies users without the ASN/staff role", async () => {
    const response = await handleSubmit(new Request("http://localhost"), {
      ...SESSION,
      role: "citizen",
      roles: ["citizen"],
    });
    expect(response.status).toBe(403);
  });

  it("rejects executable files presented as photos before persistence", async () => {
    const file = new File([new Uint8Array(100)], "foto.exe", {
      type: "application/vnd.microsoft.portable-executable",
    });
    const response = await handleSubmit(requestWithFile(file), SESSION);
    expect(response.status).toBe(400);
  });

  it("rejects PHP extensions even when the file claims to be JPEG", async () => {
    const response = await handleSubmit(
      requestWithFile(jpegFile("foto.php")),
      SESSION,
    );
    expect(response.status).toBe(400);
  });

  it("rejects files whose signature does not match their declared MIME type", async () => {
    const file = new File([new Uint8Array(100)], "foto.jpg", {
      type: "image/jpeg",
    });
    const response = await handleSubmit(requestWithFile(file), SESSION);
    expect(response.status).toBe(400);
  });
});
