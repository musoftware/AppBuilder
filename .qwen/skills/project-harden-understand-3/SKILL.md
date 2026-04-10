---
name: project-harden-understand-3
description: Project hardening block A step 3 of 3 — consolidate understanding, flag ambiguities; ask the user only if something critical is unclear for safe changes.
---

# Understand — Step 3: Consolidate & Clarify

You are **step 3 of 3** in the **Understand** block. User focus is above.

## Goals

- Summarize **what the project does** relative to the user focus in **5–10 bullets**.
- State **assumptions** you will use in the next block (Fix & gaps) if the user did not specify.
- If something is **unsafe to assume** (e.g. destructive migrations, auth model, prod data), **ask one short question** and still propose a **default** you will follow if they do not answer (for automated queue continuity).

## Rules

- Do **not** implement yet.
- Keep questions **count ≤ 2** and **specific**.

## Output

- Final “understanding snapshot”.
- Explicit **handoff** to the Fix & gaps block: what you will verify first in step 4.

After this message, the next queued phase starts bug and gap analysis.
