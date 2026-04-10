---
name: cross-platform-shell
description: Write and suggest shell commands that work on Linux, macOS, and Windows without duplicating three variants. Covers PowerShell vs bash, chaining (&&), cd + run, npm scripts, and when to use separate tool calls instead of one long shell string.
---

# Cross-Platform Shell and CLI Commands

Users on **Windows** often run **PowerShell** (5.1 is still common; 7+ behaves more like bash for some operators). Agents on **Linux/macOS** default to **bash**. The same one-liner is **not** portable unless you design for that up front.

**Goal:** deliver **one** correct approach—preferably **identical everywhere**—instead of: Linux command → fails on Windows → rewrite → retest → rewrite again.

## 1. Prefer zero-shell or shell-agnostic runners

Use these **before** hand-rolled `cd … && … && …`:

| Approach                                             | Why                                                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **`npm run <script>`** / **`pnpm run`** / **`yarn`** | Chaining and `cd` live in `package.json`; npm executes with a consistent shell per platform. |
| **`npx <pkg> <args>`**                               | Same invocation on all OSes when run from the repo root or the right cwd.                    |
| **Small `node` / `.mjs` script** in `scripts/`       | Logic and paths in JS; no `&&` portability issues.                                           |
| **Two separate shell tool calls**                    | First `cd` or `Set-Location`, second command—works in any shell without chaining syntax.     |

If the user already has **`build-and-bundle.bat`** (or similar) for Windows, **reference it** instead of inventing a parallel PowerShell chain.

## 2. Know why `&&` “works on Linux but not Windows”

- **`cmd.exe`:** supports `&&` (run next only if previous succeeded).
- **PowerShell 7+:** supports `&&` and `||`.
- **Windows PowerShell 5.1:** historically **did not** support `&&` as a statement separator (parse error). Many Windows installs are still 5.1.

So **`command1 && command2` is unsafe** in documentation or generated commands unless you know the user uses **PowerShell 7+**, **cmd**, **Git Bash**, or **WSL**.

## 3. Portable patterns (pick one, don’t triple-write)

### A. Single npm script (best)

```json
"scripts": {
  "check:core": "cd packages/core && npx vitest run src/foo.test.ts"
}
```

User runs: `npm run check:core` — same on Linux and Windows (npm normalizes).

### B. Document “from package directory” without chaining

AGENTS-style: _“Run from `packages/core`”_ then give **one** command with **no** `cd`:

```bash
npx vitest run src/path/to/file.test.ts
```

Tell the user to open a shell **already** in that directory, or use **two steps** in the tool UI.

### C. PowerShell-safe sequential (when you must script for Windows)

For PS 5.1, avoid `&&`. Use either:

```powershell
Set-Location packages/core; npx vitest run src/foo.test.ts
```

or conditional continuation:

```powershell
Set-Location packages/core
if ($?) { npx vitest run src/foo.test.ts }
```

### D. Bash-only doc block

If the command is **intentionally** bash-only (CI on Linux, WSL, Git Bash), **label it**:

> **Bash / WSL / Git Bash:** `cd packages/core && npx vitest run …`

Do **not** present that as the only option without a Windows note.

## 4. Agent workflow (avoid duplicate command triples)

1. **Can this be `npm run …`?** If yes, add or reuse a script; output **one** line for all platforms.
2. **If chaining is required** and shell is unknown: prefer **two invocations** (cd then run) or **one npm script**.
3. **Never** output three full copies (“Linux / macOS / Windows”) unless the user explicitly asked for per-OS snippets. Instead: **one portable primary** + **one short fallback** (e.g. “On Windows PowerShell 5, use `;` instead of `&&` or use `npm run …`”).
4. **Paths:** use forward slashes in Node/npm contexts where accepted; use `path.join` in scripts.

## 5. This repository (Qwen Code / AppBuilder)

- Tests are run **per package** with `npx vitest run <file>` from **`packages/<pkg>`** — avoid `npm run test -- --filter` from root (does not filter as expected per project docs).
- Prefer **absolute or workspace-relative** instructions plus **“cwd = `packages/cli`”** over long `cd … &&` one-liners in chat.
- Integration tests: use documented **`npm run test:integration:…`** scripts when possible.

## 6. Quick reference

| Need                         | Avoid                                 | Prefer                                     |
| ---------------------------- | ------------------------------------- | ------------------------------------------ |
| Run A then B                 | `A && B` in user-facing generic shell | `npm run` script, or two steps             |
| Env vars                     | `VAR=1 cmd` (bash-only)               | `cross-env` in npm script, or platform doc |
| “Works everywhere” one-liner | Assumed bash                          | `npm run …` or `npx …` from documented cwd |

When in doubt, **add a 5-line npm script** rather than a fragile chained one-liner.
