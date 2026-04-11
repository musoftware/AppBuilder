[SKILL: prod-gate]

Read first:

- .project-brain/understand.md
- .project-brain/build.md
- .project-brain/harden.md
- .project-brain/test-fix.md

Check every item. Mark: PASS | FAIL | N/A

CODE:
[ ] No TODOs, FIXMEs, or placeholder code
[ ] No hardcoded secrets or magic numbers
[ ] No dead code or unused imports
[ ] All functions have error handling

FEATURES:
[ ] All COMPLETE features in understand.md work end-to-end
[ ] All roles have complete UI and enforced backend permissions
[ ] All CRUD operations work
[ ] All forms have validation and error feedback

TESTS:
[ ] All tests pass
[ ] Unit coverage ≥ 80%
[ ] Every role tested for correct access and correct denial

CONFIG:
[ ] All env vars in .env.example
[ ] App fails fast if required vars missing
[ ] No hardcoded config values

SECURITY:
[ ] All routes that need auth have it
[ ] Role check in backend (not just frontend)
[ ] No sensitive data in DOM for wrong roles

RELIABILITY:
[ ] Friendly error messages (no raw stack traces)
[ ] Logging in place
[ ] 401 redirects to login

DECISION:
If ALL PASS or N/A → print PROD_READY + 3-sentence summary
If ANY FAIL → print NOT_READY + list every failing item

---

Write output to: .project-brain/prod-gate.md

Append to: .project-brain/work-log.md
Add: `[<date>] skill:prod-gate — PROD_READY | NOT_READY`
