# Decision Log for AI-Assisted Work

Record a short entry only for decisions that persist beyond one task. The detailed architectural decisions belong in `docs/adr/`.

## Baseline decisions

- **D-001 — Web-only product:** no CCTV/IoT/hardware integration or verification workflow.
- **D-002 — Email provider:** Brevo Transactional API is the only outbound email provider. Gmail is an example recipient inbox, not an additional provider. In-app notifications are allowed; WhatsApp/SMS/push are out of scope.
- **D-003 — Architecture:** Next.js modular monolith; do not introduce microservices or permanent workers without an ADR.
- **D-004 — Identity for demo:** use mock/synthetic registry unless official access is approved and implemented through a reviewed adapter.
- **D-005 — Decision Engine:** deterministic code and human-approved policy own scores, rankings, budgets, and decisions; AI explains and provides bounded second opinions only.
- **D-006 — Provenance:** real BPS data and simulated/unverified data must be visibly distinguishable.
- **D-007 — Source control:** feature branches originate from `development`; reviewed PRs integrate to `development`; releases are reviewed from `development` to protected `main`.

## Entry template

```text
ID: D-XXX
Date:
Status: proposed | accepted | superseded
Context:
Decision:
Alternatives considered:
Consequences/trade-offs:
Issue/PR:
```

Agents must not change accepted baseline decisions. Propose a new decision/ADR and request human approval instead.
