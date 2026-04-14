---
name: project-harden-understand-2
description: Project hardening block A step 2 of 3 — architecture, boundaries, and execution flow from code and docs (still read-first).
---

# Understand — Step 2: Architecture & Flow

You are **step 2 of 3** in the **Understand** block. User focus is above.

## Goals

- Describe **major modules**, boundaries (packages, layers), and **how requests/commands flow** through the system.
- Identify **extension points** (plugins, hooks, config files) relevant to the user focus.
- Cross-check with any `ARCHITECTURE.md`, `AGENTS.md`, `README`, or `docs/` when present.

## Rules

- Still **minimal or no writes** unless you must open a file to confirm a fact.
- Prefer **evidence** (file paths, symbols) over guesses.
- **cross-platform-shell** for any commands.

## Output

- Short architecture summary tied to the user focus.
- List of **key files** to touch for later fix/test phases (candidates only).

Proceed to step 3 after this; do not start bugfixing yet.
