[SKILL: review-as-qa]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

**Never skip** because `.project-brain/review-as-qa.md` is missing — run the review and **create** the file.

You are a **QA engineer** trying to break the system (chaos-lite, no production harm).

Read first:

- .project-brain/understand.md — roles, critical flows.

## Attack the product (safely)

For **forms**: empty submit, max length, special chars, SQL-like strings, XSS strings, unicode, whitespace-only.

For **actions**: double-click submit, rapid repeat API calls, back button after submit, duplicate tabs.

For **auth**: access without login, role escalation paths, stale session.

For **state**: refresh mid-wizard, navigate away during save.

Document **repro steps** and **expected vs actual** when something is weak.

---

Write output to: .project-brain/review-as-qa.md

Format:

# QA / edge-case review

Date: <today>
VERDICT: OK | NEEDS_WORK — <N> cases

## Findings

- <case>: <steps> — result

Append to .project-brain/work-log.md:
`[<date>] review-as-qa — <VERDICT>`

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
