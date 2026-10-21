import { describe, expect, it, vi } from "vitest";
import { BrevoEmailClient, BrevoError } from "@/modules/notifications";

const { sendTransacEmail } = vi.hoisted(() => ({ sendTransacEmail: vi.fn() }));

vi.mock("@getbrevo/brevo", () => ({
  BrevoClient: vi.fn(() => ({ transactionalEmails: { sendTransacEmail } })),
}));

describe("BrevoEmailClient", () => {
  it("wraps provider failures gracefully", async () => {
    const client = new BrevoEmailClient({ apiKey: "test", senderEmail: "noreply@example.com" });
    sendTransacEmail.mockRejectedValueOnce(new Error("down"));

    await expect(client.send({ to: { email: "user@example.com" }, subject: "s", html: "h", text: "t", templateName: "welcome", variables: {} })).rejects.toBeInstanceOf(BrevoError);
  });
});
