import { describe, expect, it } from "vitest";
import {
  hashPassword,
  verifyPassword,
} from "@/modules/identity/password/service";

describe("password credentials", () => {
  it("stores passwords as salted scrypt hashes and verifies the matching password", async () => {
    const storedHash = await hashPassword("contoh-kata-sandi-yang-kuat");

    expect(storedHash).toMatch(
      /^scrypt\$32768\$8\$1\$[a-f\d]{32}\$[a-f\d]{128}$/i,
    );
    expect(storedHash).not.toContain("contoh-kata-sandi-yang-kuat");
    await expect(
      verifyPassword("contoh-kata-sandi-yang-kuat", storedHash),
    ).resolves.toBe(true);
    await expect(
      verifyPassword("kata-sandi-yang-salah", storedHash),
    ).resolves.toBe(false);
  });

  it("rejects hashes with unsupported or malformed parameters", async () => {
    await expect(verifyPassword("apa saja", "plaintext")).resolves.toBe(false);
    await expect(
      verifyPassword("apa saja", "scrypt$999999$8$1$bad$bad"),
    ).resolves.toBe(false);
  });
});
