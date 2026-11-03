import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/education-applications/privacy-check/route";

describe("education privacy check API", () => {
  it("rejects 16-digit NIK patterns in the request description", async () => {
    const response = await POST(
      new Request("http://localhost/api/education-applications/privacy-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kebutuhan: "NIK siswa 1234567890123456",
          catatan: "",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("NIK"),
    });
  });

  it("rejects 10-digit NISN patterns in the optional note", async () => {
    const response = await POST(
      new Request("http://localhost/api/education-applications/privacy-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kebutuhan: "Mohon bantuan biaya sekolah.",
          catatan: "NISN 1234567890",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("NISN"),
    });
  });

  it("allows text without a 10- or 16-digit identifier", async () => {
    const response = await POST(
      new Request("http://localhost/api/education-applications/privacy-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kebutuhan: "Mohon bantuan perlengkapan untuk sekolah.",
          catatan: "Bisa dihubungi pada jam kerja.",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ valid: true });
  });
});
