/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FRONTEND_AUDIT_PHASE_1_PROMPT,
  FRONTEND_AUDIT_PHASE_2_PROMPT,
} from './frontendAuditPhase12Prompts.js';

function buildFrontendAuditPhase3(): string {
  return [
    '[FRONTEND AUDIT 3/4 — FEATURE TEST WRITER]',
    '',
    'Using the FRONTEND AUDIT REPORT and FRONTEND FIX SUMMARY, write feature tests',
    'that prove every screen works correctly for the right roles.',
    '',
    'First, identify the testing framework and tools this frontend uses:',
    '- E2E framework: Cypress | Playwright | Selenium | none',
    '- Component test framework: Testing Library | Enzyme | Vue Test Utils | none',
    '- If neither exists: install Playwright (most compatible with all frameworks)',
    '  Run: npm install --save-dev @playwright/test',
    '  Create: playwright.config.ts following Playwright docs',
    '',
    'Write THREE types of tests:',
    '',
    '════════════════════════════════════',
    'TYPE 1 — ROLE ACCESS TESTS',
    '════════════════════════════════════',
    'For every screen and every role combination, test:',
    '',
    'File: tests/frontend/role-access.spec.ts',
    '',
    'For each screen:',
    '  For each role that SHOULD have access:',
    "    test('<RoleName> can access <ScreenName>', async () => {",
    '      // Login as this role',
    '      // Navigate to the screen route',
    '      // Assert: screen loaded (no redirect to 403/login)',
    '      // Assert: correct page title or key element is visible',
    '    })',
    '',
    '  For each role that SHOULD NOT have access:',
    "    test('<RoleName> cannot access <ScreenName>', async () => {",
    '      // Login as this role',
    '      // Navigate to the screen route',
    '      // Assert: redirected to 403, login, or dashboard',
    '      // Assert: the protected screen content is NOT visible',
    '    })',
    '',
    "  test('unauthenticated user cannot access <ScreenName>', async () => {",
    '    // Do not login',
    '    // Navigate to the screen route',
    '    // Assert: redirected to login page',
    '  })',
    '',
    '════════════════════════════════════',
    'TYPE 2 — SCREEN FEATURE TESTS',
    '════════════════════════════════════',
    'For every screen, test each feature that exists on it:',
    '',
    'File: tests/frontend/screens/<screen-name>.spec.ts',
    '',
    'Structure each test file as:',
    '',
    "describe('<ScreenName>', () => {",
    '  beforeEach(async () => {',
    '    // Login as the primary role for this screen',
    '    // Navigate to the screen',
    '    // Wait for data to load',
    '  })',
    '',
    '  // LIST / VIEW',
    "  test('shows list of <entity> on load', async () => {",
    '    // Mock API response with test data',
    '    // Assert: items appear in the list',
    '    // Assert: correct columns/fields shown',
    '  })',
    '',
    "  test('shows empty state when no <entity> exist', async () => {",
    '    // Mock API response with empty array',
    '    // Assert: empty state message is visible',
    '    // Assert: create button is still visible (if role can create)',
    '  })',
    '',
    '  // CREATE',
    "  test('can create a new <entity>', async () => {",
    '    // Click create button',
    '    // Assert: form/modal opens',
    '    // Fill in form fields',
    '    // Submit',
    '    // Mock successful API response',
    '    // Assert: success feedback shown (toast or redirect)',
    '    // Assert: new item appears in list',
    '  })',
    '',
    "  test('shows validation errors on empty create form submit', async () => {",
    '    // Click create button',
    '    // Submit without filling fields',
    '    // Assert: validation error messages appear for required fields',
    '    // Assert: form did not submit (API not called)',
    '  })',
    '',
    '  // EDIT',
    "  test('can edit an existing <entity>', async () => {",
    '    // Click edit on first item',
    '    // Assert: form opens with existing data pre-filled',
    '    // Change a field value',
    '    // Submit',
    '    // Mock successful API response',
    '    // Assert: success feedback shown',
    '    // Assert: updated value appears in list',
    '  })',
    '',
    '  // DELETE',
    "  test('shows confirmation dialog before deleting', async () => {",
    '    // Click delete on first item',
    '    // Assert: confirmation dialog appears',
    '    // Click cancel',
    '    // Assert: item still in list (API not called)',
    '  })',
    '',
    "  test('can delete an <entity> after confirmation', async () => {",
    '    // Click delete on first item',
    '    // Confirm in dialog',
    '    // Mock successful API response',
    '    // Assert: item removed from list',
    '    // Assert: success feedback shown',
    '  })',
    '',
    '  // SEARCH / FILTER (if present)',
    "  test('can search/filter the list', async () => {",
    '    // Type in search field',
    '    // Assert: list updates to show only matching items',
    '    // Clear search',
    '    // Assert: full list returns',
    '  })',
    '',
    '  // ROLE-RESTRICTED ACTIONS',
    "  test('restricted actions are hidden for wrong role', async () => {",
    '    // Login as a role that should NOT have create/edit/delete',
    '    // Navigate to screen',
    '    // Assert: create button not present',
    '    // Assert: edit button not present',
    '    // Assert: delete button not present',
    '  })',
    '})',
    '',
    '════════════════════════════════════',
    'TYPE 3 — BROKEN WIRING REGRESSION TESTS',
    '════════════════════════════════════',
    'For every item that was fixed in Phase 2, write a regression test to',
    'make sure it does not break again:',
    '',
    'File: tests/frontend/regression/wiring.spec.ts',
    '',
    'For each previously dead button:',
    "  test('<screen> <button> actually calls the API', async () => {",
    '    // Intercept the API call',
    '    // Click the button',
    '    // Assert: API was called with correct method, path, and payload',
    '  })',
    '',
    'For each previously missing route:',
    "  test('<path> route loads without crashing', async () => {",
    '    // Navigate directly to <path>',
    '    // Assert: page renders (no white screen, no error boundary)',
    '    // Assert: correct component loaded',
    '  })',
    '',
    'For each previously missing guard:',
    "  test('<screen> redirects unauthenticated users', async () => {",
    '    // Clear auth state',
    '    // Navigate to protected route',
    '    // Assert: redirected to login',
    '  })',
    '',
    'After writing all test files, print:',
    '---TEST WRITE SUMMARY START---',
    'FILES CREATED:',
    '- tests/frontend/role-access.spec.ts: <N> tests',
    '- tests/frontend/screens/<n>.spec.ts: <N> tests each',
    '- tests/frontend/regression/wiring.spec.ts: <N> tests',
    'TOTAL TESTS: <N>',
    '---TEST WRITE SUMMARY END---',
  ].join('\n');
}

