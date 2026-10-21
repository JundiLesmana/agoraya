export type NotificationChannel = "email";

export type NotificationTemplateName =
  | "otp"
  | "welcome"
  | "report-update"
  | "report-status"
  | "security-alert";

export interface NotificationRecipient {
  readonly email: string;
  readonly name?: string;
}

export interface NotificationTemplateRenderInput<TVariables extends Record<string, unknown> = Record<string, unknown>> {
  readonly recipient: NotificationRecipient;
  readonly variables: TVariables;
}

export interface NotificationMessage {
  readonly to: NotificationRecipient;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  readonly templateName: NotificationTemplateName;
  readonly variables: Record<string, unknown>;
}

export interface NotificationDeliveryResult {
  readonly messageId: string;
  readonly provider: "brevo";
  readonly acceptedAt: string;
}

export interface NotificationAuditContext {
  readonly requestId?: string;
  readonly tenantId?: string;
  readonly userId?: string;
  readonly notificationId?: string;
}

