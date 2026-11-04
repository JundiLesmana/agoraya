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

  it("renders password reset links in HTML and text", () => {
    const rendered = renderNotificationTemplate("password-reset", {
      recipient: { email: "user@example.com", name: "User" },
      variables: {
        resetUrl: "https://example.com/reset?token=abc",
        expiresIn: "1 jam",
      },
    });

    expect(rendered.subject).toBe("Reset kata sandi Agoraya Anda");
    expect(rendered.html).toContain(
      'href="https://example.com/reset?token=abc"',
    );
    expect(rendered.text).toContain("https://example.com/reset?token=abc");
    expect(rendered.html).toContain("1 jam");
    expect(rendered.templateName).toBe("password-reset");
  });

  it("escapes password reset content before placing it in HTML", () => {
    const rendered = renderNotificationTemplate("password-reset", {
      recipient: { email: "user@example.com", name: "<script>alert(1)</script>" },
      variables: {
        resetUrl: 'https://example.com/reset?token="><script>alert(1)</script>',
        expiresIn: "<b>soon</b>",
      },
    });

    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).toContain("&lt;script&gt;");
    expect(rendered.html).toContain("&quot;&gt;&lt;script&gt;");
    expect(rendered.html).toContain("&lt;b&gt;soon&lt;/b&gt;");
  });
});
