import { describe, expect, it } from "vitest";
import {
  APPLICATION_STEPS,
  getDocumentValidationError,
  getWizardProgress,
  isValidEmail,
  isValidNik,
  MAX_DOCUMENT_SIZE,
} from "@/app/(citizen)/citizen/apply/_components/service-application-data";

describe("service application validation", () => {
  it("validates email and 16-digit NIK formats", () => {
    expect(isValidEmail("warga@example.test")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidNik("1234567890123456")).toBe(true);
    expect(isValidNik("123456789012345")).toBe(false);
  });

  it("accepts PDF and JPG files up to 5 MB and rejects unsupported files", () => {
    expect(
      getDocumentValidationError(
        new File(["pdf"], "bukti.pdf", { type: "application/pdf" }),
      ),
    ).toBeNull();
    expect(
      getDocumentValidationError(
        new File(["jpg"], "foto.jpg", { type: "image/jpeg" }),
      ),
    ).toBeNull();
    expect(
      getDocumentValidationError(
        new File([new Uint8Array(MAX_DOCUMENT_SIZE)], "batas.pdf", {
          type: "application/pdf",
        }),
      ),
    ).toBeNull();
    expect(
      getDocumentValidationError(
        new File(["bad"], "script.js", { type: "text/javascript" }),
      ),
    ).toContain("PDF atau JPG");
    expect(
      getDocumentValidationError(
        new File([new Uint8Array(MAX_DOCUMENT_SIZE + 1)], "besar.pdf", {
          type: "application/pdf",
        }),
      ),
    ).toContain("5 MB");
  });

  it("calculates wizard progress for each of the four steps", () => {
    expect(APPLICATION_STEPS).toHaveLength(4);
    expect([1, 2, 3, 4].map(getWizardProgress)).toEqual([25, 50, 75, 100]);
  });
});
