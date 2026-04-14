[SKILL: test-fix]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

Read first:

- .project-brain/test-unit.md
- .project-brain/test-integration.md
- .project-brain/test-e2e.md

Run ALL test files. Print raw output.

For each failure, categorize:

- SELECTOR BROKEN: UI element selector doesn't match DOM → update selector
- MOCK MISMATCH: mock shape doesn't match real API → update mock
- ROUTE WRONG: test uses wrong URL → fix URL
- TIMING ISSUE: assertion before data loads → add await/waitFor
- ENV ISSUE: missing env var or mock → add to test setup
- REAL BUG: test is correct, implementation is wrong → fix implementation

Fix in that order. After each category, re-run affected tests.

For each fix: print ✅ FIXED: <test name> — <category> — <what changed>

Run full suite one final time. Print results.

---

Write output to: .project-brain/test-fix.md using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — N tests fixed, N still failing>
<one line — fix categories applied: SELECTOR|MOCK|ROUTE|TIMING|ENV|BUG>
<one line — PASS | FAIL — final suite result> (3 lines max)

FINDINGS:

- <file:line> — <test name: fix category applied> — <what changed>
  (references only — never embed raw code blocks)

STATE:
<1–3 sentences: which failures need human decision, any real bugs found in implementation, prod-gate readiness>

NEXT_SKILLS: prod-gate

Rules:

- Never embed raw code. Use file:line references only.
- VERDICT: FAIL only for unrecoverable errors.

Append to: .project-brain/work-log.md
Add: `[<date>] skill:test-fix — <N> fixed, <N> still failing`
