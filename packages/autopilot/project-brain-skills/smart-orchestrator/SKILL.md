[SKILL: smart-orchestrator]

You are the master orchestrator. You run a full loop:
understand → audit → plan → build → harden → test → report → fix → repeat.

You stop only after the **decision loop** (PHASE E) reads a report that says PROD_READY. The decision loop **always runs** at least once — never skip PHASE E or short-circuit the smart run when things look fine; always enter the loop, read `.project-brain/report.md`, then branch.

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
PHASE E — DECISION LOOP (ALWAYS RUNS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Rule:** After PHASE D you MUST enter this loop. Do not end the smart run from
report text alone without going through at least one full iteration below — even
when the project is already green (PROD_READY).

Initialize:

- `decision_iteration = 0`
- `fix_round = 0` (counts NOT_READY → fix → re-report cycles; max 3)
- `previous_blockers_fingerprint = null` (optional string hash/summary of Critical+High lists for stall detection)

```
REPEAT forever (until you BREAK out with success, manual stop, or max fix rounds):

  decision_iteration += 1
  Print: ━━━ Decision loop iteration <decision_iteration> ━━━

  Read .project-brain/report.md (always read fresh from disk this iteration).

  ── Branch: PROD_READY ───────────────────────────────────

  IF report contains PROD_READY:
    Print the report table.
    Print: 🎉 PRODUCTION READY — smart run complete.
    Append to .project-brain/work-log.md:
      `[<date>] smart — PROD_READY — decision iterations: <decision_iteration>, fix rounds: <fix_round>`
    BREAK (exit REPEAT — smart run complete).

  ── Branch: NOT_READY ────────────────────────────────────

  IF report contains NOT_READY (or no PROD_READY):

    IF fix_round >= 3:
      Print current report.
      Print: ⚠️ MAX FIX ROUNDS REACHED (3) — remaining issues need manual review.
      List all remaining blockers.
      BREAK (exit REPEAT — stop smart run).

    fix_round += 1
    Print the report table.
    Print: 🔧 NOT READY — fix round <fix_round> / 3…

    ── FIX (this round) ───────────────────────────────────

    Read "Critical Blockers" and "High Priority" from report.md.
    Read full details for each blocker from the relevant brain files.
    Do NOT re-scan source files unless a brain file says to.

    Compare to previous_blockers_fingerprint:
    IF same as previous round AND fix_round > 1:
      Print the report.
      Print: ⚠️ MANUAL INTERVENTION REQUIRED
      Print: The following blockers could not be resolved automatically:
      <list each unresolved blocker with reason>
      Print: Fix these manually then run: mu --smart
      BREAK (exit REPEAT — stop smart run).

    Set previous_blockers_fingerprint from current Critical + High lists.

    Fix every Critical Blocker in order. For each blocker:

    1. Category: BACKEND | FRONTEND | DATABASE | ROLES | CONFIG | TESTS
       (routes/controllers/middleware/config | components/screens/forms/nav |
       migrations/models/schema | guards/policies/roles | .env.example/config |
       test files / setup)

    2. Read brain context:
       - Backend  → .project-brain/audit-backend.md
       - Frontend → .project-brain/audit-frontend.md
       - Roles    → .project-brain/audit-roles.md
       - Database → .project-brain/audit-database.md
       - Harden   → .project-brain/harden.md
       - Tests    → .project-brain/test-fix.md

    3. Implement the fix (match existing project patterns).
    4. Print: ✅ FIXED: <blocker> — <file(s) changed>

    Then fix all High Priority items the same way.

    ── RE-RUN AFFECTED SKILLS ONLY ───────────────────────

    After fixes, re-run skills based on what changed:

    - Backend files touched → audit-backend, test-integration
    - Frontend files touched → audit-frontend; if HAS_FRONTEND and test-e2e not deferred → test-e2e
    - Role/policy/guard touched → audit-roles
    - Migration/model/schema touched → audit-database
    - Test files touched → test-fix

    Always after fixes → harden, prod-gate, report

    For each skill to re-run:
      Print: ━━━ [<skill-name>] re-running after fixes ━━━
      Execute .qwen/skills/<skill-name>/SKILL.md fully
      Update .project-brain/<skill>.md

    Run .qwen/skills/report/SKILL.md again; update .project-brain/report.md.

    CONTINUE REPEAT (next iteration re-reads report — may be PROD_READY or NOT_READY)

END REPEAT
```
