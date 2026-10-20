# Agent Task Protocol — One Issue, One Change Set

## Before editing

1. Read the issue, acceptance criteria, `AGENTS.md`, and relevant `docs/ai/` pages/ADRs.
2. Inspect branch/status, repository scripts, target files, call sites, migrations, tests, and recent related changes.
3. Summarize: problem, expected behavior, non-goals, files likely touched, test plan, risks.
4. If issue acceptance criteria are incomplete, do not guess about security, schema, money, privacy, or public API behavior; ask one focused question.

## During editing

- Keep changes aligned to one issue. Do not “improve nearby code” unless needed for correctness or testing and called out in the plan.
- Make the least invasive patch that fixes the root cause rather than masking symptoms.
- Add regression tests. For a bug, ensure the new test captures the previous failure.
- Use mocks/fakes at network/provider boundaries; no real email, AI calls, external BPS sync, or destructive database reset in tests by default.
- Keep secrets out of `.env.example`; names only, with safe placeholders when needed. Never inspect/print secret values in agent output.
- If tests reveal unrelated existing failures, report the exact failing command and distinguish baseline failure from your changes. Do not edit unrelated tests to force green.
- If scope requires an architecture/security change, pause and request approval plus ADR.

## Before finishing

1. Run the smallest relevant test during iteration.
2. Run full quality gates required by the repo/CI before finalizing.
3. Review `git diff --check`, full diff, changed file list, and status.
4. Check for accidental file deletions, generated output, credentials, PII, duplicate abstractions, TODOs, and unrelated formatting.
5. Update docs/ADR and issue checklist as applicable.
6. Provide the output contract in `AGENTS.md` including exact checks and limitations.

## Context recovery protocol

When the conversation starts over, context is compacted, or the agent is unsure what has been decided:

- Re-read `AGENTS.md`, `docs/ai/INDEX.md`, the issue, and relevant ADRs.
- Inspect `git status`, latest commit, target branch, and open diff.
- Reconstruct state from repository evidence. Do not invent progress or rely on previous chat summaries.
- Keep stable decisions in docs; keep task progress in issue/PR comments rather than scattering session notes through the codebase.

## Copy/paste task prompt

```text
Task: <ISSUE-ID> — <short title>
Read AGENTS.md and the mandatory docs in docs/ai/INDEX.md before coding.
Problem:
<observable problem, not a proposed implementation>
Acceptance criteria:
- [ ] <verifiable behavior>
- [ ] <verifiable behavior>
Non-goals:
- <what must not change>
Constraints:
- Preserve current public contracts, architecture, and unrelated behavior.
- Do not add dependencies or unrelated cleanup without approval.
Plan first. Inspect current code and tests, then implement the smallest complete change.
Add regression/security tests proportional to risk. Run and report exact commands/results.
If sources conflict or a material requirement is missing, stop and ask rather than guess.
```
