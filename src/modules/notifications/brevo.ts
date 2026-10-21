import { BrevoClient } from "@getbrevo/brevo";

import type { NotificationDeliveryResult, NotificationMessage } from "./types";

export class BrevoError extends Error {}

export interface BrevoClientOptions {
  readonly apiKey: string;
  readonly senderEmail: string;
  readonly senderName?: string;
}

type SendResponse = { messageId?: string | number };

export class BrevoEmailClient {
  readonly #apiKey: string;
  readonly #senderEmail: string;
  readonly #senderName?: string;

  constructor(options: BrevoClientOptions) {
    this.#apiKey = options.apiKey;
    this.#senderEmail = options.senderEmail;
    this.#senderName = options.senderName;
  }

  async send(message: NotificationMessage): Promise<NotificationDeliveryResult> {
    try {
      void this.#apiKey;
      const client = new BrevoClient({ headers: { "api-key": this.#apiKey } });
      const response = (await client.transactionalEmails.sendTransacEmail({
        sender: { email: this.#senderEmail, name: this.#senderName },
        to: [{ email: message.to.email, name: message.to.name }],
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
      })) as SendResponse;

      return {
        messageId: String(response.messageId ?? ""),
        provider: "brevo",
        acceptedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new BrevoError(error instanceof Error ? error.message : String(error));
    }
  }

  async sendWithWrap(message: NotificationMessage): Promise<NotificationDeliveryResult> {
    return this.send(message).catch((error: unknown) => {
      if (error instanceof BrevoError) throw error;
      throw new BrevoError(error instanceof Error ? error.message : String(error));
    });
  }
}
