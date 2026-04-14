---
name: post-turn-deep-test
description: Phase 1 of the post-user-prompt pipeline — design and add tests (happy path, edge cases, security-sensitive paths) grounded in the user’s original request. Use after normal work so coverage matches intent, not generic boilerplate.
---

# Post-Turn Deep Test Pass

You are **phase 1 of 3** in an automated follow-up. The **original user request** was included above in the same message. The model may have already implemented something; your job is **testing discipline**, not re-implementing features unless tests expose real gaps.

## Scope

- Align tests with **what the user asked for** (behaviour, APIs, CLI flags, error messages, permissions).
- Prefer **existing** project test runners and patterns (Vitest, Jest, pytest, etc.).
- Apply the **cross-platform-shell** skill when suggesting shell: use `npm run …`, `npx …` from documented cwd, or separate steps — avoid bash-only `&&` as the only option.

## 1. Map intent → test surface

- Identify **public surfaces** changed or implied: functions, HTTP routes, CLI commands, file writes, config keys.
- List **invariants** the user cares about (correct output, idempotency, validation, authz).

## 2. Happy-path tests

- Minimal tests that prove the **main success path** works end-to-end where feasible.
- Use the project’s idioms (collocated `*.test.ts`, integration folder, etc.).

## 3. Edge-case tests

- Empty input, boundary values, malformed input, missing files, wrong types.
- Concurrency / ordering only if relevant to the change.
- Timeouts and cancellation if the feature is async or streaming.

## 4. Security-oriented tests

Think like an attacker **without** running real attacks on production:

- **Input validation**: injection-ish strings in fields that reach shell, SQL, paths, or logs (as applicable).
- **Path / file**: traversal patterns where paths are accepted; ensure workspace boundaries hold.
- **Authz**: if roles or tokens exist, tests for forbidden access (403 / denial).
- **Secrets**: no new logging of tokens or keys; tests can assert redaction or absence in output fixtures.
- **Dependencies**: if new deps were added, note supply-chain or known CVE checks only if the repo already has that workflow.

## 5. Deliverables

- **Add or extend** real test files; do not only describe tests in prose.
- Run the **appropriate** test command for this repo (see AGENTS.md / package scripts).
- Summarize: files added, what each group covers (happy / edge / security), and anything intentionally **not** tested (with reason).

Stop when this phase is complete; **do not** run the “fix all bugs” sweep here — that is phase 2.
