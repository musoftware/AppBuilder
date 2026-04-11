/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

export function buildFullChainQueue(): string[] {
  return [
    // ─── PHASE 0 — UNDERSTAND ────────────────────────────────────────────────
    `[FULL CHAIN 0/9 — PROJECT UNDERSTANDER]

You are onboarding onto this project for the first time.
Read the ENTIRE codebase. Do NOT write any code or files yet.

Read in this order:
1. package.json — app type, scripts, dependencies
2. README.md and any docs/ folder
3. Main entry file — how the app starts
4. Full folder structure — how code is organized
5. Config files — how the app is configured
6. Route/command files — what features exist
7. Schema/model files — what data exists
8. Auth middleware — what roles/permissions exist

Answer ALL of the following:

APP IDENTITY:
- What does this app do in one sentence?
- What TYPE of app is this? (ERP, SaaS, CRM, e-commerce, CLI, API, marketplace, etc.)
- Who are the users? List every role found in the code.
- What is the business domain? (inventory, HR, billing, logistics, etc.)

TECH FOUNDATION:
- Language and runtime version
- Main framework(s) and their versions
- Database technology and ORM/query layer
- Authentication method (JWT, session, OAuth, API key, etc.)
- Testing framework present

CODE ORGANIZATION:
- Entry point file
- What lives in each top-level folder
- Where routes or commands are defined
- Where business logic lives
- Where the data layer lives

FEATURE MAP (from code only — not README claims):
List every feature you can CONFIRM exists end-to-end in the code.
Mark each: COMPLETE | PARTIAL | STUB

ROLE MAP (from code only):
List every user role found. For each:
- Where it is defined (enum, DB table, middleware)
- What UI exists for this role
- What routes are protected for this role

Output this block at the end:
---PROJECT CONTEXT START---
APP: <name — one sentence description>
TYPE: <app type>
DOMAIN: <business domain>
ROLES: <comma-separated list>
STACK: <key technologies>
ENTRY: <entry file path>
FEATURES:
- <feature>: COMPLETE | PARTIAL | STUB
ROLE MAP:
- <role>: <what exists for this role>
---PROJECT CONTEXT END---`,

    // ─── PHASE 1 — DOCUMENT ──────────────────────────────────────────────────
    `[FULL CHAIN 1/9 — REVERSE BROWNFIELD]

Using the PROJECT CONTEXT from Phase 0, create a .ai-docs/ folder at the
project root and generate all 10 documentation files below.

Write ONLY what you can confirm from the code. No speculation.

─── .ai-docs/PRD.md ───
# Product Requirements Document

## Overview
<What this app does — 2-3 sentences, plain English>

## Target Users
For each role found in code:
### <Role>
- Who they are and what they need
- What screens/features belong to them

## Core Features
For each feature:
### <Feature Name>
- **Status**: Complete | Partial | Missing
- **Description**: <what it does>
- **Code location**: <key file paths>

## Missing Features
<What a professional app of this TYPE should have that this one doesn't yet>

Print: ✅ .ai-docs/PRD.md

─── .ai-docs/ARCHITECTURE.md ───
# Architecture

## System Type
<Monolith | Monorepo | Microservices | Serverless | CLI | etc.>

## Layers
### <Layer Name>
- **Responsibility**: <one sentence>
- **Key files**: <list>
- **Technology**: <what powers it>

## Request / Action Flow
<Step-by-step: how a user action moves from input → response. Which files handle each step.>

## External Services
| Service | Purpose | Client used | Env var needed |
|---|---|---|---|

## Architectural Risks
<Structural problems: monolithic files, missing separation, tight coupling>

Print: ✅ .ai-docs/ARCHITECTURE.md

─── .ai-docs/DATA_MODEL.md ───
# Data Model

## Entities
For each entity/model found in schema, migrations, or type files:
### <EntityName>
| Field | Type | Required | Description |
|---|---|---|---|
**Relations**: <list>

## Missing Fields / Gaps
<Fields the features need but the schema doesn't have>

Print: ✅ .ai-docs/DATA_MODEL.md

─── .ai-docs/API_SPEC.md ───
# API Specification

## Overview
<REST | GraphQL | RPC | CLI — base URL if applicable>

## Authentication
<How auth works. Where it is enforced.>

## Endpoints
For each route or command:
### <METHOD> <path>
- **Description**: <what it does>
- **Auth required**: Yes | No | <role>
- **Request params**: <table>
- **Success response**: <status + shape>
- **Error cases**: <list>
- **File**: <path>

## Missing Endpoints
<Frontend or features reference endpoints that don't exist>

Print: ✅ .ai-docs/API_SPEC.md

─── .ai-docs/USER_FLOWS.md ───
# User Flows

## Flow: <Name>
- **Actor**: <role>
- **Entry**: <URL or screen>
- **Steps**: 1. User does X → system does Y
- **Success**: <outcome>
- **Failures**: <error cases>
- **Files**: <key paths>

## Dead End Flows
<Flows that exist in UI but lead nowhere — missing backend or broken wiring>

Print: ✅ .ai-docs/USER_FLOWS.md

─── .ai-docs/TECH_STACK.md ───
# Tech Stack

## Runtime & Language
| Technology | Version | Purpose |
|---|---|---|

## Frameworks & Libraries
| Library | Version | Purpose | Critical? |
|---|---|---|---|

## Database & Storage
| Technology | Purpose | ORM/Client |
|---|---|---|

## External Services
| Service | SDK | Purpose | Env var |
|---|---|---|---|

## Outdated / Risky Dependencies
<Deprecated, unmaintained, or vulnerable packages>

Print: ✅ .ai-docs/TECH_STACK.md

─── .ai-docs/ENV_CONFIG.md ───
# Environment Configuration

## All Environment Variables
| Variable | Required | Default | Description | Used in |
|---|---|---|---|---|

## Missing Documentation
<process.env references in code that are NOT in .env.example>

## Secrets (never commit)
<Every credential, API key, or secret variable>

## Local Dev Setup
<Step-by-step to configure environment from scratch>

## Production Checklist
<Every var that must be set before deploying>

Print: ✅ .ai-docs/ENV_CONFIG.md

─── .ai-docs/TEST_STRATEGY.md ───
# Test Strategy

## Framework & Tools
| Tool | Purpose | Config file |
|---|---|---|

## What Is Tested
| Area | Test type | Files | Coverage |
|---|---|---|---|

## What Is NOT Tested
<Every module or feature with zero test coverage>

## How to Run
\`\`\`bash
# All tests: <command>
# Unit only: <command>
# Integration: <command>
\`\`\`

## Recommended Additions
<Highest-priority missing tests>

Print: ✅ .ai-docs/TEST_STRATEGY.md

─── .ai-docs/COMPONENT_MAP.md ───
# Component Map

For every significant source file:
### <ModuleName> — \`path/to/file.ts\`
- **Responsibility**: <one sentence>
- **Exports**: <key exports>
- **Depends on**: <imports>
- **Used by**: <who imports it>
- **Status**: Complete | Partial | Needs work

## God Files
<Files doing too much that should be split>

## Circular Dependencies
<Any circular import chains>

Print: ✅ .ai-docs/COMPONENT_MAP.md

─── .ai-docs/DEPLOYMENT.md ───
# Deployment Guide

## Build
\`\`\`bash
<build command>
\`\`\`

## Run Locally
\`\`\`bash
<start command>
\`\`\`

## Docker (if applicable)
\`\`\`bash
<docker commands>
\`\`\`

## CI/CD
<What the pipeline does, which platform>

## Deployment Checklist
- [ ] All env vars set
- [ ] DB migrated
- [ ] Build passes
- [ ] Tests pass
- [ ] <other steps from codebase>

Print: ✅ .ai-docs/DEPLOYMENT.md`,

    // ─── PHASE 2 — AUDIT ─────────────────────────────────────────────────────
    `[FULL CHAIN 2/9 — FULL-SPECTRUM ANALYST]

Load .ai-docs/ files as your context. Now do a full-spectrum audit.
You have two jobs simultaneously:
- Engineer: what is broken or incomplete in the CODE
- Product expert: what is missing for an app of this TYPE

Do NOT write any code. Audit only.

════════════════════════════════════
PART A — CODE AUDIT
════════════════════════════════════

Scan all source files and report:

COMPLETE: (exists end-to-end: route + handler + service + UI + validation)
- <item>

PARTIAL / STUBBED: (exists in some layers, not all)
- <item>: <what's missing — e.g. "route exists, handler returns 501">

BROKEN: (actively broken right now)
- <item>: <broken imports, type errors, dead code, missing env vars>

CONFIG GAPS:
- <item>: <process.env.X used but missing from .env.example, or hardcoded value>

════════════════════════════════════
PART B — ROLE & PERMISSION AUDIT
════════════════════════════════════

For each user role found in Phase 0:

### Role: <name>
- Role defined in code? Yes | No — <where>
- Route guards enforced in backend? Yes | Partial | No
- Dashboard / home screen exists? Yes | Partial | No
- Missing UI screens for this role: <list>
- Missing backend permissions for this role: <list>
- Missing admin controls to manage this role: <list>

MISSING ROLES: (roles a professional app of this type MUST have but doesn't)
- <role>: <why it's needed>

════════════════════════════════════
PART C — UX COMPLETENESS AUDIT
════════════════════════════════════

For each screen or page:

### Screen: <name>
- CRUD actions present: Create? Edit? Delete? View? (mark each Yes | No)
- Missing buttons or actions: <list>
- Forms without validation: <list>
- Lists without search/filter/pagination: <list>
- Missing empty states: <list>
- Missing loading/error states: <list>
- Missing confirmation dialogs (delete with no "are you sure?"): <list>
- Missing success/error feedback after actions: <list>

════════════════════════════════════
PART D — DOMAIN FEATURE AUDIT
════════════════════════════════════

Based on the app TYPE identified in Phase 0, a PROFESSIONAL production-grade
version of this app must have these features. Check each:

For each expected feature:
- EXISTS AND COMPLETE: <feature>
- EXISTS BUT INCOMPLETE: <feature> — <what's missing>
- COMPLETELY MISSING: <feature> — <why it's needed for this app type>

════════════════════════════════════
PART E — SECURITY AUDIT
════════════════════════════════════

- Endpoints with no auth check: <list>
- Hardcoded credentials or secrets: <list>
- Missing input sanitization on user-facing inputs: <list>
- Role escalation risks (lower role can access higher role routes): <list>

════════════════════════════════════
FINAL OUTPUT
════════════════════════════════════

---GAP REPORT START---
CODE GAPS:
COMPLETE: <list>
PARTIAL: <list>
BROKEN: <list>
CONFIG GAPS: <list>

ROLE GAPS:
MISSING ROLES: <list>
INCOMPLETE ROLE UX: <list>
MISSING PERMISSIONS: <list>

UX GAPS:
<screen>: <list of missing UX elements>

DOMAIN GAPS:
MISSING FEATURES: <list>
INCOMPLETE FEATURES: <list>

SECURITY GAPS: <list>
---GAP REPORT END---`,

    // ─── PHASE 3 — PLAN ──────────────────────────────────────────────────────
    `[FULL CHAIN 3/9 — PLANNER]

Using the GAP REPORT from Phase 2, produce a prioritized implementation plan.
Do NOT write any code yet.

Organize all gaps into implementation tasks. For each task:
- What exactly needs to be built or fixed
- Which files will be created or modified
- What it depends on (must be done before this)
- Effort estimate: Small (< 1 hour) | Medium (few hours) | Large (day+)
- Priority: Critical (app broken without it) | High (major feature missing) | Medium | Low

Output as:

---PLAN START---
CRITICAL TASKS (do first — app is broken without these):
1. <task>
   - Files: <list>
   - Depends on: none | <task N>
   - Effort: Small | Medium | Large

HIGH PRIORITY TASKS (major missing features):
N. <task>
   - Files: <list>
   - Depends on: <task N>
   - Effort: Small | Medium | Large

MEDIUM PRIORITY TASKS:
...

LOW PRIORITY TASKS:
...

IMPLEMENTATION ORDER:
<Ordered list — the exact sequence to implement these, respecting dependencies>
---PLAN END---

Be specific. "Add super admin role" is not a task.
"Create SuperAdmin middleware in src/middleware/superAdmin.ts,
add /admin/users route in src/routes/admin.ts,
add AdminDashboard screen in src/screens/AdminDashboard.tsx" IS a task.`,

    // ─── PHASE 4 — BUILD ─────────────────────────────────────────────────────
    `[FULL CHAIN 4/9 — BUILDER]

Using the PLAN from Phase 3, implement all tasks in the exact IMPLEMENTATION ORDER specified.

Rules:
- Work through tasks one at a time in the specified order.
- Write complete, production-quality code — no placeholders, no TODOs, no "// implement later".
- Follow the existing code style, naming conventions, and folder structure exactly.
- Match the existing patterns: if routes use Express middleware, use the same pattern. If the ORM uses a specific query style, match it.
- Implement dependencies before the tasks that need them.
- Do NOT touch working code unless the task explicitly requires it.
- After completing each task print: ✅ BUILT: <task name>

For ROLE GAPS specifically:
- Create the role definition where roles are currently defined in this codebase
- Add route guards using the existing auth middleware pattern
- Create the UI dashboard/screens for the role following existing screen patterns
- Add admin controls to manage users of this role
- Wire the frontend to the backend correctly

For UX GAPS specifically:
- Add the missing CRUD actions with proper API calls
- Add missing buttons with correct onClick handlers
- Add form validation using the existing validation pattern in this codebase
- Add search/filter/pagination following existing list patterns
- Add empty states, loading states, and error states following existing patterns
- Add confirmation dialogs before destructive actions
- Add success/error toast notifications after actions

End with:
---BUILD SUMMARY START---
BUILT:
- <task>: <files created or modified>
SKIPPED (reason):
- <task>: <reason>
---BUILD SUMMARY END---`,

    // ─── PHASE 5 — COMPLETE ──────────────────────────────────────────────────
    `[FULL CHAIN 5/9 — COMPLETER]

Review ALL code — existing and newly built in Phase 4. Harden everything.

Work through this checklist for every module:

ERROR HANDLING:
- Every async function has try/catch
- Errors have meaningful messages (not "Something went wrong")
- HTTP errors return correct status codes (400 for bad input, 401 for unauth, 403 for forbidden, 404 for not found, 500 for server errors)
- Errors are logged with enough context to debug

EDGE CASES:
- Null/undefined inputs handled everywhere
- Empty arrays/strings handled (don't assume data exists)
- Type coercion handled (string "123" vs number 123)
- Boundary values handled (page 0, negative IDs, etc.)

INPUT VALIDATION:
- Every API endpoint validates its inputs before processing
- Every form validates before submitting
- File uploads validate type and size
- IDs are validated to be the right type and exist

ENVIRONMENT CONFIG:
- No hardcoded URLs, ports, credentials, or magic numbers
- All config reads from process.env with sensible defaults
- All required env vars are in .env.example with descriptions
- App fails fast with a clear error if required env vars are missing

LOGGING:
- Key operations log at start: "Starting X with params Y"
- Successful operations log: "X completed successfully"
- Failures log with full context: "X failed: <error> for user <id>"

SECURITY:
- All user inputs are sanitized before DB queries
- All API routes that need auth have auth middleware
- Role checks happen in middleware, not just in the UI

For each fix print: ✅ COMPLETED: <what you fixed and where>

End with:
---COMPLETION SUMMARY START---
FIXED:
- <item>
STILL NEEDS ATTENTION (too complex for this pass):
- <item>
---COMPLETION SUMMARY END---`,

    // ─── PHASE 6 — TEST WRITER ───────────────────────────────────────────────
    `[FULL CHAIN 6/9 — TEST WRITER]

Write a comprehensive test suite for the entire codebase.

First, identify the testing framework in package.json and follow its conventions exactly.
Name test files following the existing test file naming convention in this project.

UNIT TESTS — for every exported function and class method:
- Happy path: correct inputs → correct output
- Edge cases: null, undefined, empty, boundary values
- Error cases: invalid inputs → correct error thrown
- Mock all external dependencies (database, HTTP calls, file system)

INTEGRATION TESTS — for every major feature flow:
- Full flow from API call to database and back
- Auth flows: login, logout, token refresh, protected route access
- CRUD flows for every entity: create → read → update → delete
- Role-based access: each role can only access what it should
- Error flows: what happens when DB is down, external service fails, etc.

E2E TESTS (if this app has a frontend):
- Critical user journeys from login to completing the main action
- Each user role's primary workflow

ROLE & PERMISSION TESTS (critical — this is where bugs hide):
For each role:
- Test that role CAN access its own routes (should return 200)
- Test that role CANNOT access other roles' routes (should return 403)
- Test that unauthenticated requests are rejected (should return 401)

After writing each test file print: ✅ TESTS WRITTEN: <filename> (<N> tests)

End with:
---TEST SUMMARY START---
FILES CREATED:
- <filename>: <N> tests — covers <what>
COVERAGE ESTIMATE:
- Units: <N>% of functions covered
- Integration: <N> flows covered
- Roles tested: <list>
---TEST SUMMARY END---`,

    // ─── PHASE 7 — TEST ANALYZER ─────────────────────────────────────────────
    `[FULL CHAIN 7/9 — TEST ANALYZER]

Run the full test suite. Print the raw output first.
Then analyze every result.

Categorize each failure:
- LOGIC BUG: the implementation is wrong (test is correct, code is not)
- MISSING IMPL: the code being tested does not exist yet
- TEST BUG: the test is wrong (code is correct, test assertion is wrong)
- ENV ISSUE: missing env var, wrong DB state, missing mock, port conflict
- TYPE ERROR: TypeScript compilation failure

For each failure write:
- Test name
- Category (from above)
- Root cause in one sentence
- The specific line in the implementation or test that needs to change

Also identify:
UNTESTED AREAS: functions or code paths with no test at all
FLAKY TESTS: tests that passed in some runs but failed in others

End with:
---TEST ANALYSIS START---
PASSED: <N>
FAILED: <N>

FAILURES:
- <test name>: <CATEGORY> — <root cause>

UNTESTED AREAS:
- <function or code path>

FLAKY TESTS:
- <test name>: <why it's flaky>
---TEST ANALYSIS END---

If ALL tests pass and there are no critical untested areas: append READY_FOR_PROD_CHECK`,

    // ─── PHASE 8 — FIXER ─────────────────────────────────────────────────────
    `[FULL CHAIN 8/9 — FIXER]

You are a senior engineer. Your job is to finish everything that is unfinished.
You have TWO sources of work — process BOTH before moving on:

SOURCE 1: The COMPLETION SUMMARY from the previous phase.
SOURCE 2: The TEST ANALYSIS from the test analyzer phase.

Do NOT re-analyze the codebase from scratch.
Do NOT rerun the audit.
Read the output of the previous phases and act on it directly.

════════════════════════════════════════════════
PART 1 — FINISH "STILL NEEDS ATTENTION" ITEMS
════════════════════════════════════════════════

Find the ---COMPLETION SUMMARY END--- block from the Completer phase.
Locate the "STILL NEEDS ATTENTION" list inside it.

For each item in that list:

Step 1 — Classify it:
  - IMPLEMENTABLE NOW: all dependencies exist, can be built immediately
  - BLOCKED: requires a library, external service, or another feature first
  - ARCHITECTURAL: requires a design decision before implementation

Step 2 — Act on it:

  If IMPLEMENTABLE NOW:
    Build it completely. Follow the existing code patterns in this project.
    Do not leave stubs. Do not defer.
    After finishing: print ✅ FINISHED: <item name> — <files created or changed>

  If BLOCKED by a missing library:
    Install the library using the package manager this project uses.
    Then implement the feature completely.
    After finishing: print ✅ FINISHED: <item name> — installed <package>, created <files>

  If BLOCKED by something that genuinely cannot be resolved now
  (external API key not available, requires product decision, etc.):
    Create a placeholder implementation that:
      - Does not crash the app
      - Returns a clear "not yet implemented" response
      - Has a TODO comment with exactly what is needed to complete it
    Print ⚠️ DEFERRED: <item name> — <exact reason> — placeholder added at <file>

  If ARCHITECTURAL:
    Make a decision. Pick the simpler option. Implement it.
    Document the decision in a comment at the top of the relevant file.
    Print ✅ DECIDED AND BUILT: <item name> — <decision made>

For the specific example of "STILL NEEDS ATTENTION" items like these,
here is how to handle each category:

  "X library not installed" → run npm/composer/pip install X, then implement
  "Y method exists but no UI" → create the UI component/blade/form that calls Y
  "Z only partially implemented" → find Z in the code, complete the missing parts
  "A and B are near-duplicates" → consolidate them into one, update all callers
  "No CRUD interface for X" → create the full CRUD: list, create, edit, delete, confirm

════════════════════════════════════════════════
PART 2 — FIX TEST FAILURES
════════════════════════════════════════════════

Find the ---TEST ANALYSIS START--- block from the Test Analyzer phase.
Work through failures in this exact order:

1. ENV ISSUES first (unblock other tests)
   - Add missing env vars to .env.example
   - Fix missing mocks or test setup files

2. TYPE ERRORS second (unblock compilation)
   - Fix TypeScript or type errors in source or test files

3. LOGIC BUGS third (fix the implementation, not the test)
   - Read what the feature is supposed to do before changing code
   - The test is the spec — make the code match it

4. MISSING IMPLEMENTATION (add the missing code)
   - Implement what the test expects, following existing patterns

5. TEST BUGS last (fix the test, not the code)
   - Only change a test if you are certain the implementation is correct
   - Add a comment explaining what was wrong with the test

6. UNTESTED AREAS
   - Write new tests for every function or path flagged as untested
   - Follow the existing test file naming convention

7. FLAKY TESTS
   - Fix the root cause if possible
   - If not: add // FLAKY: <reason>, mark as skipped with explanation

For each fix: print ✅ FIXED: <test name> — <what changed and why>

After all fixes, run the test suite again and print the new results.

════════════════════════════════════════════════
FINAL OUTPUT
════════════════════════════════════════════════

---FIX SUMMARY START---
FINISHED FROM PREVIOUS PHASE:
- <item>: <what was built> — <files>

DEFERRED (with placeholder):
- <item>: <exact reason> — <placeholder location>

TEST FIXES:
- <test name>: <what changed>

NEW TESTS WRITTEN:
- <filename>: <what it covers>

STILL FAILING (genuine blockers — needs human decision):
- <item>: <why it cannot be fixed automatically>

FINAL TEST RESULT: <N> passed / <N> failed
---FIX SUMMARY END---`,

    // ─── PHASE 9 — PRODUCTION GATE ───────────────────────────────────────────
    `[FULL CHAIN 9/9 — PRODUCTION CHECK]

You are a principal engineer doing the final production readiness review.
Check every item. Mark each: PASS, FAIL, or N/A.

CODE QUALITY:
[ ] No TODOs, FIXMEs, or placeholder code in any file
[ ] No hardcoded secrets, credentials, or magic numbers
[ ] No dead code or unused imports
[ ] All functions have consistent error handling
[ ] No console.log left in production code (use proper logger)

FEATURES:
[ ] All features from PRD.md marked Complete are actually working end-to-end
[ ] All user roles have complete UI and enforced backend permissions
[ ] All CRUD operations have create, read, update, delete working
[ ] All forms have validation
[ ] All lists have empty states
[ ] All destructive actions have confirmation dialogs

TESTING:
[ ] All tests pass (zero failures)
[ ] Unit coverage ≥ 80% of exported functions
[ ] Every user role has been tested for correct access and correct denial
[ ] Integration tests cover all main user flows
[ ] No flaky tests in the suite

CONFIGURATION:
[ ] All environment variables documented in .env.example with descriptions
[ ] App fails fast with clear error message if required env vars are missing
[ ] No hardcoded URLs, ports, or config values
[ ] Graceful shutdown on SIGTERM/SIGINT (if server/long-running process)

SECURITY:
[ ] All API routes that require auth have auth middleware applied
[ ] Role-based access enforced in backend (not just frontend)
[ ] All user inputs validated and sanitized before DB queries
[ ] No sensitive data returned in API responses (passwords, tokens, etc.)

RELIABILITY:
[ ] Meaningful error messages for all error cases (no raw stack traces to users)
[ ] Logging in place for key operations (start, success, failure)
[ ] External service failures handled gracefully

DEPENDENCIES:
[ ] npm audit shows no critical or high vulnerabilities
[ ] No unused dependencies in package.json

─── DECISION ───

If ALL items are PASS or N/A:
  Print: PROD_READY
  Print a 5-sentence summary: what the app does, what was built, what roles exist, what's tested, and current status.

If ANY item is FAIL:
  Print: NOT_READY
  List every failing item with one sentence on what needs to happen to fix it.
  Print: LOOP_REQUIRED — restarting from Phase 2 with all context preserved.`,
  ];
}
