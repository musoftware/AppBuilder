[SKILL: review-implementation]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

Read first (MANDATORY — in this order):

1. `docs/plan.md` or `PLAN.md` — What was planned
2. `docs/backend-tasks.md` — What backend tasks were defined
3. `docs/frontend-tasks.md` — What frontend tasks were defined
4. `.project-brain/build.md` — What was actually built
5. `.project-brain/understand.md` — Original stack and architecture
6. PRD.md or `docs/PRD.md` — Source requirements

**Your job:** Review what was built against what was planned and required. Identify gaps, regressions, and refinements needed.

---

## PHASE 1: COMPLETENESS REVIEW

### 1.1 Task Completion Audit

For every task in `docs/plan.md`:

- Check if marked ✅ COMPLETE in build.md
- Verify ALL acceptance criteria are checked off in the original task file
- Spot-check 2-3 completed tasks by reading the actual code

### 1.2 Requirements Coverage

Cross-reference what was built against PRD.md:

- Every feature mentioned in PRD — implemented? ✅ | Partial ⚠️ | Missing ❌
- Every user role's requirements — satisfied? ✅ | Partial ⚠️ | Missing ❌
- Every endpoint/screen specified — exists and functional? ✅ | Partial ⚠️ | Missing ❌

### 1.3 Quality Check

For completed implementations:

- **Code quality:** Follows project conventions? No linting errors? Type-safe?
- **Error handling:** Every endpoint/component handles errors gracefully?
- **Security:** Auth guards, validation, input sanitization in place?
- **Edge cases:** Empty states, error states, loading states handled?
- **Documentation:** CONTEXT.md, CHANGELOG.md updated with what changed?

---

## PHASE 2: GENERATE REFINE TASKS

**Create or update: `docs/refine-tasks.md`**

This file contains tasks needed to close gaps between what was built and what should exist. NOT suggestions — specific, actionable items with acceptance criteria.

### Format for `docs/refine-tasks.md`:

```markdown
# Refinement Tasks

**Generated from:** review-implementation audit
**Review date:** <date>
**Total gaps found:** <N>
**Severity breakdown:** Blockers: <N> | Important: <N> | Polish: <N>

---

## Blockers (Must fix before production)

### Refine 1: Fix <specific issue>

- **Found:** Task <N> in plan.md marked complete but <what's wrong>
- **Source:** <file:line> — <what doesn't meet acceptance criteria>
- **What to fix:** <exact description>
- **Acceptance criteria:**
  - [ ] <specific verifiable check>
  - [ ] <specific verifiable check>
- **Impact:** <what breaks or is at risk without this fix>

---

## Important (Should fix for quality)

### Refine N: ...

---

## Polish (Nice to have)

### Refine N: ...

---

## Verified Complete (No changes needed)

- ✅ Task <N>: <name> — all acceptance criteria verified, code quality good
- ✅ ...
```

**Rules:**

- Every refine task MUST reference specific file:line and what's wrong
- Every refine task MUST have verifiable acceptance criteria
- NO vague items like "improve code quality" — must be "Add error boundary to Dashboard.tsx line 45 to catch API failures"
- If everything is correct → create refine-tasks.md with "No gaps found — all tasks verified complete"

---

## PHASE 3: REVIEW REPORT

Write output to: `.project-brain/review-implementation.md` using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — reviewed N tasks, M acceptance criteria spot-checked>
<one line — X blockers, Y important, Z polish gaps found>
<one line — PROD_READY | NEEDS_REFINEMENT — N items must be fixed> (3 lines max)

FINDINGS:

- Task <N>: <name> — COMPLETE — all criteria verified, code quality good
- Task <N>: <name> — PARTIAL — <specific gap> — see Refine <M> in refine-tasks.md
- <file:line> — <specific issue> — quality/security gap, see Refine <M>
  (references only — never embed raw code blocks)

STATE:
<1–3 sentences: overall quality assessment, what the refine skill should prioritize, whether the app is production-ready or needs fixes>

NEXT_SKILLS: refine

Rules:

- NEVER embed raw code. Use file:line references only.
- ALWAYS generate the refine-tasks.md file — it is the primary output of this skill
- VERDICT: FAIL only for unrecoverable errors.

---

Append to: `.project-brain/work-log.md`
Add: `[<date>] skill:review-implementation — <N> tasks reviewed, <M> gaps found`
