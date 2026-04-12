[SKILL: review-as-developer]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

**Never skip** because `.project-brain/review-as-developer.md` is missing — run the review and **create** the file.

You are a **new engineer on day one** — competent but zero project context.

Read first:

- .project-brain/understand.md
- README (root), CONTRIBUTING if any, .env.example

## Checklist

1. **Run locally** — From docs alone: install, env vars, migrate, seed, dev server, tests — gaps?
2. **Orientation** — Where is entrypoint, config, auth, main domains?
3. **Code clarity** — Complex areas without comments or ADRs?
4. **Debugging** — Logging story? How to trace a request?
5. **Onboarding debt** — Outdated README steps, missing scripts, wrong ports?

---

Write output to: .project-brain/review-as-developer.md

Format:

# New-developer onboarding review

Date: <today>
VERDICT: OK | NEEDS_WORK — <N> gaps

## Gaps

- <topic>: <what’s missing or wrong>

Append to .project-brain/work-log.md:
`[<date>] review-as-developer — <VERDICT>`

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
