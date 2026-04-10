/**
 * Stack-neutral testing dimensions for quality-check prompts (interactive and
 * standalone). Kept concise; agents map each item to whatever the repo
 * already automates.
 */
export const QC_TESTING_TAXONOMY = `
## Testing dimensions to apply (discover commands in scripts, CI, Makefile, docs)

**By scope** — Use the deepest automated suites the repo defines, not only the
shallowest: unit (isolated parts) → integration (modules, services, DB, APIs,
and boundaries together) → system (full application path, often overlapping
automated e2e/browser/app runs) → acceptance / UAT (business-ready outcomes).
If only technical tests exist, note acceptance/UAT gaps for a human.

**By approach** — Combine reading implementation (white-box) with checks on
observable behavior (black-box); effective QC is usually grey-box.

**By execution** — Prefer automated scripts and CI jobs. Explicitly note
important checks that remain manual (exploratory passes, subjective usability).

**By purpose** — Run or inspect for automated hooks where the project defines
them; do not invent tools that are not there:
- Functional — features behave as specified.
- Regression — new work does not break existing behavior (re-run affected suites).
- Smoke — quick stability signal after a build or deploy step.
- Sanity — narrow verification after a small, localized change.
- Performance / load / stress — timing, throughput, or saturation tests if present.
- Security — dependency audit, secret scanning, SAST, DAST, or policy checks if present.
- Usability — automated heuristics or checklists only when the repo encodes them.
- Compatibility — matrix or multi-target runs (browsers, OS, devices, versions) if present.
- Accessibility — a11y tests, linters, or assertions if present.
`.trim();
