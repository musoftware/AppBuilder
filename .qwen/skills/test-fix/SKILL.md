[SKILL: test-fix]

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

Write output to: .project-brain/test-fix.md
Format:

# Test Fix Log

## Fixed

- <test>: <category> — <what changed>

## Still Failing

- <test>: <reason — needs human decision>

## Final Result

PASSED: <N> | FAILED: <N>

Append to: .project-brain/work-log.md
Add: `[<date>] skill:test-fix — <N> fixed, <N> still failing`
