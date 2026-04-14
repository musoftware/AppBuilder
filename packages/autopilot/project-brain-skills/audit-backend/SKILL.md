[SKILL: audit-backend]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

Read first (MANDATORY — in this order):

1. `PRD.md` or `docs/PRD.md` — Product Requirements Document (the source of truth for what MUST exist)
2. `ARCHITECTURE.md` or `docs/ARCHITECTURE.md` — System architecture and data flow
3. `CONTEXT.md` or `docs/CONTEXT.md` — Project context and decisions
4. `TASKS.md` or `docs/TASKS.md` — Existing task list (if any)
5. `.project-brain/understand.md` — Stack and file inventory
6. `.project-brain/audit-backend.md` — If exists, only check what changed since last run

**CRITICAL: You are NOT suggesting or recommending. You are ANALYZING what exists vs what the project MD files REQUIRE.**

---

## PHASE 1: ANALYSIS (Read and Compare)

### 1.1 Extract Required Endpoints from PRD/Architecture

Read the project MD files and extract EVERY backend requirement:

- Every entity mentioned that needs CRUD operations
- Every API endpoint explicitly listed as required
- Every business operation that must be implemented
- Every integration point (external APIs, webhooks, etc.)

### 1.2 Map Existing Code

Scan the backend source files and catalog:

- Every route/endpoint defined (with file:line)
- Every controller method
- Every service function exposed
- Every database model/entity

### 1.3 Gap Analysis (Existing vs Required)

Create a matrix:

| Requirement (from MD files) | Exists? | File:Line | Status                   |
| --------------------------- | ------- | --------- | ------------------------ |
| <endpoint from PRD>         | YES/NO  | <path>    | Complete/Partial/Missing |

---

## PHASE 2: GENERATE ACTIONABLE TASKS

**Create a file: `docs/backend-tasks.md`** (or `TASKS.md` in project root if docs/ doesn't exist)

This file MUST contain a concrete, numbered task list — NOT suggestions. Each task is a specific implementation item derived from the project requirements.

### Format for `docs/backend-tasks.md`:

```markdown
# Backend Implementation Tasks

**Generated from:** PRD.md, ARCHITECTURE.md, CONTEXT.md
**Audit date:** <date>
**Total tasks:** <N>
**Priority breakdown:** Critical: <N> | High: <N> | Medium: <N>

---

## Critical (Blocks core functionality)

### Task 1: Implement <specific endpoint or feature>

- **Source:** PRD.md section X / ARCHITECTURE.md diagram Y
- **What to build:** <exact description of the endpoint/functionality>
- **Acceptance criteria:**
  - [ ] Route: `GET /api/<resource>` defined in `<file>`
  - [ ] Auth guard: <specific auth method> applied
  - [ ] Validation: <specific fields> validated with <library>
  - [ ] Response: Returns <specific data shape> with status 200
  - [ ] Error handling: Returns 4xx/5xx with error body
- **Dependencies:** <none / Task N / database model X>
- **Estimated complexity:** Low | Medium | High

### Task 2: ...

---

## High (Required but not blocking)

### Task N: ...

---

## Medium (Should exist for production readiness)

### Task N: ...

---

## Completed (Already implemented correctly)

- ✅ <endpoint>: <file:line> — fully implements PRD requirement, auth, validation, error handling
- ✅ ...
```

**Rules for task generation:**

- Every task MUST trace back to a specific requirement in the MD files
- Every task MUST be actionable (specific endpoint, specific file, specific behavior)
- Every task MUST have acceptance criteria that can be verified
- NO tasks like "improve security" or "add validation" — must be specific: "Add bcrypt validation to POST /api/users in src/controllers/userController.ts line 45"
- If a requirement exists in MD files but no code implements it → that's a task
- If code exists but doesn't meet the requirement → that's a fix task
- If code exists and meets requirements → mark as ✅ Completed

---

## PHASE 3: AUDIT REPORT

Write output to: `.project-brain/audit-backend.md` using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — what was audited and what MD files were the source of truth>
<one line — X tasks generated, Y already complete, Z critical gaps>
<one line — PROD_READY | NOT_READY — N critical tasks remaining> (3 lines max)

FINDINGS:

- PRD.md requires <endpoint> — NOT IMPLEMENTED — see Task <N> in backend-tasks.md
- <file:line> — missing auth guard on <endpoint> — security gap, see Task <N>
- <file:line> — no input validation on <endpoint> — validation gap, see Task <N>
- <endpoint> — fully implements PRD requirement — ✅ complete
  (references only — never embed raw code blocks; next skill reads files fresh from disk)

STATE:
<1–3 sentences: which requirement areas are fully covered vs have outstanding tasks, what the build skill should execute first based on task priority>

NEXT_SKILLS: plan, build

Rules:

- NEVER embed raw code. Use file:line references only.
- ALWAYS generate the backend-tasks.md file — it is the primary output of this skill
- VERDICT: FAIL (not NOT_READY) only for unrecoverable errors (e.g. cannot read source files).
- If PRD.md or ARCHITECTURE.md does not exist, extract requirements from the available MD files and note what's missing.

---

Append to: `.project-brain/work-log.md`
Add: `[<date>] skill:audit-backend — generated <N> tasks, <M> already complete`
