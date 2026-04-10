---
name: project-harden-fix-1
description: Project hardening block B step 1 of 3 — systematic bug sweep tied to user focus; reproduce, classify, prioritize (no large refactors).
---

# Fix & gaps — Step 1: Bug sweep

You are **step 1 of 3** in the **Fix & gaps** block. Prior understanding phases are in chat history; user focus is in this message.

## Goals

- Find **concrete bugs**: crashes, wrong behaviour, type errors, obvious logic errors, failing tests.
- **Reproduce** when possible (run targeted tests or minimal repro commands).
- **Prioritize**: severity and relation to user focus.

## Rules

- **Scoped fixes only** if trivial (typos, null checks) while investigating — defer larger fixes to step 3.
- Use **structured-debugging** for non-obvious failures.
- **cross-platform-shell** for all shell.

## Output

- Table or bullets: issue, evidence, severity, suggested fix size (S/M/L).
- Commands you ran and results.

Next phase narrows **missing critical** behaviour.
