import { describe, expect, it } from "vitest";
import { reportSubmissionSchema } from "@/lib/validators/report";

const reportSubmission = {
  category: "Infrastruktur",
  subcategory: "Jalan rusak",
  title: "Jalan berlubang",
  description:
    "Lubang besar di jalan utama sudah beberapa kali membahayakan pengendara.",
  location: {
    province: "Jawa Barat",
    city: "Kota Bandung",
    address: "Jalan Melati",
    latitude: -6.9175,
    longitude: 107.6191,
  },
  name: "Melati Senja",
  isPublic: true,
  showIdentity: false,
  attachments: [],
};

describe("reportSubmissionSchema", () => {
  it("accepts a pseudonym without collecting contact information", () => {
    expect(reportSubmissionSchema.safeParse(reportSubmission).success).toBe(
      true,
    );
  });

  it.each(["email", "phone"])("rejects legacy %s fields", (field) => {
    expect(
      reportSubmissionSchema.safeParse({
        ...reportSubmission,
        [field]: "must-not-be-submitted",
      }).success,
    ).toBe(false);
  });
});