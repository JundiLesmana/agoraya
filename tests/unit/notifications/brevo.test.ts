import { describe, expect, it, vi } from "vitest";
import { BrevoEmailClient, BrevoError } from "@/modules/notifications";

describe("BrevoEmailClient", () => {
  it("wraps provider failures gracefully", async () => {
    const client = new BrevoEmailClient({ apiKey: "test", senderEmail: "noreply@example.com" });
    vi.spyOn(client, "send").mockRejectedValueOnce(new Error("down"));

    await expect(client.sendWithWrap({ to: { email: "user@example.com" }, subject: "s", html: "h", text: "t", templateName: "welcome", variables: {} })).rejects.toBeInstanceOf(BrevoError);
  });
});
