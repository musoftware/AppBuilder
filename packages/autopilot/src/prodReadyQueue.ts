/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

export function buildProdReadyQueue(focus?: string): string[] {
  const focusBlock = focus ? `\nUser focus: ${focus}\n` : '';

  return [
    // Phase 1 — ANALYST
    `[PROD-READY PHASE 1/7 — ANALYST]
${focusBlock}
You are a senior software analyst. Your only job in this step is to audit the current codebase. Do NOT implement anything.

1. List every module, feature, and endpoint that EXISTS and appears complete.
2. List every module, feature, and endpoint that is MISSING, stubbed, TODO, or partially implemented.
3. List any broken imports, missing files, or dead code.
4. List configuration gaps (missing env vars, hardcoded values that should be env-configurable).

Output a structured GAP REPORT:

---GAP REPORT START---
COMPLETE:
- <item>

MISSING:
- <item>

BROKEN:
- <item>

CONFIG GAPS:
- <item>
---GAP REPORT END---

Be exhaustive. Analysis only. Do not write any code.`,

    // Phase 2 — BUILDER
    `[PROD-READY PHASE 2/7 — BUILDER]
${focusBlock}
You are a senior software engineer. Using the GAP REPORT from Phase 1, implement all MISSING features and modules.

Rules:
- Work through the MISSING list one item at a time.
- Write complete, production-quality code — no placeholders, no TODOs.
- Follow the existing code style, naming conventions, and folder structure of this project.
- After implementing each item print: ✅ BUILT: <item name>
- Implement dependencies first before the features that need them.
- Do NOT touch existing complete code unless strictly required.

End with:
---BUILD SUMMARY START---
BUILT:
- <item>
SKIPPED (reason):
- <item>
---BUILD SUMMARY END---`,

    // Phase 3 — COMPLETER
    `[PROD-READY PHASE 3/7 — COMPLETER]
${focusBlock}
You are a senior software engineer focused on robustness. Review all code — existing and newly built — and complete:

1. ERROR HANDLING: Add try/catch, proper error types, and meaningful error messages everywhere missing.
2. EDGE CASES: Handle null/undefined/empty inputs, boundary values, and unexpected types.
3. VALIDATION: Add input validation at all entry points (API routes, function args, env vars).
4. ENVIRONMENT CONFIG: Replace any hardcoded values (URLs, ports, secrets, timeouts) with env var reads. Add them to .env.example.
5. LOGGING: Add structured logging at key operation points (start, success, failure).
6. GRACEFUL SHUTDOWN: Ensure SIGTERM/SIGINT is handled cleanly for any server or long-running process.

For each fix print: ✅ COMPLETED: <description>

End with:
---COMPLETION SUMMARY START---
FIXED:
- <item>
STILL NEEDS ATTENTION:
- <item>
---COMPLETION SUMMARY END---`,

    // Phase 4 — TEST WRITER
    `[PROD-READY PHASE 4/7 — TEST WRITER]
${focusBlock}
You are a senior QA engineer. Write a comprehensive test suite for this codebase.

UNIT TESTS:
- Every exported function and class method.
- Test happy path, edge cases, and error conditions.
- Mock all external dependencies (DB, HTTP, file system).

INTEGRATION TESTS:
- Test how modules work together end-to-end.
- Cover all main user flows (create → read → update → delete for each resource).
- Use a test database or in-memory equivalent — never production data.

E2E TESTS (if applicable):
- Simulate real client requests against the running app.
- Cover critical paths (auth, main feature flows, error responses).

Rules:
- Use the testing framework already in package.json. If none exists, add Vitest (already used in this project).
- Name test files <module>.test.ts following the existing convention in this project.
- Each test must have a clear description string.
- After writing each file print: ✅ TESTS WRITTEN: <filename>

End with:
---TEST SUMMARY START---
FILES CREATED:
- <filename>: <N> tests
COVERAGE ESTIMATE:
- Units: <N> functions covered
- Integration: <N> flows covered
- E2E: <N> paths covered
---TEST SUMMARY END---`,

    // Phase 5 — TEST ANALYZER
    `[PROD-READY PHASE 5/7 — TEST ANALYZER]
${focusBlock}
You are a QA analyst. Run the full test suite and analyze results.

1. Run all tests. Print the raw output.
2. Categorize each failure:
   - LOGIC BUG: implementation is wrong
   - MISSING IMPLEMENTATION: tested code does not exist yet
   - TEST BUG: the test itself is incorrectly written
   - ENVIRONMENT ISSUE: missing env var, wrong DB state, etc.
3. Identify untested areas — functions or paths with no coverage.
4. Flag any flaky tests.

End with:
---TEST ANALYSIS START---
PASSED: <N>
FAILED: <N>

FAILURES:
- <test name>: <category> — <description>

UNTESTED AREAS:
- <function or path>

FLAKY TESTS:
- <test name>
---TEST ANALYSIS END---

If ALL tests pass and coverage is acceptable, append: READY_FOR_PROD_CHECK`,

    // Phase 6 — FIXER
    `[PROD-READY PHASE 6/7 — FIXER]
${focusBlock}
You are a senior engineer. Your job is to finish everything that is unfinished.
You have TWO sources of work — process BOTH before moving on:

SOURCE 1: The COMPLETION SUMMARY from the previous phase.
SOURCE 2: The TEST ANALYSIS from the test analyzer phase.

Do NOT re-analyze the codebase from scratch.
Do NOT rerun the audit.
Read the output of the previous phases and act on it directly.

════════════════════════════════════════════════
PART 1 — FINISH "STILL NEEDS ATTENTION" ITEMS
════════════════════════════════════════════════

Find the ---COMPLETION SUMMARY END--- block from the Completer phase.
Locate the "STILL NEEDS ATTENTION" list inside it.

For each item in that list:

Step 1 — Classify it:
  - IMPLEMENTABLE NOW: all dependencies exist, can be built immediately
  - BLOCKED: requires a library, external service, or another feature first
  - ARCHITECTURAL: requires a design decision before implementation

Step 2 — Act on it:

  If IMPLEMENTABLE NOW:
    Build it completely. Follow the existing code patterns in this project.
    Do not leave stubs. Do not defer.
    After finishing: print ✅ FINISHED: <item name> — <files created or changed>

  If BLOCKED by a missing library:
    Install the library using the package manager this project uses.
    Then implement the feature completely.
    After finishing: print ✅ FINISHED: <item name> — installed <package>, created <files>

  If BLOCKED by something that genuinely cannot be resolved now
  (external API key not available, requires product decision, etc.):
    Create a placeholder implementation that:
      - Does not crash the app
      - Returns a clear "not yet implemented" response
      - Has a TODO comment with exactly what is needed to complete it
    Print ⚠️ DEFERRED: <item name> — <exact reason> — placeholder added at <file>

  If ARCHITECTURAL:
    Make a decision. Pick the simpler option. Implement it.
    Document the decision in a comment at the top of the relevant file.
    Print ✅ DECIDED AND BUILT: <item name> — <decision made>

For the specific example of "STILL NEEDS ATTENTION" items like these,
here is how to handle each category:

  "X library not installed" → run npm/composer/pip install X, then implement
  "Y method exists but no UI" → create the UI component/blade/form that calls Y
  "Z only partially implemented" → find Z in the code, complete the missing parts
  "A and B are near-duplicates" → consolidate them into one, update all callers
  "No CRUD interface for X" → create the full CRUD: list, create, edit, delete, confirm

════════════════════════════════════════════════
PART 2 — FIX TEST FAILURES
════════════════════════════════════════════════

Find the ---TEST ANALYSIS START--- block from the Test Analyzer phase.
Work through failures in this exact order:

1. ENV ISSUES first (unblock other tests)
   - Add missing env vars to .env.example
   - Fix missing mocks or test setup files

2. TYPE ERRORS second (unblock compilation)
   - Fix TypeScript or type errors in source or test files

3. LOGIC BUGS third (fix the implementation, not the test)
   - Read what the feature is supposed to do before changing code
   - The test is the spec — make the code match it

4. MISSING IMPLEMENTATION (add the missing code)
   - Implement what the test expects, following existing patterns

5. TEST BUGS last (fix the test, not the code)
   - Only change a test if you are certain the implementation is correct
   - Add a comment explaining what was wrong with the test

6. UNTESTED AREAS
   - Write new tests for every function or path flagged as untested
   - Follow the existing test file naming convention

7. FLAKY TESTS
   - Fix the root cause if possible
   - If not: add // FLAKY: <reason>, mark as skipped with explanation

For each fix: print ✅ FIXED: <test name> — <what changed and why>

After all fixes, run the test suite again and print the new results.

════════════════════════════════════════════════
FINAL OUTPUT
════════════════════════════════════════════════

---FIX SUMMARY START---
FINISHED FROM PREVIOUS PHASE:
- <item>: <what was built> — <files>

DEFERRED (with placeholder):
- <item>: <exact reason> — <placeholder location>

TEST FIXES:
- <test name>: <what changed>

NEW TESTS WRITTEN:
- <filename>: <what it covers>

STILL FAILING (genuine blockers — needs human decision):
- <item>: <why it cannot be fixed automatically>

FINAL TEST RESULT: <N> passed / <N> failed
---FIX SUMMARY END---`,

    // Phase 7 — PROD CHECK
    `[PROD-READY PHASE 7/7 — PRODUCTION CHECK]
${focusBlock}
You are a principal engineer doing a final production readiness review.
Check every item below. Mark each: PASS, FAIL, or N/A.

CODE QUALITY:
[ ] No TODOs, FIXMEs, or placeholder code remaining
[ ] No hardcoded secrets, credentials, or magic strings
[ ] All functions have consistent error handling
[ ] No dead code or unused imports

TESTING:
[ ] All tests pass
[ ] Unit test coverage ≥ 80%
[ ] Integration tests cover all main user flows
[ ] No known flaky tests

CONFIGURATION:
[ ] All environment variables documented in .env.example
[ ] App reads config from environment — no hardcoded values
[ ] Graceful shutdown implemented

RELIABILITY:
[ ] Input validation at all entry points
[ ] Meaningful error messages (no raw stack traces to end users)
[ ] Logging in place for key operations

DEPENDENCIES:
[ ] No known critical vulnerabilities (run npm audit)
[ ] No unused dependencies in package.json

Decision:
- If ALL items are PASS or N/A → print: PROD_READY
  Then print a short summary of what was built and what the app does.

- If ANY item is FAIL → print: NOT_READY
  List every failing item.
  Print: LOOP_REQUIRED`,
  ];
}
