[SKILL: git-feature-workflow]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

This file defines the **Git tool** playbook for MU Code: use **shell / Git** (`run_shell_command`, etc.) as **tools**, not as a multi-phase “skill loop” with PHASE 1/6 headers.

---

## When this runs

1. **`/prod` (and headless `--prod`)** — After the **final prod gate** message, the queue appends **one** prompt that points here: commit, branch, merge, push, cleanup.
2. **`--skill git-feature-workflow`** — Same checklist in one shot when you invoke it manually.

**During** earlier prod prompts (audits, fixes, tests), you should still **commit logical batches** as you go (Conventional Commits). Do not wait until the last message if the user expects steady checkpoints.

---

## Tool mindset

- **Git = tool** for: `status` → `add` → `commit` → `branch` / `merge` / `rebase` → `push` → optional branch delete.
- **Do not** treat this as six separate queue phases; execute what the repo needs in **as few coherent tool rounds** as possible.
- **Do not** force-push shared base branches (`main` / `develop`). **Do not** `reset --hard` published history without **explicit user** approval.

---

## Step 1 — Preconditions

1. `git rev-parse --git-dir` (must be a repo).
2. `git status -sb` — prefer clean tree before big merges; stash or commit WIP with clear messages.
3. Detect integration branch: `git symbolic-ref refs/remotes/origin/HEAD` or `origin/main` | `origin/master` | `origin/develop`.
4. Note remote (usually `origin`): `git remote -v`.

Print a one-line **GIT BASELINE**: branch, dirty/clean, base, remote.

---

## Step 2 — Sync base (before new work or before merge)

1. `git fetch <remote>`.
2. `git checkout <base>` and `git pull --ff-only` (or `merge --ff-only origin/<base>`). If FF fails, stop and explain (diverged history).

---

## Step 3 — Feature branch (when isolating work)

- Names: `feat/<scope>-<slug>`, `fix/<scope>-<slug>`, optional ticket id.
- From updated base: `git checkout -b <branch>`.

---

## Step 4 — Commits while coding (prod run)

- Small commits: `feat:`, `fix:`, `test:`, `chore:`, `docs:`, `refactor:`.
- Run project tests/lint **before** pushing or merging when practical.
- Never commit `.env`, secrets, or accidental build artifacts.

---

## Step 5 — Integrate

- On feature branch: `git rebase origin/<base>` **or** `git merge origin/<base>`; resolve conflicts; test after.
- Push: `git push -u origin <branch>`. **Force-with-lease** only on the **feature** branch after rebase, never on `<base>`.
- **PR-only teams:** push and stop; summarize PR title/body for the user.
- **Local merge allowed:** checkout `<base>`, `git merge --no-ff <branch> -m "merge: …"` (or squash if policy says so), fix conflicts, full test suite, `git push origin <base>`.

---

## Step 6 — Cleanup (after merge is done and pushed)

1. `git checkout <base>` && `git pull`.
2. `git branch -d <feature>` (local).
3. `git push origin --delete <feature>` if policy allows.
4. `git fetch --prune`.

---

## Optional record (lightweight)

Append **one line** to `.project-brain/work-log.md`:

`[<date>] git-tool — <branch or base> — <committed|merged|pushed|pr-opened|blocked> — <one phrase>`

If you maintain `git-feature-workflow.md`, keep it short (SUMMARY + STATE); no strict four-section requirement for the tool path.
