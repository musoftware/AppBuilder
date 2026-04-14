[SKILL: report]

Read ALL brain files that exist in .project-brain/.
For any file that does not exist, mark that skill as ➖ NOT RUN.

VALIDATION STEP (do this first):
For each brain file that exists, check it has all four required sections in this order:
SUMMARY → FINDINGS → STATE → NEXT_SKILLS
If any brain file is missing one or more sections, note it as ⚠️ INVALID FORMAT in the table Result column.

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
│ review-as-pm │ ✅/❌/➖ │ OK / NEEDS_WORK — <N> themes; top: <short> │
│ prod-gate │ ✅/❌/➖ │ PROD_READY / NOT_READY — <N> blockers │
└──────────────────┴─────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────┘

Overall Readiness: <N>% — PROD_READY / NOT READY FOR PRODUCTION

Critical Blockers (must fix before deployment):

1.  <blocker>
2.  <blocker>

High Priority (fix soon):

1.  <item>

PM / product follow-through (required when `.project-brain/review-as-pm.md` exists):

- If that file says **NEEDS_WORK**, copy **at least one** concrete, code- or doc-anchored row from its **Issues** list into **Critical** or **High** above (whichever severity fits). Do **not** leave PM output only in the table row — the orchestrator **Fix:** loop reads Critical/High here, not `review-as-pm.md` alone.
- If Issues are empty but Themes show gaps, add one **High** item pointing to the best file or doc to change.

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
- Brain file exists but missing required sections → ⚠️ INVALID FORMAT in result column

NEXT_SKILLS scanning:
After printing the table, scan every brain file's NEXT_SKILLS: line.
If any skill is listed that was not run (not in the table above), append it under:

Recommended follow-up skills (from NEXT_SKILLS):

- <skill-name>: suggested by <source-brain-file>

After printing, write full output to .project-brain/report.md

Also write .project-brain/report.md in the standard skill format:

SUMMARY:
<one line — overall readiness %>
<one line — top blocker>
<one line — PROD_READY | NOT_READY>

FINDINGS:

- <file:line> — <finding> — <severity>

STATE:
<1–3 sentences: what the next skill or human needs to act on>

NEXT_SKILLS: none

Append to .project-brain/work-log.md:
`[<date>] skill:report — <N>% ready — <PROD_READY|NOT_READY> — loop <N>`
