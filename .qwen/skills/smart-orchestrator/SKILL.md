[SKILL: smart-orchestrator]

You are the master orchestrator. You run a full loop:
understand → audit → plan → build → harden → test → report → fix → repeat.

You stop only after the **decision loop** (PHASE E) reads a report that says PROD_READY. The decision loop **always runs** at least once — never skip PHASE E or short-circuit the smart run when things look fine; always enter the loop, read `.project-brain/report.md`, then branch.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE A — UNDERSTAND (runs once, cached after)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check .project-brain/understand.md:

- EXISTS and contains current git commit hash → READ IT, skip re-scan
- MISSING or outdated → run the **understand** playbook file (resolve path via **RESOLVED SKILL PATHS** at the top of this message; not limited to the project’s `.qwen/skills/`)

After understand.md is ready, read it and determine:

- HAS_FRONTEND: Yes | No
- HAS_BACKEND: Yes | No

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE B — BUILD THE SKILL RUN LIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Always include:
audit-roles, plan, build, harden, prod-gate, report, test-e2e

If HAS_BACKEND is Yes → also include:
audit-backend, audit-database, test-unit, test-integration

If HAS_FRONTEND is Yes → also include:
audit-frontend

Always include after any test skill:
test-fix

**Persona / lens reviews (mandatory — same order as `--prod`; do not drop because there is “no UI” or they seem redundant):**
Run **after** `test-fix`, **before** `prod-gate`, in this order:
review-as-user, review-as-security, review-as-a11y, review-as-mobile, review-as-slow-network, review-as-developer, review-as-performance, review-as-qa, review-as-pm, review-as-data

Each must **RUN** unless `.project-brain/<skill>.md` exists **and** embeds the current git commit **and** you are certain nothing material changed — when unsure, **RUN**.

**review-as-mobile** in particular: cover **all** main screens/routes (see playbook), list them under **Screens reviewed**, then in fix phases work through **every** Critical/High row — not one sample file.

Scan for **extra** skill folders not in the list above in **both** places, when they exist:
(1) project `.qwen/skills/` and (2) the **bundled** root from **RESOLVED SKILL PATHS**.
Exclude folder names: smart-orchestrator, understand.
For each extra skill found: read its `SKILL.md` first line (using the same path resolution as above).
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
review-as-user:     SKIP / RUN
review-as-security: SKIP / RUN
review-as-a11y:     SKIP / RUN
review-as-mobile:   SKIP / RUN
review-as-slow-network: SKIP / RUN
review-as-developer: SKIP / RUN
review-as-performance: SKIP / RUN
review-as-qa:       SKIP / RUN
review-as-pm:       SKIP / RUN
review-as-data:     SKIP / RUN
prod-gate:          RUN (always)
report:             RUN (always)
━━━━━━━━━━━━━━━━━
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE C — RUN ALL SKILLS IN ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each skill marked RUN (in order):
Print: ━━━ [<skill-name>] ━━━
Execute the full content of the **<skill-name>** playbook file (same path rules as **RESOLVED SKILL PATHS** — do not require `.qwen/skills/` under the project)
Immediately continue with the next RUN skill in the same session — **never** wait for the user. Do **not** print `> next`, “type next”, “reply next”, or any prompt that implies the human must send a message before you continue. The CLI runs this playbook in an **automated queue**; pausing for “next” will stall the run.

**Note:** When the CLI runs **discrete** skills (no smart-orchestrator), each skill is queued as **six separate messages** (PHASE 1/6 … 6/6: brain → report → fix → continue fix → verify → complete). Inside this orchestrator playbook you should still **fully** execute each skill’s intent in one continuous run unless a phase is marked SKIP.

For each skill marked SKIP:
Print: ⏭ [<skill-name>] skipped — brain file current
Inject its .project-brain/<skill>.md as context for subsequent skills

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE D — REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After all skills complete, always run the **report** playbook (resolve via **RESOLVED SKILL PATHS**).
This produces the clean summary table.
Save output to .project-brain/report.md.

When generating **report.md**, if `.project-brain/review-as-pm.md` (or `review-as-pm-report.md`) exists with **NEEDS_WORK**, you **must** lift concrete items from the PM **Issues** list into **Critical Blockers** and/or **High Priority** in that report. PHASE E’s **Fix:** prompts only use those sections — PM themes left only in the table row will **never** get fixes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE E — DECISION LOOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After PHASE D, read `.project-brain/report.md`.
Track loop count — starts at 1, max 3.

