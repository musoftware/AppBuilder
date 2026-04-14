/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

const FRONTEND_PROMPT_SUFFIX = `Infer the full UI scope, routes, components, and data needs from that single input. Then implement it completely using the existing project's frontend stack and conventions. Generate ALL files below with full, working, immediately usable content — no placeholders, no stubs, no TODOs, no "add logic here" comments. Every file must work on day one.

---

## AUTOMATIC INFERENCE RULES
- Detect the existing frontend framework, router, state library, styling approach, and component patterns from the codebase (or from the brief if no codebase is provided)
- Infer which screens, routes, layout regions, and shared components are required; prefer extending existing primitives over inventing new ones
- Match naming, folder structure, imports, and formatting conventions already used in the project
- All user-visible strings that may ship in multiple locales should go through the project's i18n mechanism if one exists; otherwise use plain copy consistent with nearby UI
- Forms: validation mirrors server rules where applicable; show field-level errors and a single submit error region; disable submit while pending; preserve user input on failure
- Loading and empty states for every async view; skeletons or spinners consistent with the rest of the app
- Error boundaries or equivalent where the stack supports them for route-level failures
- Accessibility: semantic HTML, labels for every control, focus order, keyboard paths for interactive flows, visible focus styles, color contrast meeting WCAG AA for text and interactive states
- Responsive behavior: mobile-first unless the codebase clearly uses another convention; no horizontal scroll on common phone widths unless intentional (e.g. data tables with documented overflow)
- Performance: avoid unnecessary re-renders; lazy-load heavy routes or chunks if the stack supports it and the view warrants it; images use appropriate sizing and lazy loading where idiomatic
- Do not hardcode API URLs or secrets; use existing env/config patterns
- If the work touches API types, align with existing client types or generated SDK usage — do not duplicate divergent shapes

---

## OUTPUT INSTRUCTIONS
Output every file below sequentially. Label each with its exact path as a markdown header. Write the full file content immediately after. For modified files, output the complete file — not a diff, not a snippet. Do not skip any file. Do not summarize. Do not explain what you are doing between files.

---

## GENERATE ALL FILES IN THIS EXACT ORDER

### Documentation updates

docs/CHANGELOG.md
— Add a new entry for this UI work under the current version. One bullet describing the user-facing outcome, one bullet per existing file modified, one bullet per new file created.

---

### New or updated frontend modules

[Every new or updated file required for routes, pages, layouts, components, hooks, context, and client-only utilities]

Route / page layer
— New or updated route entries and page components. Wire loading and error UI. Preserve existing auth guards and layout nesting.

Presentational components
— Dumb components with typed props. No data fetching inside unless that is the established pattern in this codebase.

Container / smart components (if the stack separates them)
— Data fetching, mutations, and orchestration only. Delegate rendering to presentational pieces.

Shared UI primitives (only if genuinely shared)
— Extract only when duplication is real; otherwise colocate with the feature.

Styling
— Use the project's styling system (CSS modules, Tailwind, styled-components, etc.). No inline styles except for truly dynamic values where the codebase already does so.

Hooks and state
— Custom hooks for reusable logic. Prefer existing global stores only when the feature is cross-cutting.

Types
— Props, route params, and form value types. No \`any\`.

Assets
— Icons or images only when needed; reference paths consistent with the bundler config.

---

### Tests

[Follow the project's test runner and patterns]

Component or unit tests
— Cover critical interactions, validation, and accessibility roles where meaningful.

End-to-end or integration tests (if the project already uses them for UI)
— One happy path per new primary flow; include an assertion on a visible success state.

---

### Modified files

[Every existing file that must change to register routes, exports, navigation, or shared config — output the complete updated file at its exact path]

---

Now begin. Output every file. Full content. No skipping.
`;

/**
 * Wraps the user's UI brief in the full frontend implementation prompt.
 * The brief is JSON-encoded so quotes and newlines in the input remain safe.
 */
export function buildFrontendPrompt(uiBrief: string): string {
  const trimmed = uiBrief.trim();
  if (!trimmed) {
    throw new Error('buildFrontendPrompt: UI brief must not be empty.');
  }
  const head =
    '=======\n' +
    'You are a senior frontend engineer. Implement the following UI goal end-to-end in the codebase: ' +
    JSON.stringify(trimmed) +
    '\n\n';
  return head + FRONTEND_PROMPT_SUFFIX;
}
