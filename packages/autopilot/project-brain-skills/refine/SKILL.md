[SKILL: refine]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

Read first (MANDATORY — in this order):

1. `docs/refine-tasks.md` — Gaps and refinements identified by review-implementation
2. `.project-brain/review-implementation.md` — Review findings and context
3. `docs/plan.md` or `PLAN.md` — Original implementation plan
4. `docs/backend-tasks.md` / `docs/frontend-tasks.md` — Original task definitions
5. `.project-brain/understand.md` — Stack and patterns

**Your job:** Fix every gap identified in the review. Close the loop between what was built and what should exist.

---

## PHASE 1: EXECUTE REFINE TASKS

Process every item in `docs/refine-tasks.md` in priority order (Blockers → Important → Polish).

For each refinement task:

### Step 1: Understand the Gap

- Read the refine task definition
- Read the referenced file:line to see what's wrong
- Read the original task's acceptance criteria to see what should have been built

### Step 2: Fix Completely

- **NO partial fixes** — resolve the entire issue
- **NO new TODOs** — complete the refinement end-to-end
- Follow existing naming conventions, file structure, and code style exactly
- Meet EVERY acceptance criteria in the refine task

### Step 3: Verify the Fix

- Re-read the file:line — does it now meet the criteria?
- Test manually if possible (run server, hit endpoint, check UI)
- Ensure no regressions introduced by the fix

### Step 4: Mark Complete

After completing: print ✅ REFINED: <task name> — <files modified>

---

## PHASE 2: UPDATE TASK FILES

After completing each refinement:

### In `docs/refine-tasks.md`:

- Check off all acceptance criteria: [ ] → [x]
- Add "Fixed: <date>" note to the task

### In original task files (`docs/backend-tasks.md` / `docs/frontend-tasks.md`):

- Update the original task's acceptance criteria to reflect the fix
- Add "Refined: <date> — <what was fixed>" note

### In `.project-brain/refine.md`:

- Add completion entry for the refinement

---

## PHASE 3: FINAL STATUS

After all refinements:

### Update `docs/CHANGELOG.md` or `CHANGELOG.md`:

```markdown
## [<date>] — Refinement Sprint

### Fixed

- <specific fix 1> (was: <what was wrong>, now: <what it does>)
- <specific fix 2>
- ...

### Verified

- ✅ All original tasks now meet acceptance criteria
- ✅ All review gaps closed
- ✅ No remaining blockers
```

### Update `docs/CONTEXT.md` or `CONTEXT.md`:

- Document any architectural decisions made during refinement
- Update stack notes if new patterns were established

---

## PHASE 4: REFINE REPORT

Write output to: `.project-brain/refine.md` using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — N refinement tasks completed from refine-tasks.md>
<one line — N blockers closed, N important fixes, N polish items>
<one line — PROD_READY | NEEDS_MORE_WORK — all gaps closed: Yes/No> (3 lines max)

FINDINGS:

- Refine <N>: <name> — FIXED — <files modified: list>
- Refine <N>: <name> — DEFERRED — <reason: complexity / needs more info / etc>
  (references only — never embed raw code blocks)

STATE:
<1–3 sentences: all review gaps closed, app now meets all original requirements, ready for test-unit/test-integration or prod-gate>

NEXT_SKILLS: harden, test-unit, test-integration, test-e2e

Rules:

- NEVER embed raw code. Use file:line references only.
- ALWAYS update refine-tasks.md and original task files with completion status
- If a refinement is too complex, defer it with clear explanation — do NOT half-implement
- VERDICT: FAIL only for unrecoverable errors.

---

Append to: `.project-brain/work-log.md`
Add: `[<date>] skill:refine — <N> gaps closed, <M> deferred`
