[SKILL: smart-orchestrator]

You are the master orchestrator. You run a full loop:
understand → audit → plan → build → harden → test → report → fix → repeat.

You stop only when the report says PROD_READY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE A — UNDERSTAND (runs once, cached after)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check .project-brain/understand.md:

- EXISTS and contains current git commit hash → READ IT, skip re-scan
- MISSING or outdated → run .qwen/skills/understand/SKILL.md fully

After understand.md is ready, read it and determine:

- HAS_FRONTEND: Yes | No
- HAS_BACKEND: Yes | No

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE B — BUILD THE SKILL RUN LIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Always include:
audit-roles, plan, build, harden, prod-gate, report

If HAS_BACKEND is Yes → also include:
audit-backend, audit-database, test-unit, test-integration

If HAS_FRONTEND is Yes → also include:
audit-frontend, test-e2e

Always include after any test skill:
test-fix

Scan .qwen/skills/ for any extra skill folders not in the list above
(exclude: smart-orchestrator, understand).
For each extra skill found: read its SKILL.md first line.
If it applies to this project → insert it after build, before prod-gate.

For each skill in the list, check if .project-brain/<skill>.md exists
and contains the current git commit:

- YES → mark as SKIP (already current)
- NO → mark as RUN

Print the plan:

```
━━━ RUN PLAN ━━━
understand:         SKIP / RUN
audit-backend:      SKIP / RUN
audit-frontend:     SKIP / RUN
audit-roles:        SKIP / RUN
audit-database:     SKIP / RUN
plan:               SKIP / RUN
build:              SKIP / RUN
harden:             SKIP / RUN
test-unit:          SKIP / RUN
test-integration:   SKIP / RUN
test-e2e:           SKIP / RUN
test-fix:           SKIP / RUN
prod-gate:          RUN (always)
report:             RUN (always)
━━━━━━━━━━━━━━━━━
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE C — RUN ALL SKILLS IN ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each skill marked RUN (in order):
Print: ━━━ [<skill-name>] ━━━
Execute the full content of .qwen/skills/<skill-name>/SKILL.md
Wait for completion before moving to next skill

For each skill marked SKIP:
Print: ⏭ [<skill-name>] skipped — brain file current
Inject its .project-brain/<skill>.md as context for subsequent skills

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE D — REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After all skills complete, always run .qwen/skills/report/SKILL.md.
This produces the clean summary table.
Save output to .project-brain/report.md.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE E — DECISION LOOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read .project-brain/report.md.

IF report contains PROD_READY:
Print the report table.
Print: 🎉 PRODUCTION READY — smart run complete.
Append to .project-brain/work-log.md:
`[<date>] smart — PROD_READY after <N> loops`
STOP.

IF report contains NOT_READY:
Print the report table.
Print: 🔧 NOT READY — starting fix loop...

── FIX LOOP ──────────────────────────────────────────────

Read the "Critical Blockers" and "High Priority" sections from report.md.
Read full details for each blocker from the relevant brain files.
Do NOT re-scan source files unless a brain file says to.

Fix every Critical Blocker in this order:

For each blocker: 1. Identify which category it belongs to: - BACKEND: fix in routes / controllers / middleware / config - FRONTEND: fix in components / screens / forms / navigation - DATABASE: fix in migrations / models / schema - ROLES: fix in guards / policies / role definitions - CONFIG: fix in .env.example / config files - TESTS: fix in test files / test setup

    2. Read the relevant brain file for full context:
       - Backend blocker  → read .project-brain/audit-backend.md
       - Frontend blocker → read .project-brain/audit-frontend.md
       - Role blocker     → read .project-brain/audit-roles.md
       - DB blocker       → read .project-brain/audit-database.md
       - Harden blocker   → read .project-brain/harden.md
       - Test blocker     → read .project-brain/test-fix.md

    3. Make the fix. Follow existing code patterns exactly.
    4. Print: ✅ FIXED: <blocker> — <file(s) changed>

Then fix all High Priority items using the same approach.

── RE-RUN AFFECTED SKILLS ONLY ──────────────────────────

After all fixes, determine which skills need to re-run based on what changed:

- Changed any backend file (routes, controllers, middleware, config)?
  → re-run: audit-backend, test-integration

- Changed any frontend file (components, screens, forms, nav)?
  → re-run: audit-frontend
  → if HAS_FRONTEND and test-e2e was not deferred: re-run test-e2e

- Changed any role/policy/guard file?
  → re-run: audit-roles

- Changed any migration/model/schema file?
  → re-run: audit-database

- Changed any test file?
  → re-run: test-fix

Always re-run after fixes:
→ harden, prod-gate, report

For each skill to re-run:
Print: ━━━ [<skill-name>] re-running after fixes ━━━
Execute .qwen/skills/<skill-name>/SKILL.md fully
Update .project-brain/<skill>.md with new output

── NEW REPORT ────────────────────────────────────────────

Run .qwen/skills/report/SKILL.md again.
Update .project-brain/report.md.

── CHECK AGAIN ──────────────────────────────────────────

Read the new report.

IF PROD_READY → go to the PROD_READY branch above (STOP)

IF NOT_READY and blockers are different from previous loop:
→ loop back to fix loop with new blockers

IF NOT_READY and blockers are SAME as previous loop
(fixing did not resolve them):
Print the report.
Print: ⚠️ MANUAL INTERVENTION REQUIRED
Print: The following blockers could not be resolved automatically:
<list each unresolved blocker with reason>
Print: Fix these manually then run: mu --smart
STOP.

── LOOP SAFETY ───────────────────────────────────────────

Maximum fix loops: 3
If loop count reaches 3 without PROD_READY:
Print current report.
Print: ⚠️ MAX LOOPS REACHED (3) — remaining issues need manual review.
List all remaining blockers.
STOP.
