[SKILL: build]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

Read first:

- .project-brain/understand.md — know the stack and patterns
- .project-brain/plan.md — get the task list and implementation order
- .project-brain/build.md — if exists, skip tasks already marked DONE

Follow the IMPLEMENTATION ORDER from plan.md exactly.
For each task, in order:

1. Read the task definition
2. Read the relevant existing code files to understand the patterns
3. Implement completely — no placeholders, no TODOs
4. Follow existing naming conventions, file structure, and code style exactly
5. After completing: print ✅ BUILT: <task name> — <files touched>

For backend tasks: follow existing route/controller/service/model patterns
For frontend tasks: follow existing component/screen/hook/store patterns
For database tasks: create migrations following existing migration file format

Do NOT touch working code unless the task explicitly requires it.

---

Write output to: .project-brain/build.md using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — N tasks completed>
<one line — N tasks deferred or blocked>
<one line — PROD_READY | NOT_READY | NEEDS_WORK> (3 lines max)

FINDINGS:

- <file:line> — <task name: done|deferred> — <reason if deferred>
  (references only — never embed raw code blocks)

STATE:
<1–3 sentences: what was built, what is still stub/deferred, what harden/test should focus on>

NEXT_SKILLS: harden, test-unit

Rules:

- Never embed raw code. Use file:line references only.
- VERDICT: FAIL only for unrecoverable errors.

Append to: .project-brain/work-log.md
Add: `[<date>] skill:build — <N> tasks completed, <N> deferred`
