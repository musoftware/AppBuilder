[SKILL: user-stories]

**Never skip** because `.project-brain/user-stories.md` is missing — run this playbook and **create** the required brain files.

This skill is **backlog engineering + traceability + closure** — not a duplicate of opinion-only reviews. See **Guardrails** below.

---

## How this differs from other skills (avoid duplication)

| Skill                   | Purpose                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **review-as-pm**        | Product value, competitive gaps, themes — **no** required story IDs, traceability matrix, or implement loop.                                |
| **review-as-user**      | UX friction per screen — **no** full backlog or role-scoped story catalog.                                                                  |
| **review-as-qa**        | Break-the-app edge cases — **no** authoring a maintained story list with acceptance criteria per role.                                      |
| **user-stories (this)** | **Author** stories → **happy + bad paths** → **solution per path** → **re-check code** → **implement/verify** until closed or **DEFERRED**. |

If `review-as-pm.md` exists, **use it as input** (themes, gaps); do not repeat long PM essays here — reference and convert into **actionable stories**.

---

## Read first

- `.project-brain/understand.md` — roles, routes, features, stack.
- `.project-brain/review-as-pm.md` (if present).
- Auth / RBAC sources in code (roles, policies, guards) — for **evidence**, not guesswork.

---

## Guardrail 1 — Hallucinated stories (evidence vs speculative)

Every story row **must** include:

| Column         | Rule                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Evidence**   | At least one concrete anchor: file path, route, handler name, component, migration, OpenAPI path, or test file. If you cannot anchor after searching the repo, see below. |
| **Confidence** | `CONFIRMED` (evidence found) or `SPECULATIVE` (market/UX assumption, or inferred from docs only).                                                                         |

**Rules:**

- Do **not** invent screens, APIs, or roles that are not implied by code or committed docs.
- **SPECULATIVE** stories must be labeled in the title or ID suffix: `[SPECULATIVE]` and must state _what search you did_ and _what was missing_.
- Prefer **zero SPECULATIVE** rows in the first delivery slice (P0–P1 only); park the rest in a **Backlog / parking lot** section with `SPECULATIVE` and no implementation until confirmed.

---

## Guardrail 2 — Scope explosion (cap per pass)

**Default pass (“Pass A”) — mandatory limits:**

1. **Only P0 and P1** stories get full trace → implement → verify treatment in this run.
2. **Hard cap:** at most **25** stories in the main table for Pass A (split extras into `user-stories-backlog.md`).
3. **Single epic focus (optional override):** if `.project-brain/understand.md` or the user implies one epic (e.g. “checkout only”), scope Pass A to **that epic only**; still cap at 25.
4. P2/P3 and uncapped ideas go to **Backlog** with no implementation obligation in this pass.

**Pass B (later run):** next epic or next P2 slice — same caps.

Document at top of `user-stories.md`:

```text
PASS: A | B | …
SCOPE: P0–P1 only | EPIC: <name>
CAP: max 25 stories in main table
```

---

## Guardrail 3 — Duplicate skills (what this file owns)

**This skill owns:**

- Story IDs (stable): `US-<ROLE>-<###>` (e.g. `US-ADMIN-001`).
- Role-scoped **As a / I want / So that** + **acceptance criteria**.
- **Happy paths** and **bad paths** per story, with **intended solution** (or “already satisfied”) for each.
- **Traceability:** story → code → test (or “no test — manual steps”).
- **Reconciliation passes:** after proposing solutions, **read the code again** and update implementation until paths behave as specified.
- **Verification status** per story and **closure** (code changed or DEFERRED).

**Do not** replace `review-as-user` / `review-as-qa` / `review-as-pm`; **reference** their findings when turning them into **storied work items** with IDs and evidence.

---

## Guardrail 4 — Deferrals (prod-gate friendly)

Any story not completed in this pass **must** end in one of:

- **DONE** — criteria met + verification recorded.
- **DEFERRED** — use exactly this block in `user-stories.md` (or per-story row):

```text
DEFERRED: US-XXX
Reason: <e.g. needs product decision | blocked on third-party | out of scope for this pass>
Owner: <human or team>
Revisit: <condition or date, or "next Pass B">
```

**Rules:**

