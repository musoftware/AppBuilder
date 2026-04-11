[SKILL: smart-orchestrator]

This is the master orchestrator. It reads the project brain and decides
which skills to run, in what order, based on what the project needs.

STEP 1 — READ OR BUILD THE BRAIN:

Check if .project-brain/understand.md exists:

- YES → read it → go to STEP 2
- NO → run the full content of .qwen/skills/understand/SKILL.md first
  then read the result → go to STEP 2

STEP 2 — SELECT SKILLS:

Read understand.md and build a run list:

ALWAYS ADD:

- audit-roles (always needed)
- plan (always needed)
- build (always needed)
- harden (always needed)
- prod-gate (always last)

IF HAS BACKEND is Yes → ADD:

- audit-backend
- audit-database
- test-unit
- test-integration

IF HAS FRONTEND is Yes → ADD:

- audit-frontend
- test-e2e

ADD: test-fix (always, after any test skill)

CHECK .qwen/skills/ for any OTHER skill folders not in the list above:

- For each found: read its SKILL.md, check if it applies to this project
- If it applies: add it in the right position in the run list
- Print: ✅ CUSTOM SKILL ADDED: <skill-name>

STEP 3 — CHECK WHAT ALREADY RAN:

For each skill in the run list:

- Check if .project-brain/<skill-name>.md exists
- If YES and the file is recent (written after last git commit) → SKIP
- If YES but file is older than last commit → DELTA (re-run with delta flag)
- If NO → FULL RUN

Print the run plan (example shape):

```
RUN PLAN:
- understand:         SKIP (current)
- audit-backend:      FULL RUN (no previous output)
- audit-frontend:     DELTA (files changed since last run)
- audit-roles:        FULL RUN
- audit-database:     SKIP (current)
- plan:               FULL RUN
- build:              FULL RUN
- harden:             FULL RUN
- test-unit:          FULL RUN
- test-integration:   FULL RUN
- test-e2e:           FULL RUN
- test-fix:           FULL RUN
- prod-gate:          FULL RUN
```

STEP 4 — RUN IN ORDER:

For each skill in the run plan (in order):

1. Print: ━━━ RUNNING: <skill-name> ━━━
2. Run the full content of .qwen/skills/<skill-name>/SKILL.md
3. Wait for completion
4. Read the output file .project-brain/<skill-name>.md
5. If PROD_READY found in prod-gate.md → stop, print success
6. If NOT_READY found in prod-gate.md → loop back to audit skills with context preserved
7. Continue to next skill
