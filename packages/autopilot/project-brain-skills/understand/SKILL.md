[SKILL: understand]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

This is a LISTING PASS ONLY.

Do not analyze, judge, recommend, or say anything is missing. Your only job is to enumerate what is present in the codebase.

WHAT TO LIST:

1. All source files grouped by layer (routes, controllers, models, migrations, views, components, config, tests, scripts)
2. All HTTP endpoints: METHOD /path — controller file:line
3. All frontend pages/screens: route path — component file
4. All database entities: entity name — model/migration file
5. All environment variables found in .env.example or config files
6. All authentication roles found in code: role name — file:line where defined
7. Top-level folder map: folder — what lives there

No analysis. No "this is missing." No "this should be." No judgments of any kind. Just list what is there.

---

Write output to: .project-brain/understand.md

Use EXACTLY this format:

# Project Understanding

Last scan: <today's date>
Last git commit: <git rev-parse HEAD output>

APP: <name — one sentence>
TYPE: <ERP|CRM|SaaS|API|CLI|Web app|Mobile backend|other>
HAS_FRONTEND: Yes | No — <framework>
HAS_BACKEND: Yes | No — <framework>
DATABASE: <name>
ORM: <name>
AUTH: <method>
TEST_FRAMEWORK: <name>
TEST_COMMAND: <command>
TEST_FOLDER: <folder>
MIGRATION_COMMAND: <command>
MIGRATION_FOLDER: <folder>
PACKAGE_MANAGER: <name>

ROLES: <list each with file:line where defined>
KEY FEATURES: <list each as COMPLETE|PARTIAL|STUB — file:line>

FOLDER MAP:
<folder>: <what lives there>

SUMMARY:
<app name> — <one-sentence description>
Stack: <frontend framework> + <backend framework> + <database>
Layers found: <comma-separated: routes, frontend, backend, db, auth, tests, ...>

FINDINGS:

- <file:line> — <layer> — <what it is>
  (one entry per significant file; references only, no code)

STATE:
HAS_FRONTEND: Yes|No | HAS_BACKEND: Yes|No | DATABASE: <name> | AUTH: <method> | ROLES: <comma-separated list>

NEXT_SKILLS: <comma-separated skills — one per layer found>

NEXT_SKILLS rules:

- HAS_FRONTEND: Yes → include audit-frontend, audit-roles
- HAS_BACKEND: Yes → include audit-backend, audit-database
- Always append: plan, prod-gate
- Never include: understand, smart-orchestrator, report
- Add specialized audits only for layers that actually exist (e.g. audit-queue if jobs found)

---

Then append to: .project-brain/work-log.md
Add one line: `[<date>] skill:understand — listing pass — <N> files enumerated`
