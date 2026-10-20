# Engineering Standards

## Principles in priority order

1. **Correctness and security** before speed or abstraction.
2. **Consistency with the existing repository** before personal style preferences.
3. **Simplicity (KISS/YAGNI)** before speculative extensibility.
4. **Single responsibility and cohesive modules**; separate presentation, rules, persistence, and external side effects.
5. **DRY when duplication is real**; do not build a generic framework from one example.
6. **Explicit contracts and deterministic behavior** for domain rules.
7. **Observability and diagnosability** without leaking sensitive data.
8. **Accessibility and responsive behavior** for user-facing changes.

## TypeScript and data contracts

- Use strict compiler settings already configured. Prefer inference for local variables and explicit types at module/API boundaries.
- Prefer `unknown` plus runtime validation over `any`.
- Define one canonical Zod schema for an API boundary when possible; infer TypeScript types from it rather than maintaining duplicated hand-written types.
- Validate inputs on the server; validate external provider responses before they enter business logic.
- Avoid `as` assertions unless a runtime invariant is already established and documented.
- Do not use empty `catch` blocks, broad fallback success responses, or `console.log` in production paths.

## Naming and consistency

- Follow neighboring naming, casing, import ordering, export patterns, and error conventions.
- Use domain language from the blueprint (ticket, tenant, CMS record, decision run, simulated data, source label) consistently.
- Keep one canonical name per concept. Do not introduce synonyms such as `case/report/complaint` for the same entity without a documented mapping.
- Avoid booleans whose meaning is unclear; use explicit state enums for lifecycle/status where transitions matter.
- Keep components and functions focused. Split by responsibility and readability rather than arbitrary line counts.

## API and UI

- Preserve existing endpoint paths, request/response shapes, status codes, and loading/error semantics unless the issue explicitly changes them.
- Parse and validate all mutation inputs server-side; authenticate and authorize every protected request on the server.
- Map domain errors to stable response codes/messages. Do not expose SQL errors, stack traces, secrets, PII, or internal provider prompts to clients.
- UI must support loading, empty, success, and failure states; use existing design tokens/components, semantic markup, keyboard navigation, focus visibility, and readable contrast.

## Database and migrations

- Schema changes require a migration and a test/rollback note. Never modify production data manually as an undocumented fix.
- Keep tenant predicates and row ownership explicit. Do not trust a `tenantId`, role, or owner supplied only by the client.
- Add indexes to support demonstrated query patterns; do not create indexes speculatively for every column.
- Use parameterized queries and the project's Drizzle conventions. Raw SQL is acceptable when required for RLS, triggers, or database capabilities, with a clear rationale.
- Audit/state transitions should be atomic with the action they record when possible.

## Dependencies and generated code

- No dependency addition/removal/upgrade without an issue rationale, license/security check, size/runtime consideration, and lockfile update.
- Do not overwrite generated code or lockfiles by hand. Use the repository's package manager.
- Do not introduce `TODO`, stub methods, fake data fallbacks, or `throw new Error('not implemented')` in a claimed-complete feature unless the issue expressly asks for a skeleton and the UI labels it as unavailable.

## Comments and documentation

Comments explain why a non-obvious decision exists, not narrate obvious code. Update README/API docs, ADRs, environment examples, and operational runbooks when behavior or setup changes.