export function buildFrontendAuditQueue(): string[] {
  return [
    FRONTEND_AUDIT_PHASE_1_PROMPT,
    FRONTEND_AUDIT_PHASE_2_PROMPT,
    buildFrontendAuditPhase3(),

    // ─── PHASE 4 — TEST RUNNER & ANALYZER ────────────────────────────────────
    `[FRONTEND AUDIT 4/4 — FEATURE TEST RUNNER & ANALYZER]

Run all frontend feature tests written in Phase 3.
Then analyze every result and fix failures.

════════════════════════════════════
STEP 1 — RUN TESTS
════════════════════════════════════
Run the test suite. If Playwright:
  npx playwright test tests/frontend/
If Cypress:
  npx cypress run --spec "tests/frontend/**"
If Testing Library only:
  npx vitest run tests/frontend/

Print the full raw output.

════════════════════════════════════
STEP 2 — CATEGORIZE FAILURES
════════════════════════════════════
For each failing test:

- SELECTOR BROKEN: element selector doesn't match current DOM
  → Fix: update selector to match actual element (id, data-testid, role, text)

- MOCK MISMATCH: API mock response shape doesn't match what component expects
  → Fix: update mock to match actual API response shape from backend

- ROUTE WRONG: test navigates to wrong URL
  → Fix: update test URL to match actual route definition

- TIMING ISSUE: assertion runs before data loads
  → Fix: add waitFor, await, or proper async handling

- REAL BUG: test is correct but implementation is broken
  → Fix: fix the implementation in the component/screen, not the test

- AUTH FLOW BROKEN: login helper fails so all tests in suite fail
  → Fix: fix the login helper first, then re-run

════════════════════════════════════
STEP 3 — FIX AND RE-RUN
════════════════════════════════════
Fix all failures in category order above (fix SELECTOR BROKEN first
as it causes the most cascading failures).

After each category of fixes, re-run the affected tests before moving on.

For each fix print: ✅ TEST FIXED: <test name> — <category> — <what changed>

════════════════════════════════════
STEP 4 — FINAL GATE
════════════════════════════════════
Run the full test suite one final time. Print results.

---FRONTEND AUDIT FINAL REPORT START---
TOTAL TESTS: <N>
PASSED: <N>
FAILED: <N>

ROLE ACCESS COVERAGE:
- Roles tested: <list>
- Screen + role combinations tested: <N>

SCREENS FULLY TESTED: <list>
SCREENS WITH FAILING TESTS: <list>

REGRESSIONS CAUGHT: <N>
  (items that would have re-broken without the regression tests)

VERDICT:
- FRONTEND READY: all role guards correct, all screens complete, all tests pass
- FRONTEND NOT READY: <list of remaining issues>
---FRONTEND AUDIT FINAL REPORT END---`,
  ];
}