- **No** open-ended “TODO” without a **DEFERRED** reason — prod-gate and report skills need explicit disposition.
- **DEFERRED** stories do **not** block PROD_READY if they are **not** P0/P1 for this pass and are listed with reason; P0/P1 DEFERRED **must** be called out in the summary as **release blockers** if any.

---

## Per-story: happy paths, bad paths, solutions (required for Pass A)

After the story table is written, **each in-scope story** (P0–P1, within cap) must get a subsection (or row group) with:

### 1) Happy path(s) — “everything goes right”

- At least **one** primary happy path: **Given / When / Then** (or bullet flow).
- Tie to **Evidence** (which route, handler, UI flow implements it).
- If the happy path is **missing or broken** in code, that is a **gap** → goes to solutions.

### 2) Bad paths — “what can go wrong”

Infer **concrete** negative cases (do not hand-wave). Examples to consider per story type:

- **Input:** empty, too long, wrong type, injection-like strings, boundary values.
- **Auth:** unauthenticated, wrong role, expired session, IDOR (another user’s id).
- **State:** double submit, duplicate tab, back button after POST, stale client state.
- **Network / async:** slow API, timeout, 500, offline (if applicable).
- **Data:** missing entity, deleted row, conflict, duplicate unique key.

Label each bad path **BP-&lt;story-id&gt;-&lt;##&gt;** (e.g. `BP-US-ADMIN-001-01`).

Mark **Confidence** for each bad path: `CONFIRMED` (code shows handling or clear absence) vs `SPECULATIVE` (risk not yet observed in code — say what you will check).

### 3) Solution row (per bad path and for any happy-path gap)

For **each** gap (happy path broken / bad path unhandled / wrong behavior):

| Field                | Content                                                       |
| -------------------- | ------------------------------------------------------------- |
| **Gap**              | Short description + story/bad-path id                         |
| **Current behavior** | What code does today (file/route reference)                   |
| **Target behavior**  | What should happen (user-visible + technical)                 |
| **Proposed change**  | Files to touch, pattern to follow (one example from codebase) |
| **Risk**             | low / medium / high                                           |

If no gap: state **`NO GAP — path satisfied`** and cite **file:line** or test name.

### 4) Code reconciliation loop (mandatory)

For Pass A stories, in order:

1. **Re-read** the files/routes listed in Evidence after writing solutions.
2. **Implement** or **adjust** code so happy path works and each bad path reaches **target behavior** (or document **DEFERRED** if out of scope).
3. **Second pass:** read the **same** files again to confirm the change matches the solution row (no drift).
4. **Verify:** run tests or document exact manual steps per story; update **Status** to DONE or DEFERRED.

**Forbidden:** leaving “proposed solution” as text only when the gap is in-scope for Pass A — you must **change code** or **DEFERRED** with reason.

---

## Workflow (summary)

1. **Discover** roles and journeys from code + `understand.md` (evidence-first).
2. **Author** Pass A table: P0–P1 only, ≤25 rows, Evidence + Confidence columns.
3. **Paths & solutions** — For each Pass A story: happy paths, bad paths (`BP-…`), solution rows; mark NO GAP where appropriate.
4. **Trace** each story to code (routes, handlers, components, policies).
5. **Reconcile** — Re-read code; **implement** fixes/enhancements for in-scope gaps; second read to confirm.
6. **Verify** — Tests or manual checklist per story; update status.
7. **Summarize** DONE vs DEFERRED vs backlog; append work-log.

---

## Outputs

**Primary:** `.project-brain/user-stories.md` — Pass header; story table; per-story **Happy paths**, **Bad paths**, **Solutions**; **Code reconciliation** notes (what was re-read, what changed); verification; DEFERRED blocks.

**Optional:** `.project-brain/user-stories-paths.md` — If the main file is too long, move the **Bad paths + Solutions** tables here; `user-stories.md` must still link each story ID to that file.

**Optional:** `.project-brain/user-stories-backlog.md` — P2/P3, SPECULATIVE, overflow beyond cap.

**Optional:** `.project-brain/user-stories-by-role/` — one file per role if the table is too large (still respect Pass A cap in the “active” set).

Append one line to `.project-brain/work-log.md`:

`[<date>] skill:user-stories — Pass <A|B> — <N> done, <N> deferred, <N> backlog`
