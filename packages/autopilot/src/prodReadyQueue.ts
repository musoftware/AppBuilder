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
You are a senior engineer. Using the TEST ANALYSIS from Phase 5, fix all issues in this order:

1. LOGIC BUG failures — correct the implementation.
2. MISSING IMPLEMENTATION failures — add the missing code.
3. TEST BUG failures — correct the test (only if the implementation is actually correct).
4. ENVIRONMENT ISSUE failures — add missing env vars to .env.example and document them.
5. Write NEW tests for UNTESTED AREAS identified.
6. Remove or quarantine FLAKY tests with a comment explaining why.

For each fix print: ✅ FIXED: <test name> — <what you changed>

Do not break passing tests while fixing failing ones.

End with:
---FIX SUMMARY START---
FIXED:
- <item>
NEW TESTS ADDED:
- <item>
STILL FAILING (needs manual review):
- <item>
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