════════════════════════════════════════════
BRANCH A — IF report contains NOT_READY
════════════════════════════════════════════

Print the report table.

Read the "Critical Blockers" and "High Priority" lists from report.md.
For each item in those lists, queue one simple prompt:

┌─────────────────────────────────────────┐
│ Fix: <exact blocker text from report> │
│ │
│ Make the actual change now. │
│ Print: ✅ done — <one line what changed>│
└─────────────────────────────────────────┘

Between each fix prompt, queue:

┌──────────────────────────────────────────────────────────┐
│ Continue with the next fix if there is one, otherwise │
│ wait for the check step. │
└──────────────────────────────────────────────────────────┘

After all blocker prompts are queued, queue the check prompt:

┌─────────────────────────────────────────────────────────────────┐
│ Check: are there any remaining issues that were not fixed yet? │
│ │
│ Read .project-brain/report.md and compare against all fixes │
│ that ran in this session. │
│ If yes → list them clearly, one per line, file + exact issue. │
│ If no → print: ✅ ALL CLEAR │
└─────────────────────────────────────────────────────────────────┘

Then queue the remaining-fix prompt:

┌───────────────────────────────────────────────────────────────────────┐
│ If the previous check found remaining issues — fix them now. │
│ One fix at a time. Actual code changes only. No plans. │
│ Print after each: ✅ done — <one line what changed> │
│ │
│ If the previous check found nothing — print: ✅ NOTHING REMAINING │
└───────────────────────────────────────────────────────────────────────┘

Then queue the new report prompt:

┌──────────────────────────────────────────────────────────────────┐
│ Run the **report** playbook now (path: RESOLVED SKILL PATHS). │
│ Print the new report table. │
│ Save to .project-brain/report.md. │
│ │
│ Append to .project-brain/work-log.md: │
│ `[<date>] fix loop <N>/3 — <PROD_READY|NOT_READY>` │
│ │
│ If PROD_READY → go to BRANCH B below. │
│ If NOT_READY and loop < 3 → go back to start of BRANCH A │
│ with loop count + 1. │
│ If NOT_READY and loop = 3 → print: │
│ ⚠️ MAX LOOPS REACHED — remaining issues need manual review: │
│ <list all remaining blockers with reason> │
│ STOP. │
└──────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════
BRANCH B — IF report contains PROD_READY
════════════════════════════════════════════

Print the report table.

Do NOT stop yet. Queue a deep verification loop — up to 3 times.

Queue the deep check prompt:

┌──────────────────────────────────────────────────────────────────┐
│ The report says PROD_READY. Run a final deep check now. │
│ │
│ Go through each file in .project-brain/ one more time. │
│ Look for anything marked as: │
│ - DEFERRED │
│ - skipped │
│ - needs manual action │
│ - partial │
│ - TODO │
│ - workaround │
│ │
│ If found → list each item clearly. │
│ If nothing → print: ✅ CONFIRMED CLEAN │
└──────────────────────────────────────────────────────────────────┘

Queue the deep fix prompt:

┌──────────────────────────────────────────────────────────────────┐
│ If the previous check found anything — fix it now. │
│ Actual code changes only. No plans or descriptions. │
│ Print after each: ✅ done — <one line what changed> │
│ │
│ If nothing was found — print: ✅ NOTHING TO FIX │
└──────────────────────────────────────────────────────────────────┘

Queue the verification report prompt:

┌──────────────────────────────────────────────────────────────────┐
│ Run the **prod-gate** playbook now (path: RESOLVED SKILL PATHS). │
│ Then run the **report** playbook the same way. │
│ Print the new report table. │
│ Save to .project-brain/report.md. │
│ │
│ Append to .project-brain/work-log.md: │
│ `[<date>] verification loop <N>/3 — <PROD_READY|issues found>` │
│ │
│ If loop = 3 → print: ✅ 3 LOOPS COMPLETE — PRODUCTION READY │
│ STOP. │
│ If loop < 3 → go back to start of BRANCH B with loop count + 1. │
└──────────────────────────────────────────────────────────────────┘
