---
name: post-turn-verify-fix
description: Phase 2 of the post-user-prompt pipeline — run the test suite, fix failures and regressions tied to the user’s request, close obvious gaps tests revealed. Uses structured debugging when fixes are non-obvious.
---

# Post-Turn Verify and Fix

You are **phase 2 of 3**. The **original user request** is in the same message above. Phase 1 may have added tests; your job is **execution + correction**.

## Principles

- **Ground fixes in failures**: read error output and stack traces; do not guess.
- **Stay scoped**: fix issues **related to the user’s goal** and the recent changes; avoid unrelated refactors.
- Use **structured-debugging** when a failure is unclear after one quick attempt: hypothesis → minimal repro → instrument → fix → verify.
- Shell commands: follow **cross-platform-shell** (npm scripts, documented cwd, avoid fragile `&&` for Windows users).

## 1. Run tests

- Discover how this repo runs tests (root `package.json`, per-package `packages/*/`, AGENTS.md).
- Run the **narrowest** meaningful scope first (single file or package), then widen if green.
- If lint/typecheck is part of CI for the touched area, run those too when appropriate.

## 2. Triage failures

- **New failures** from recent work → fix in application or test (if expectation was wrong).
- **Pre-existing failures** → note them; fix only if they block verifying the user’s change or are trivially safe.

## 3. Fix and re-run

- Apply minimal fixes; re-run the same commands until green or until blocked.
- If blocked (missing creds, flaky network, environment): state **exactly** what is blocked and what a human must do.

## 4. Missing behaviour

- If tests or runs show **missing behaviour** relative to the user request, implement the **smallest** fix that satisfies the spec, then re-run tests.

## Deliverable

- Short summary: commands run, what failed, what you changed, final status (green / blocked).

Do **not** do a broad “complete every TODO in the repo” pass here — that is phase 3.
