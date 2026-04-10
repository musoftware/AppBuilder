/**
 * Final quality-check phase: close typical coverage gaps by adding or wiring
 * automation in-repo. No “defer to human tester” outcomes — implement what the
 * stack can run in CI or locally.
 */
export const QC_COVERAGE_GAP_CLOSURE_TASK_DESCRIPTION = `
## Coverage gap closure (automated only)

Do not end with “human should verify” or manual-only checklists. Close each gap
by adding, enabling, or extending **runnable** automation that fits this repo.

Work through the following; skip an item only if it truly does not apply to
this project type, and say why in your summary.

1. **Acceptance / business outcomes** — If PRD.md, requirements docs, or similar
   exist, add or extend automated tests that assert those outcomes (e.g. API
   contract tests, end-to-end flows, golden-path scenarios). Use the project’s
   existing test frameworks.

2. **UI / full stack rendering** — Add or extend tests that exercise real UI or
   full request/render paths (browser automation, framework feature tests, or
   integration tests that hit templates/views), not only isolated unit mocks,
   for critical user journeys. Goal: catch broken layouts and runtime errors in
   automated runs.

3. **Performance / load** — If there is no load or stress automation, add a
   **minimal** baseline (e.g. short k6/Artillery/Locust/JMeter script, or the
   stack’s equivalent) and document the command in package scripts or CI. Keep
   it small and maintainable.

4. **Security** — Strengthen **automated** security checks: dependency audit in
   CI, secret scanning if missing, static rules appropriate to the language.
   Do not substitute for a formal pen test; automate everything reasonable
   without external human engagement.

5. **Accessibility** — If no a11y automation exists, add checks appropriate to
   the stack (e.g. axe with Playwright/Cypress, pa11y, or eslint a11y plugins)
   for main routes or components.

After changes, run the new or updated commands and fix failures. Summarize
what you added, how to run it, and any item you genuinely could not automate.
`.trim();
