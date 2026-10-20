# Scope and Non-Goals

## In-scope product areas

The issue backlog and current implementation determine which features are active. The blueprint's core areas are:

- Public landing and aggregate dashboard using BPS data plus clearly labelled simulated data.
- Mock identity/registry and email OTP (not a claim of a real Dukcapil integration).
- Multi-tenant access controls (RBAC/ABAC/PDP and PostgreSQL RLS where established), audit hash-chain, and audit verification.
- Staff CMS Maker-Checker/review flows and auditable state transitions.
- Citizen reporting, unique tickets, photo/file evidence, web geotag where appropriate, SLA/auto-escalation, citizen confirmation and independent reviewer verification, evidence quality/duplicate checks.
- Deterministic project prioritization/Decision Engine, budgets/dependencies/sensitivity/what-if, forecasts and human-approved proposals.
- AI-assisted narrative/classification/risk extraction/second opinion with schema validation, grounding, PII scrubbing, fallback/cache/observability as implemented.
- In-app notifications and transactional email sent through Brevo.

## Explicit non-goals — do not implement without a reviewed product decision

- CCTV/camera surveillance verification, camera feeds, IoT devices, sensors, firmware, hardware access, robotics, MQTT device telemetry, or any hardware-dependent workflow.
- WhatsApp, SMS, direct Gmail API/SMTP delivery, or push notifications.
- Real Dukcapil/IKD/SIASN access without written authorization, verified credentials, and a reviewed integration decision.
- Autonomous AI decision-making, AI-issued budget changes, automatic project ranking overrides, auto-closing citizen reports, or unreviewed actions with legal/financial consequences.
- Microservices, Kubernetes, Kafka, RabbitMQ, a new persistent worker platform, or a new external data store without a measured need and accepted ADR.
- A new dependency or provider just because the model suggests it.
- Features classified as COULD/stretch while any MUST feature, security gate, or release blocker remains open.

## Clarification on evidence

Removing CCTV/IoT does **not** remove the web reporting evidence flow. Evidence may be a user-uploaded photo/document plus metadata, geotag as permitted by the existing design, duplicate/content QC, citizen confirmation, and independent human verification. Do not claim a photo proves a fix automatically.

## Scope-control rule

Each issue/PR must name its category: `bug`, `enhancement`, or `chore`. Work must include explicit acceptance criteria and a short non-goals list. If a requested feature crosses a non-goal, stop and get approval rather than building it silently.
