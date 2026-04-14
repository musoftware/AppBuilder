/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

const ADD_FEATURE_PROMPT_SUFFIX = `Infer the full scope of the requested feature from that single input. Then implement it completely across every layer of the existing project. Generate ALL files below with full, working, immediately usable content — no placeholders, no stubs, no TODOs, no "add logic here" comments. Every file must work on day one.

---

## AUTOMATIC INFERENCE RULES
- Detect the existing stack, conventions, and folder structure from the codebase provided
- Infer the full scope of the feature: which existing modules it touches, which new files it requires, and which existing files it modifies
- Never create a new module if the feature belongs in an existing one
- Apply the same naming conventions, patterns, and idioms already present in the codebase — do not introduce new ones
- All secrets go in environment variables — never hardcode anything
- If the feature adds a new database table or column, provide a numbered migration that follows the existing sequence
- If the feature adds a new API endpoint, it must follow the existing versioning, validation, and response envelope patterns
- If the feature sends emails, processes files, or does anything that may exceed 200ms, queue it — do not run it inline
- If the feature touches auth, apply the same auth middleware and role checks already used in the project
- If the feature conflicts with existing business logic, document the conflict and resolve it — do not silently override existing behavior
- Seed data for any new tables must be idempotent and reference valid foreign key IDs from existing seed files

---

## OUTPUT INSTRUCTIONS
Output every file below sequentially. Label each with its exact path as a markdown header. Write the full file content immediately after. For modified files, output the complete file — not a diff, not a snippet. Do not skip any file. Do not summarize. Do not explain what you are doing between files.

---

## GENERATE ALL FILES IN THIS EXACT ORDER

### Documentation updates

docs/CHANGELOG.md
— Add a new entry for this feature under the current version. One bullet describing what was added, one bullet for each existing file modified, one bullet for each new file created.

docs/API.md
— Add documentation for every new endpoint introduced by this feature. For each: method, path, auth required (yes/no and required role), request body schema, response body schema, error codes with meaning, and a curl example with realistic values. Do not remove or alter existing endpoint documentation.

---

### Migration (only if the feature changes the database schema)

[Migration file following the numbering and format already used in the project]
— Adds or modifies only the tables and columns required by this feature. Includes both up and down. Does not touch tables owned by other modules unless the conflict has been resolved and documented.

---

### New files required by this feature

[For every new file the feature requires, generate it at the correct path using the file structure, naming conventions, and idioms native to the detected stack:]

Schema / model layer (if new tables or columns are needed)
— New schema definitions. All columns include id (UUID), created_at, updated_at, deleted_at. Foreign keys have indexes.

Types / contracts layer (if new domain types are needed)
— New entity definitions, enums, and request/response shapes introduced by this feature. No logic.

Validation layer (if new API operations are introduced)
— Input validation for every new API operation. Required fields, types, length limits, and allowed values. One schema per operation.

Repository layer (if new queries are needed)
— New database queries required by this feature. No business logic. Returns typed domain objects.

Service layer (if new business logic is needed)
— New business logic introduced by this feature. Calls the repository. Dispatches async jobs if needed. Throws typed errors. No HTTP or database concerns.

Controller / handler layer (if new endpoints are introduced)
— New HTTP handlers only. Validates input. Calls the service. Returns the response envelope. Maps typed errors to HTTP status codes.

Unit tests for new service functions
— Tests for every new service function. Repository is mocked. Covers: happy path, validation errors, not-found, and authorization failures.

Integration tests for new routes
— Tests for every new route. Uses the real database on an isolated test schema. Covers all relevant status codes.

Seed file (if new tables are introduced)
— 10–20 realistic records. Idempotent. References valid foreign key IDs from existing seed files.

---

### Modified files

[For every existing file that must change to support this feature, output the complete updated file at its exact path. Do not output diffs or partial snippets — always the full file.]

---

Now begin. Output every file. Full content. No skipping.
`;

/**
 * Wraps the user's feature request in the full "add feature" prompt.
 * The request is JSON-encoded so quotes and newlines in the input remain safe.
 */
export function buildAddFeaturePrompt(featureRequest: string): string {
  const trimmed = featureRequest.trim();
  if (!trimmed) {
    throw new Error(
      'buildAddFeaturePrompt: feature request must not be empty.',
    );
  }
  const head =
    '=======\n' +
    'You are a senior software architect and lead developer working on an existing codebase. The user wants to add the following feature: ' +
    JSON.stringify(trimmed) +
    '\n\n';
  return head + ADD_FEATURE_PROMPT_SUFFIX;
}
