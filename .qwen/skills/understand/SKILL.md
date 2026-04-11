[SKILL: understand]

Read the brain first:

- If .project-brain/understand.md EXISTS → read it, then run a DELTA SCAN:
  check only files changed since the "Last scan" date written in that file.
  Update only the sections that changed. Do not re-scan the whole project.
- If .project-brain/understand.md DOES NOT EXIST → run a full scan (once only).

FULL SCAN (only when understand.md is missing):

Read in this order:

1. package.json / composer.json / requirements.txt — dependencies, scripts, type
2. README.md and any docs/ folder
3. Main entry file — how the app starts
4. All route files — what endpoints or pages exist
5. All model/schema/migration files — what data exists
6. Auth and role files — what roles and permissions exist
7. Frontend component/screen files (if any)
8. Config and .env.example files

Answer all of the following:

APP IDENTITY:

- Name and one-sentence description
- App type: ERP | CRM | SaaS | e-commerce | API | CLI | marketplace | other
- Business domain: inventory | HR | billing | logistics | etc.

HAS FRONTEND: Yes | No
HAS BACKEND: Yes | No
FRONTEND STACK: React | Vue | Angular | Blade | Livewire | other | N/A
BACKEND STACK: Laravel | Express | NestJS | Django | Rails | other | N/A
DATABASE: MySQL | PostgreSQL | SQLite | MongoDB | other | N/A
AUTH METHOD: JWT | Session | OAuth | API key | none
TEST FRAMEWORK: Jest | Vitest | PHPUnit | pytest | none

ROLES FOUND IN CODE:

- <role>: defined in <file>, enforced in <middleware/guard>

FEATURES CONFIRMED IN CODE:

- <feature>: COMPLETE | PARTIAL | STUB — located in <file(s)>

TOP-LEVEL FOLDER MAP:

- <folder>: <what lives here>

ENTRY POINT: <file path>

---

Write output to: .project-brain/understand.md

Use this exact format at the top of the file:

# Project Understanding

Last scan: <today's date>
Last git commit: <git rev-parse HEAD output>

Then write all findings under the sections above.

Then append to: .project-brain/work-log.md
Add one line: `[<date>] skill:understand — full scan | delta scan — <N files read>`
