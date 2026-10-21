import { describe, expect, it } from "vitest";
import { renderNotificationTemplate } from "@/modules/notifications";

describe("notification templates", () => {
  it("replaces template variables", () => {
    const rendered = renderNotificationTemplate("otp", {
      recipient: { email: "user@example.com", name: "User" },
      variables: { code: "123456", expiresIn: "5 minutes" },
    });

    expect(rendered.subject).toContain("123456");
    expect(rendered.text).toContain("123456");
    expect(rendered.html).toContain("123456");
  });
});

