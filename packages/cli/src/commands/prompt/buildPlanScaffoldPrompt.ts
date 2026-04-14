/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

const PLAN_PROMPT_SUFFIX = `Infer the full project name, stack, modules, and architecture from that single input. Then scaffold a complete, production-ready project from scratch. Generate ALL files below with full, working, immediately usable content — no placeholders, no stubs, no TODOs, no "add logic here" comments. Every file must work on day one.

---

## AUTOMATIC INFERENCE RULES
- Detect language, framework, database, auth method, frontend, and testing tools from the user input
- If stack is ambiguous, choose the most production-proven option for that domain
- Infer realistic modules from the project type (e.g. ERP → HR, Finance, Inventory, Sales; SaaS → Auth, Billing, Dashboard, Teams)
- Apply the conventions, patterns, and folder structure native to the detected stack
- All secrets go in environment variables — never hardcode anything
- Every module must have: schema/model, controller/handler, validation, service layer, tests, and API docs entry
- Use transactions for all multi-step writes
- Queue all slow operations (emails, exports, reports, heavy computation)
- Seed realistic dummy data for every module
- Resolve all inter-module conflicts and document them in the relevant ADR file

---

## OUTPUT INSTRUCTIONS
Output every file below sequentially. Label each with its exact path as a markdown header. Write the full file content immediately after. Do not skip any file. Do not summarize. Do not explain what you are doing between files.

---

## GENERATE ALL FILES IN THIS EXACT ORDER

### ROOT FILES

README.md
— Project title and one-line description inferred from user input. Full setup instructions. Environment variables table with name, type, default, and description for every var. Architecture summary. Module list with one-line description each. Quickstart commands from clone to running locally.

LICENSE.md
— MIT license. Fill in current year and project name.

CHANGELOG.md
— Start at v0.1.0. List every module and feature being created as the initial release entries.

CONTRIBUTING.md
— Branch naming convention. Commit message format. PR process. Code review checklist. How to run tests before submitting.

CODE_OF_CONDUCT.md
— Team conduct rules. Communication standards. Conflict resolution steps. Enforcement policy.

ROADMAP.md
— Phase 1: MVP with all inferred core modules and target date. Phase 2: growth features. Phase 3: scale and performance. Each milestone has a goal, deliverables list, and success criteria.

SECURITY.md
— Vulnerability reporting process. Security contact placeholder. Supported versions table. Response SLA.

---

### .github/

.github/PULL_REQUEST_TEMPLATE.md
— Checklist: what changed, why, how tested, screenshots if UI, linked issue number, migration notes, breaking changes flag.

.github/ISSUE_TEMPLATE/bug_report.md
— Form fields: steps to reproduce, expected behavior, actual behavior, environment details, relevant logs, severity.

.github/ISSUE_TEMPLATE/feature_request.md
— Form fields: problem being solved, proposed solution, alternatives considered, acceptance criteria, priority.

---

### docs/

docs/ARCHITECTURE.md
— Full ASCII system diagram. Layer-by-layer breakdown. Data flow from request to response. Module dependency map. All major design decisions with rationale.

docs/DEPLOYMENT.md
— Local dev setup. Staging deployment steps. Production deployment steps. Required environment variables per environment. Health check endpoints. Rollback procedure.

docs/API.md
— Complete REST API reference for every endpoint across all modules. For each: method, path, auth required, request body schema, response schema, error codes, example curl command.

docs/TESTING.md
— Test strategy. How to run the full suite. How to run a single test. Coverage targets per module. Mocking approach. How test data is seeded. CI integration notes.

docs/TROUBLESHOOTING.md
— Top 15 most likely errors for this stack and project type. For each: error message, root cause, exact fix steps, relevant log location, prevention tip.

docs/DEPENDENCIES.md
— Every third-party library used. For each: name, version, purpose, why chosen over alternatives, license type.

docs/GLOSSARY.md
— Every domain-specific term and acronym used in this project. Plain-language definition. Which module it belongs to.

docs/STYLE_GUIDE.md
— Naming conventions for files, classes, functions, variables, database tables, and API endpoints. Folder structure rules. Formatting standards. Real do/don't code examples in the detected language.

---

### docs/adr/

docs/adr/001-initial-architecture.md
— Decision: why this stack was chosen. Context: what alternatives were evaluated. Consequences: trade-offs accepted. Status: accepted.

docs/adr/002-auth-strategy.md
— Decision: which auth mechanism was chosen and why. Context: security requirements, token vs session trade-offs. Consequences: impact on API design and frontend. Status: accepted.

---

### docs/specs/

docs/specs/CORE_SPEC.md
— Full specification for every inferred module. For each module: user stories with acceptance criteria, full data model with field names and types, API surface summary, edge cases, validation rules, business logic rules, and a ## Conflicts section noting any overlap with other modules and how it is resolved.

---

### docs/modules/

[For every module inferred from the user input, generate this file:]

docs/modules/[module-name]/README.md
— What this module does. Its responsibilities. Full database schema with all tables, columns, types, indexes, and foreign keys. All relationships to other modules. Full API surface (list of endpoints). Key business rules. Known limitations. Future improvements.

---

Now begin. Output every file. Full content. No skipping.
`;

/**
 * Wraps the user's project idea in the full "scaffold everything" planning prompt.
 * The idea is JSON-encoded in the first line so quotes and newlines remain safe.
 */
export function buildPlanScaffoldPrompt(userIdea: string): string {
  const trimmed = userIdea.trim();
  const head =
    '=======\n' +
    'You are a senior software architect and lead developer. The user wants to build: ' +
    JSON.stringify(trimmed) +
    '\n\n';
  return head + PLAN_PROMPT_SUFFIX;
}
