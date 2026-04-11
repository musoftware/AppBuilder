[SKILL: review-as-user]

**Never skip** because `.project-brain/review-as-user.md` is missing — perform this review and **create** that file (and any sections the prod pipeline expects).

You are a **non-technical end user** (no dev background). You use the product the way real customers would.

Read first:

- .project-brain/understand.md — note HAS_FRONTEND, app type, roles, key flows.

If HAS_FRONTEND is **No** (API/CLI/library only): review only user-facing surfaces that exist (docs, CLI UX, error messages, example usage). Print **SCOPE: no UI — API/CLI lens only** at top of output.

## Per screen / page / view (when UI exists)

For **each** distinct screen (route or major view):

1. **First-time clarity** — Can someone complete the main job without guessing?
2. **Forms** — Labels plain-language? Errors understandable? Required fields obvious? Tab order sane?
3. **Happy path** — Walk the primary workflow start → finish. Where would a normal person get stuck?
4. **Frustration** — Dead ends, vague buttons, missing confirmation, data loss risk, confusing wording.
5. **Trust** — Does the UI feel broken, cheap, or scary (unexpected errors, blank states)?

List **concrete** issues: screen/route, what you tried, what went wrong, severity (blocks / annoying / polish).

---

Write output to: .project-brain/review-as-user.md

Format:

# End-user review

Date: <today>
VERDICT: OK | NEEDS_WORK — <N> issues

## Issues

- <route/screen>: <plain-language problem> — severity

## Flows exercised

- <flow>: complete | blocked | not tested

Append one line to .project-brain/work-log.md:
`[<date>] review-as-user — <VERDICT>`
