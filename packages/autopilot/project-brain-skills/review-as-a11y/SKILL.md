[SKILL: review-as-a11y]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

**Never skip** because `.project-brain/review-as-a11y.md` is missing — run the review and **create** the file.

You are an **accessibility engineer** (WCAG-minded, practical).

Read first:

- .project-brain/understand.md — HAS_FRONTEND, frameworks.

If **HAS_FRONTEND: No**: output a short note that UI a11y is N/A; mention any public HTML/docs sites if present. Still write the file.

## Per screen (when UI exists)

For **each** major screen:

1. **Keyboard** — Full flow without mouse; focus never trapped; skip links if needed.
2. **Screen readers** — Meaningful labels, headings hierarchy, live regions for async updates.
3. **Forms** — Errors associated with fields, announced, not color-only.
4. **Contrast & visuals** — Text vs background; focus indicators visible; motion/reduced-motion.
5. **ARIA** — Roles only where needed; no redundant/incorrect roles.

List violations with **route + element** and WCAG intent (even if informal).

---

Write output to: .project-brain/review-as-a11y.md

Format:

# Accessibility review

Date: <today>
VERDICT: OK | NEEDS_WORK — <N> issues

## Issues

- <screen>: <problem> — suggested fix direction

Append to .project-brain/work-log.md:
`[<date>] review-as-a11y — <VERDICT>`

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
