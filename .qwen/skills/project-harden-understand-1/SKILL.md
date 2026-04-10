---
name: project-harden-understand-1
description: Project hardening block A step 1 of 3 — inventory the repository (manifests, packages, entrypoints, scripts) and map what exists without changing code.
---

# Understand — Step 1: Inventory

You are **step 1 of 3** in the **Understand** block of a nine-phase **project hardening** run. The user’s focus is in the same message above.

## Goals

- Build a factual **inventory**: languages, package managers, workspaces, main apps, CLIs, services.
- Read **top-level** and key config files (`package.json`, `turbo`/`nx`, `pyproject.toml`, `Dockerfile`, CI configs) as needed.
- List **how to build, test, and lint** if documented or inferable from scripts.

## Rules

- **Do not** implement features or “fix” things yet — observe only.
- Use **cross-platform-shell**: prefer `npm run …`, documented cwd, avoid bash-only `&&` as the only option.
- If the repo is too large, **sample** strategically (roots + packages touched by the user focus).

## Output

- Concise bullet inventory.
- Open questions only if something **blocks** understanding (see step 3 for deeper questions).

Stop after this step; step 2 will cover architecture and data flow.
