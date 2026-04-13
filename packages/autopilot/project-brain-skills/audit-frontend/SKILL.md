[SKILL: audit-frontend]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

Read first (MANDATORY — in this order):

1. `PRD.md` or `docs/PRD.md` — Product Requirements Document (what screens/features MUST exist)
2. `ARCHITECTURE.md` or `docs/ARCHITECTURE.md` — Frontend architecture and component structure
3. `CONTEXT.md` or `docs/CONTEXT.md` — Project context and decisions
4. `TASKS.md` or `docs/TASKS.md` — Existing task list (if any)
5. `.project-brain/understand.md` — Stack and file inventory (check has_frontend: yes/no)
6. `.project-brain/audit-frontend.md` — If exists, only check what changed since last run

**CRITICAL: You are NOT suggesting or recommending. You are ANALYZING what exists vs what the project MD files REQUIRE.**

---

## PHASE 1: ANALYSIS (Read and Compare)

### 1.1 Extract Required Frontend Features from PRD/Architecture

Read the project MD files and extract EVERY frontend requirement:

- Every screen/page that users must access
- Every UI component explicitly mentioned (forms, tables, modals, navigation)
- Every user role's view requirements (what each role sees)
- Every interactive feature (search, filters, real-time updates, notifications)
- Every responsive/mobile requirement if specified

### 1.2 Map Existing Code

Scan the frontend source files and catalog:

- Every route/page defined (with file:line)
- Every component created
- Every API integration call (fetch/axios to backend)
- Every state management setup (Redux, Context, etc.)
- Every UI library/theme configuration

### 1.3 Gap Analysis (Existing vs Required)

Create a matrix:

| Requirement (from MD files) | Exists? | File:Line | Status                   |
| --------------------------- | ------- | --------- | ------------------------ |
| <screen/feature from PRD>   | YES/NO  | <path>    | Complete/Partial/Missing |

---

## PHASE 2: GENERATE ACTIONABLE TASKS

**Create a file: `docs/frontend-tasks.md`** (or add to `TASKS.md` in project root if docs/ doesn't exist)

This file MUST contain a concrete, numbered task list — NOT suggestions. Each task is a specific implementation item derived from the project requirements.

### Format for `docs/frontend-tasks.md`:

```markdown
# Frontend Implementation Tasks

**Generated from:** PRD.md, ARCHITECTURE.md, CONTEXT.md
**Audit date:** <date>
**Total tasks:** <N>
**Priority breakdown:** Critical: <N> | High: <N> | Medium: <N>

---

## Critical (Blocks core user flows)

### Task 1: Implement <specific screen or component>

- **Source:** PRD.md section X / ARCHITECTURE.md diagram Y
- **What to build:** <exact description of the screen/component>
- **User role:** <which role sees this>
- **Acceptance criteria:**
  - [ ] Route: `/path` defined in `<router file>`
  - [ ] Component: `<ComponentName>` in `<file:line>`
  - [ ] API integration: Calls `GET /api/<resource>` with error handling
  - [ ] State management: Uses <Redux/Context/etc> for <data>
  - [ ] UI elements: <list specific buttons, forms, tables>
  - [ ] Responsive: Works on mobile/tablet/desktop
  - [ ] Loading states: Shows spinner/skeleton while fetching
  - [ ] Error states: Shows user-friendly error message
- **Dependencies:** <none / Task N / backend endpoint X must exist>
- **Estimated complexity:** Low | Medium | High

### Task 2: ...

---

## High (Required user flows but not blocking)

### Task N: ...

---

## Medium (UX improvements and edge cases)

### Task N: ...

---

## Completed (Already implemented correctly)

- ✅ <screen/component>: <file:line> — fully implements PRD requirement, API integration, error handling, responsive
- ✅ ...
```

**Rules for task generation:**

- Every task MUST trace back to a specific requirement in the MD files
- Every task MUST be actionable (specific component, specific file, specific behavior)
- Every task MUST have acceptance criteria that can be verified
- NO tasks like "improve UX" or "make responsive" — must be specific: "Add mobile breakpoint at 768px in src/components/Dashboard.tsx line 120 with grid-template-columns: 1fr"
- If a requirement exists in MD files but no code implements it → that's a task
- If code exists but doesn't meet the requirement → that's a fix task
- If code exists and meets requirements → mark as ✅ Completed

---

## PHASE 3: AUDIT REPORT

Write output to: `.project-brain/audit-frontend.md` using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — what was audited and what MD files were the source of truth>
<one line — X tasks generated, Y already complete, Z critical gaps>
<one line — PROD_READY | NOT_READY — N critical tasks remaining> (3 lines max)

FINDINGS:

- PRD.md requires <screen/feature> for <role> — NOT IMPLEMENTED — see Task <N> in frontend-tasks.md
- <file:line> — missing error handling on <component> — UX gap, see Task <N>
- <file:line> — no API integration on <component> — disconnected from backend, see Task <N>
- <component> — fully implements PRD requirement — ✅ complete
  (references only — never embed raw code blocks; next skill reads files fresh from disk)

STATE:
<1–3 sentences: which user flows are fully covered vs have outstanding tasks, what the build skill should execute first based on task priority>

NEXT_SKILLS: plan, build

Rules:

- NEVER embed raw code. Use file:line references only.
- ALWAYS generate the frontend-tasks.md file — it is the primary output of this skill
- VERDICT: FAIL (not NOT_READY) only for unrecoverable errors (e.g. cannot read source files).
- If PRD.md or ARCHITECTURE.md does not exist, extract requirements from the available MD files and note what's missing.

---

Append to: `.project-brain/work-log.md`
Add: `[<date>] skill:audit-frontend — generated <N> tasks, <M> already complete`
