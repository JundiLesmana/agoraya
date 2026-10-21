import type { NotificationMessage, NotificationTemplateName, NotificationTemplateRenderInput } from "./types";

type TemplateDefinition<TVariables extends Record<string, unknown>> = {
  readonly subject: (input: NotificationTemplateRenderInput<TVariables>) => string;
  readonly html: (input: NotificationTemplateRenderInput<TVariables>) => string;
  readonly text: (input: NotificationTemplateRenderInput<TVariables>) => string;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const escapeText = (value: string): string => value.replaceAll(/\s+/g, " ").trim();

function readString(variables: Record<string, unknown>, key: string, fallback = ""): string {
  const value = variables[key];
  return typeof value === "string" ? value : fallback;
}

const templates: Record<NotificationTemplateName, TemplateDefinition<Record<string, unknown>>> = {
  otp: {
    subject: ({ variables }) => `Your Agoraya verification code is ${readString(variables, "code")}`,
    html: ({ recipient, variables }) => {
      const code = escapeHtml(readString(variables, "code"));
      const expiry = escapeHtml(readString(variables, "expiresIn", "5 minutes"));
      return `<p>Hello ${escapeHtml(recipient.name ?? recipient.email)},</p><p>Your verification code is <strong>${code}</strong>.</p><p>This code expires in ${expiry}.</p>`;
    },
    text: ({ recipient, variables }) =>
      escapeText(`Hello ${recipient.name ?? recipient.email}, Your verification code is ${readString(variables, "code")}. This code expires in ${readString(variables, "expiresIn", "5 minutes")}.`),
  },
  welcome: {
    subject: () => "Welcome to Agoraya",
    html: ({ recipient, variables }) => `<p>Hello ${escapeHtml(recipient.name ?? recipient.email)},</p><p>${escapeHtml(readString(variables, "message", "Welcome aboard."))}</p>`,
    text: ({ recipient, variables }) => escapeText(`Hello ${recipient.name ?? recipient.email}, ${readString(variables, "message", "Welcome aboard.")}`),
  },
  "report-update": {
    subject: ({ variables }) => `Report update: ${readString(variables, "title", "Your report")}`,
    html: ({ variables }) => `<p>${escapeHtml(readString(variables, "summary", "Your report has been updated."))}</p>`,
    text: ({ variables }) => escapeText(readString(variables, "summary", "Your report has been updated.")),
  },
  "report-status": {
    subject: ({ variables }) => `Report status: ${readString(variables, "status", "updated")}`,
    html: ({ variables }) => `<p>Status changed to <strong>${escapeHtml(readString(variables, "status", "updated"))}</strong>.</p>`,
    text: ({ variables }) => escapeText(`Status changed to ${readString(variables, "status", "updated")}.`),
  },
  "security-alert": {
    subject: () => "Security alert from Agoraya",
    html: ({ variables }) => `<p>${escapeHtml(readString(variables, "message", "We detected an account security event."))}</p>`,
    text: ({ variables }) => escapeText(readString(variables, "message", "We detected an account security event.")),
  },
};

export function renderNotificationTemplate<TName extends NotificationTemplateName>(name: TName, input: NotificationTemplateRenderInput): NotificationMessage {
  const template = templates[name];
  return {
    to: input.recipient,
    subject: template.subject(input),
    html: template.html(input),
    text: template.text(input),
    templateName: name,
    variables: input.variables,
  };
}

