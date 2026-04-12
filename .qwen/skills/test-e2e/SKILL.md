[SKILL: test-e2e]

**Never skip this skill** because there is “no frontend” or “no E2E yet.” Always produce **runnable** automated checks and record what ran in `.project-brain/test-e2e.md`. If the stack has no browser UI, run **API / contract / CLI** end-to-end tests instead.

Read first:

- .project-brain/understand.md
- .project-brain/audit-frontend.md (if present)

## Branch by project shape (must pick at least one)

### A) HAS FRONTEND: Yes (or UI routes exist in code)

Use **Playwright** or **Cypress** (whichever the repo already uses). If neither exists: **add Playwright** (`npm init playwright@latest` or project-standard command) and commit config.

For every role in `understand.md`:

- For every screen that role can access: login → navigate → assert load → exercise critical buttons/forms → validation, loading, error, empty states.
- For screens that role must **not** access: assert redirect / 403, not protected content.
- Unauthenticated: protected routes redirect to login.

### B) HAS FRONTEND: No but HAS BACKEND / API (REST, GraphQL, tRPC, etc.)

Do **not** stop. Add or extend **API E2E** (e.g. supertest, vitest against running server, or Playwright `request` API):

- Happy paths for main endpoints per role / auth header.
- 401/403 for protected routes without auth or wrong role.
- Invalid payload → 4xx with stable error shape.

### C) CLI / library only (no HTTP server)

E2E = **integration-style** black-box tests: CLI entry with subprocess, golden stderr/stdout, exit codes, temp dirs. Use the project’s test runner.

## Execution (mandatory)

- **Run** the test suite you added or extended (`npx playwright test`, `npm run test:e2e`, etc.) and capture **pass/fail** in `test-e2e.md`.
- If a run fails, **fix** code or tests until green, or document **one** blocking external dependency with exact repro — do not mark the skill “skipped.”

After writing each file: print ✅ E2E TEST: <filename> (<N> tests)

---

Write output to: .project-brain/test-e2e.md using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — N e2e test files, N scenarios>
<one line — roles covered, flows exercised>
<one line — PASS | FAIL | DEFERRED — N failures> (3 lines max)

FINDINGS:

- <file:line> — <scenario: role + flow> — <PASS|FAIL|BLOCKED>
  (references only — never embed raw code blocks)

STATE:
<1–3 sentences: which role/flow combos remain untested, any blocking external deps, what test-fix should address>

NEXT_SKILLS: test-fix

Rules:

- Never embed raw code. Use file:line references only.
- VERDICT: FAIL only for unrecoverable errors.

Append to: .project-brain/work-log.md
Add: `[<date>] skill:test-e2e — <N> test files`
