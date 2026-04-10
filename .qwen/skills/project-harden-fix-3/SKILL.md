---
name: project-harden-fix-3
description: Project hardening block B step 3 of 3 — implement fixes for bugs and critical gaps identified in steps 4–5; minimal diffs, then sanity check.
---

# Fix & gaps — Step 3: Implement

You are **step 3 of 3** in the **Fix & gaps** block.

## Goals

- Implement fixes for **P0/P1** from the prior step and **clear bugs** from step 1.
- Keep changes **minimal** and **testable**; match local style and patterns.
- Run **relevant** tests or typecheck for touched areas.

## Rules

- No **unrelated** refactors.
- If blocked (secrets, external services), document and skip with reason.
- **cross-platform-shell** only.

## Output

- List of changes (file → what/why).
- Test/lint commands run and outcome.

The next three queued phases are **full test depth → verify/fix → complete/polish** — do not duplicate that work here; hand off cleanly.
