# ADR 0002: Web-Only Evidence and Brevo Email

- Status: Accepted
- Date: 2026-10-19

## Context
The product scope is web-only and the team must keep integrations controllable for the competition/demo.

## Decision
No CCTV, camera feed, IoT hardware, sensor, firmware, MQTT device, or hardware verification. The reporting flow may use user-uploaded web evidence, browser-derived geotag as untrusted metadata, software QC, citizen confirmation and independent human review. All outbound email is sent using Brevo Transactional API. Do not add WhatsApp, SMS, direct Gmail API/SMTP, or push notifications. In-app notification remains allowed.

## Consequences
- No hardware dependency or claims of automated physical verification.
- Email operations depend on Brevo configuration/quota and must handle errors honestly.
- The recipient may use Gmail, but Gmail is not the sending provider.
