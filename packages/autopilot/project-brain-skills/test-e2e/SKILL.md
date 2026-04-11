[SKILL: test-e2e]

Read first:

- .project-brain/understand.md
- .project-brain/audit-frontend.md
- If HAS FRONTEND is No → print "No frontend — skill skipped" and stop

Use existing E2E framework (Playwright, Cypress). If none: install Playwright.

For every role in understand.md:
For every screen that role can access: - Login as that role - Navigate to the screen - Assert screen loads (not redirected) - Test every button that should exist (create, edit, delete, export...) - Test form validation (submit empty → errors shown) - Test loading state, error state, empty state

For every screen that role should NOT access:

- Login as wrong role
- Navigate to screen
- Assert redirected (not the protected content)

Unauthenticated access:

- Navigate to every protected route
- Assert redirect to login

After writing each file: print ✅ E2E TEST: <filename> (<N> tests)

---

Write output to: .project-brain/test-e2e.md

Append to: .project-brain/work-log.md
Add: `[<date>] skill:test-e2e — <N> test files`
