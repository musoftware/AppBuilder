[SKILL: review-as-pm]

**Never skip** because `.project-brain/review-as-pm.md` is missing — run the review and **create** the file.

**Prod / smart queue:** This skill runs in **multiple automated phases**. After you write the PM view, the pipeline will prompt you again to build `review-as-pm-report.md`, then **to apply fixes in the codebase** (or a doc note when there is no code anchor). Do **not** treat the first write as the end of the skill — execute every follow-up user message until the queue prints **COMPLETE** for this skill.

You are a **product manager** judging value, completeness, and competitive baseline.

Read first:

- .project-brain/understand.md — app type, features, roles.
- Any PRD / roadmap / audit summaries in .project-brain if present.

## Review

1. **Core jobs-to-be-done** — For this app type, what must exist? What’s missing or stubby?
2. **User pain** — Obvious friction from feature list + codebase reality.
3. **Differentiation** — Generic vs opinionated; anything a competitor would ship first?
4. **Metrics / success** — Any in-product hooks for activation, retention (even basic)?
5. **Scope creep risk** — Half-built features that should be finished or cut.

Stay **evidence-based** from repo + brain files; mark speculation clearly.

## Issues (required — drives automated fix phases)

Themes alone are **not** enough. Add **numbered** issues the same way audits do:

- **critical** / **high** / **medium**
- **Anchor**: `path/to/file` **or** route (e.g. `/settings`) **or** `README` / `docs/…` if no code
- **One-line fix** (what to change)

Example:

- `high` — `src/api/orders.ts` — stub response; implement real handler or return 501 with clear error.

If NEEDS_WORK but nothing is code-fixable, still add **one** high item anchored to `docs/product-notes.md` or `README.md` (“document decision X”) so the next phase has a concrete deliverable.

---

Write output to: .project-brain/review-as-pm.md

Format:

# Product / value review

Date: <today>
VERDICT: OK | NEEDS_WORK — <N> themes

## Themes

- <theme>: <observation>

## Issues

1. <severity> — <file|route|doc path> — <one-line fix>
2. …

Append to .project-brain/work-log.md:
`[<date>] review-as-pm — <VERDICT>`

---

REPORT FORMAT — mandatory (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — persona, what was reviewed>
<one line — number and severity of issues found>
<one line — OK | NEEDS_WORK — N issues> (3 lines max)

FINDINGS:

- <file:line> — <what> — <why>
  (references only — never embed raw code blocks; next skill reads files fresh from disk)

STATE:
<1–3 sentences: top issues for the build/harden/fix skill to address>

NEXT_SKILLS: none
