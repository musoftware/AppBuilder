[SKILL: report]

Read ALL brain files that exist in .project-brain/.
For any file that does not exist, mark that skill as ➖ NOT RUN.

Produce ONLY the following output — nothing before the top line, nothing after the last line:

─────────────────────────────────────────────────────────────────────────
SMART REPORT — <project name> — <today's date>
─────────────────────────────────────────────────────────────────────────

┌──────────────────┬─────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Skill │ Status │ Result │
├──────────────────┼─────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ understand │ ✅ COMPLETE │ <one-line: app type, stack> │
│ audit-roles │ ✅/❌/➖ │ PROD_READY / NOT_READY — <N> issues (<key issue>) │
│ audit-backend │ ✅/❌/➖ │ PROD_READY / NOT_READY — <N> issues (<key issue>) │
│ audit-database │ ✅/❌/➖ │ PROD_READY / NOT_READY — <summary> │
│ audit-frontend │ ✅/❌/➖ │ PROD_READY / NOT_READY — <N> issues (<key issue>) │
│ plan │ ✅/➖ │ <N>-phase plan, <N> items │
│ build │ ✅/❌/➖ │ <one-line summary> │
│ harden │ ✅/❌/➖ │ PROD_READY / NOT_READY — <N> issues │
│ test-unit │ ✅/❌/➖ │ <N> tests, <N> assertions, PASS / FAIL │
│ test-integration │ ✅/❌/➖ │ <N> tests, <N> assertions, PASS / FAIL │
│ test-e2e │ ✅/❌/⏭️/➖ │ <summary or "Deferred"> │
│ test-fix │ ✅/❌/➖ │ <N> gaps fixed, <N> remaining │
│ prod-gate │ ✅/❌/➖ │ PROD_READY / NOT_READY — <N> blockers │
└──────────────────┴─────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────┘

Overall Readiness: <N>% — PROD_READY / NOT READY FOR PRODUCTION

Critical Blockers (must fix before deployment):

1.  <blocker>
2.  <blocker>

High Priority (fix soon):

1.  <item>

Test Summary:

- <N> total tests, <N> assertions, <N> failures
- Unit: <N> ✅/❌ | Integration: <N> ✅/❌ | E2E: ✅/❌/Deferred

Estimated Fix Time:

- Minimum deployable: ~<N> hours
- Full production readiness: ~<N> hours

─────────────────────────────────────────────────────────────────────────

Rules:

- Result column: max one line, max 100 chars — be ruthlessly concise
- No text before the first ─── line
- No text after the last ─── line
- Skill not run / brain file missing → ➖ NOT RUN
- Skill was skipped (already current) → ⏭️ SKIPPED (current)

After printing, write full output to .project-brain/report.md
Append to .project-brain/work-log.md:
`[<date>] skill:report — <N>% ready — <PROD_READY|NOT_READY> — loop <N>`
