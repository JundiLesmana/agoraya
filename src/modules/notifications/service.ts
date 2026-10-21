import { randomUUID } from "node:crypto";

import { logger } from "@/lib/logger";
import type { OutboxRepository } from "../jobs/repository";
import type { BrevoEmailClient } from "./brevo";
import { renderNotificationTemplate } from "./templates";
import type { NotificationAuditContext, NotificationTemplateName } from "./types";

export interface NotificationServiceOptions {
  readonly brevo: BrevoEmailClient;
  readonly outbox: OutboxRepository;
}

export class NotificationService {
  constructor(private readonly options: NotificationServiceOptions) {}

  async queueEmail(templateName: NotificationTemplateName, recipient: { email: string; name?: string }, variables: Record<string, unknown>, audit: NotificationAuditContext = {}): Promise<void> {
    const message = renderNotificationTemplate(templateName, { recipient, variables });
    logger.info("notification.queued", { templateName, recipientEmail: recipient.email, ...audit });
    await this.options.outbox.enqueue({ id: randomUUID(), topic: "notifications.email", payload: { message, audit }, nextAttemptAt: new Date() });
  }

  async sendEmail(templateName: NotificationTemplateName, recipient: { email: string; name?: string }, variables: Record<string, unknown>, audit: NotificationAuditContext = {}): Promise<void> {
    const message = renderNotificationTemplate(templateName, { recipient, variables });
    logger.info("notification.sending", { templateName, recipientEmail: recipient.email, ...audit });
    const result = await this.options.brevo.send(message);
    logger.info("notification.sent", { templateName, recipientEmail: recipient.email, messageId: result.messageId, ...audit });
  }
}
