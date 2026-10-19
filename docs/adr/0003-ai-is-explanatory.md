# ADR 0003: AI Does Not Own Decisions

- Status: Accepted
- Date: 2026-10-19

## Context
The Decision Engine needs repeatable outputs that can be audited and explained to reviewers/judges. LLM outputs are probabilistic and may contain incorrect numbers.

## Decision
Code and explicit human-approved policy calculate scores, rankings, gates, budgets, dependencies, schedules and forecasts. AI can narrate grounded results, classify/extract structured suggestions, or provide a second opinion. AI output is schema-validated and cannot write system-of-record decision fields or execute consequential actions autonomously.

## Consequences
- Deterministic tests can verify the actual decision.
- AI output requires provenance/grounding and safe fallback.
- Any move toward autonomous action requires a new, explicit risk/security review and ADR.
