[SKILL: build]

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

Write output to: .project-brain/build.md
Format:

# Build Log

## Done

- Task <N>: <name> — <files created/modified>

## Skipped (already done in previous run)

- Task <N>: <name>

## Deferred (blocked)

- Task <N>: <name> — blocked by: <reason> — placeholder added at <file>

Append to: .project-brain/work-log.md
Add: `[<date>] skill:build — <N> tasks completed, <N> deferred`
