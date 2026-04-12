[SKILL: review-as-mobile]

**Never skip** because `.project-brain/review-as-mobile.md` is missing — run the review and **create** the file.

**Prod / smart queue:** This skill runs in **several automated phases** (brain → `-report.md` → **fix** → more fix → verify → complete). You must **finish all phases** for this skill. Do **not** stop after editing one or two files in an early phase.

You are a user on a **small phone** (e.g. ~360×640 CSS px), touch-first.

Read first:

- .project-brain/understand.md — HAS_FRONTEND, responsive approach, routes/features.

If **HAS_FRONTEND: No**: print **SCOPE: no web UI** at the top; review mobile-related surfaces only (native app paths in repo, responsive emails, CLI not applicable). Still produce **Issues** with doc/code anchors. Do **not** reply “N/A” and stop without a short written pass.

## Coverage (mandatory — no cherry-picking)

Before writing issues, **enumerate scope** from the codebase (and `understand.md`):

1. List **every main route, page, or top-level view** you can find (router config, `pages/`, `app/`, major screens). If the app has **fewer than ~8** distinct screens, **all** must appear under **Screens reviewed**.
2. For **shared layout** (shell, nav, modals): review as its own row if it affects multiple screens.
3. **Forbidden:** stopping after one “example” screen or one CSS file. **Forbidden:** “representative sample only” unless the app truly has a single screen (say so explicitly).

## Per screen (when UI exists)

For **each** screen listed under **Screens reviewed**:

1. **Layout** — Horizontal scroll? Overlaps? Fixed headers eating space?
2. **Tap targets** — Buttons/links ≥ ~44px effective area; spacing between actions.
3. **Tables & data** — Readable without pinching? Alternatives (cards, stack)?
4. **Forms** — Input types, zoom on focus (iOS), keyboards appropriate.
5. **Navigation** — Menus usable; modals full-screen or dismissible.

## Issues (required — drives fix phases)

Use **numbered** rows only (same idea as audits):

- **critical** / **high** / **medium**
- **Anchor**: component file, stylesheet, or route (e.g. `src/components/Nav.tsx`, `app/globals.css`, `/dashboard`)
- **One-line fix**

**Minimum:** If NEEDS_WORK, you must have **at least as many anchored issues as screens** that show real problems (or explain under a single **cross-cutting** issue with the shared layout file). Vague bullets without paths are not enough.

---

Write output to: .project-brain/review-as-mobile.md

Format:

# Mobile UX review

Date: <today>
VERDICT: OK | NEEDS_WORK — <N> issues

## Screens reviewed

- <route or screen name> — <key file(s) inspected>

## Issues

1. <severity> — <file or route> — <one-line problem + fix hint>
2. …

Append to .project-brain/work-log.md:
`[<date>] review-as-mobile — <VERDICT>`
