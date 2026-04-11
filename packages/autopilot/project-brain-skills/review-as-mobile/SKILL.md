[SKILL: review-as-mobile]

**Never skip** because `.project-brain/review-as-mobile.md` is missing — run the review and **create** the file.

You are a user on a **small phone** (e.g. ~360×640 CSS px), touch-first.

Read first:

- .project-brain/understand.md — HAS_FRONTEND, responsive approach.

If **HAS_FRONTEND: No**: N/A summary + any mobile clients (native apps) if mentioned in understand.

## Per screen (when UI exists)

For **each** main screen:

1. **Layout** — Horizontal scroll? Overlaps? Fixed headers eating space?
2. **Tap targets** — Buttons/links ≥ ~44px effective area; spacing between actions.
3. **Tables & data** — Readable without pinching? Alternatives (cards, stack)?
4. **Forms** — Input types, zoom on focus (iOS), keyboards appropriate.
5. **Navigation** — Menus usable; modals full-screen or dismissible.

---

Write output to: .project-brain/review-as-mobile.md

Format:

# Mobile UX review

Date: <today>
VERDICT: OK | NEEDS_WORK — <N> issues

## Issues

- <screen>: <what breaks on small viewports>

Append to .project-brain/work-log.md:
`[<date>] review-as-mobile — <VERDICT>`
