import { describe, expect, it } from "vitest";
import { getLocalDatabaseTarget } from "../../../scripts/local-database-target.js";

describe("getLocalDatabaseTarget", () => {
  it.each([
    "postgres://localhost:5432/agoraya_local",
    "postgres://127.0.0.1:5432/agoraya_local",
    "postgres://[::1]:5432/agoraya_local",
  ])("accepts local PostgreSQL URL %s", (url) => {
    expect(getLocalDatabaseTarget(url).databaseName).toBe("agoraya_local");
  });

  it.each([
    "postgres://ep-example.neon.tech/agoraya_local",
    "postgres://localhost:5432/production",
    "mysql://localhost:3306/agoraya_local",
  ])("rejects non-local or unexpected database URL %s", (url) => {
    expect(() => getLocalDatabaseTarget(url)).toThrow(
      /hanya diizinkan ke PostgreSQL localhost/,
    );
  });
});
