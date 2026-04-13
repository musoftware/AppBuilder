[SKILL: build]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

Read first (MANDATORY — in this order):

1. `docs/plan.md` or `PLAN.md` — Implementation plan with task order and dependencies
2. `docs/backend-tasks.md` — Detailed backend task definitions with acceptance criteria
3. `docs/frontend-tasks.md` — Detailed frontend task definitions with acceptance criteria
4. `PRD.md` or `docs/PRD.md` — Validate implementation meets requirements
5. `.project-brain/understand.md` — Stack and patterns
6. `.project-brain/build.md` — If exists, skip tasks already marked DONE

**Your job:** Execute the implementation plan. Build what the tasks specify — NO more, NO less.

---

## PHASE 1: EXECUTE PLAN IN ORDER

Follow the IMPLEMENTATION ORDER from `docs/plan.md` exactly.

For each task:

### Step 1: Read the Task Definition

- Open the task in `docs/plan.md`
- Read the acceptance criteria from the original task file (backend-tasks.md or frontend-tasks.md)
- Understand what files to create/modify
- Check dependencies — ensure prerequisite tasks are complete

### Step 2: Read Existing Code (if applicable)

- Read the relevant existing code files to understand patterns
- Note the conventions: naming, structure, imports, error handling
- DO NOT refactor or change unrelated code

### Step 3: Implement Completely

- **NO placeholders** — write full implementations
- **NO TODOs** — complete the feature end-to-end
- Follow existing naming conventions, file structure, and code style exactly
- Meet EVERY acceptance criteria in the task definition

### Step 4: Verify

- Check off each acceptance criteria: [ ] → [x]
- Test the implementation manually if possible (run the server, hit the endpoint, check the UI)
- Ensure no regressions in existing functionality

### Step 5: Mark Complete

After completing: print ✅ BUILT: <task name> — <files touched>

---

## PHASE 2: UPDATE TASK FILES

After completing each task, update the source task files:

### In `docs/plan.md`:

- Mark the task with ✅ and completion date
- Update status: `PENDING` → `COMPLETE`

### In `docs/backend-tasks.md` or `docs/frontend-tasks.md`:

- Check off all acceptance criteria: [ ] → [x]
- Add "Built: <date>" note to the task

### In `.project-brain/build.md`:

- Add completion entry for the task

---

## PHASE 3: AUDIT REPORT

Write output to: `.project-brain/build.md` using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — N tasks completed from plan>
<one line — N tasks deferred or blocked>
<one line — PROD_READY | NOT_READY | NEEDS_WORK> (3 lines max)

FINDINGS:

- Task <N>: <name> — COMPLETE — <files created/modified: list>
- Task <N>: <name> — DEFERRED — <reason: blocked by Task M / complexity / etc>
  (references only — never embed raw code blocks)

STATE:
<1–3 sentences: what was built, what is still stub/deferred, what harden/test should focus on>

NEXT_SKILLS: review-implementation

Rules:

- NEVER embed raw code. Use file:line references only.
- ALWAYS update the task files (plan.md, backend-tasks.md, frontend-tasks.md) with completion status
- NEVER implement beyond what the task acceptance criteria specify
- VERDICT: FAIL only for unrecoverable errors.

---

Append to: `.project-brain/work-log.md`
Add: `[<date>] skill:build — <N> tasks completed, <N> deferred`
