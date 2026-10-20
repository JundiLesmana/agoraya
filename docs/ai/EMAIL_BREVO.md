# Email and Notification Contract

## Provider and channels

- **Brevo Transactional API is the sole outbound email provider** for OTP, account/security notifications, ticket status, escalation/digest, and other approved product emails.
- A user's address may be hosted by Gmail, Outlook, or another provider. That inbox is the recipient; **Brevo sends the email**.
- Do not use the Gmail API, direct Gmail SMTP, WhatsApp APIs, SMS gateways, or push notification systems.
- In-app notifications remain permitted and are distinct from email delivery.

## Implementation requirements

- Keep Brevo integration behind the existing notification adapter/service. Business modules should call a semantic method such as `sendOtpEmail` or `sendTicketStatusEmail`; they should not call Brevo directly.
- Use server-only `BREVO_API_KEY`; never expose it to client code or commit it. Document only the variable name in `.env.example`.
- Use verified sender/domain configured in Brevo; ensure SPF/DKIM are set operationally. Do not invent a sender address or claim DNS verification has passed.
- Use typed, version-controlled templates. Escape user-provided content; never insert untrusted HTML.
- Avoid sending full NIK, OTP, sensitive report content, or private upload URLs in subject lines. Send only the minimum necessary information.
- OTP email contains the short-lived code and expiry guidance; the code is not logged or cached as plaintext.
- Handle rate limits/timeouts/provider errors explicitly. Avoid duplicate notifications with idempotency/outbox patterns where the existing architecture supports them.
- Distinguish delivery-request accepted by Brevo from actual inbox delivery. Record sanitized provider status/message ID only when useful; never claim delivered unless provider evidence supports that state.
- Tests mock Brevo. Automated tests must not send real emails unless a specifically approved integration test uses a test inbox.

## Failure behavior

A transient email failure must not silently mark OTP as delivered or a notification as sent. Use bounded retries and the existing job/outbox mechanism where applicable. Do not block unrelated core reads because a digest email failed. Report user-safe guidance and log sanitized context.

## Scope guard

If a prompt asks to “add Gmail notifications”, interpret it as delivery to the user's email inbox through Brevo unless the issue explicitly changes the approved provider. If the request appears to require direct Gmail API/SMTP or an unsupported channel, flag the conflict and request a product decision.
