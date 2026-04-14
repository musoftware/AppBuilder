/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

const PLAN_PROMPT_SUFFIX = `Infer the full project name, stack, modules, and architecture from that single input. Then scaffold a complete, production-ready project from scratch. Generate ALL files below with full, working, immediately usable content — no placeholders, no stubs, no TODOs, no "add logic here" comments. Every file must work on day one.

---

## AUTOMATIC INFERENCE RULES
- Detect language, framework, database, auth method, frontend, and testing tools from the user input
- If the stack is ambiguous, choose the most battle-tested option for that domain
- Infer realistic modules from the project type (e.g. ERP → HR, Finance, Inventory, Sales; SaaS → Auth, Billing, Dashboard, Teams)
- Apply the conventions, patterns, and folder structure native to the detected stack
- All secrets go in environment variables — never hardcode anything
- Every module must have: schema/model, controller/handler, validation, service layer, tests, and an API docs entry
- All schemas include id (UUID), created_at, updated_at, and deleted_at (soft delete) columns
- Foreign keys always have an index
- Use transactions for all multi-step writes
- All database migrations are numbered sequentially (e.g. 0001_create_users)
- All API routes are versioned under /api/v1/
- Every endpoint validates its input using the idiomatic validation library for the detected stack
- Every endpoint returns a consistent envelope: { "data": ..., "error": null, "meta": { "requestId": "..." } }
- HTTP status codes are always semantically correct: 201 for creates, 204 for deletes, 409 for conflicts
- All list endpoints use cursor-based pagination, not offset
- Passwords are hashed with bcrypt (cost factor 12) or argon2id — never stored plain
- JWTs expire in 15 minutes; refresh tokens expire in 30 days and are rotated on every use
- Rate-limit all authentication endpoints to 5 requests per minute per IP
- Never log passwords, tokens, or raw PII — mask or omit them
- Queue all slow operations instead of running them inline in a request handler: email sending, file processing, export generation, webhook delivery, and any operation that may exceed 200ms
- Queue jobs use 3 retry attempts with exponential backoff and a dead-letter queue for exhausted retries
- All async functions are wrapped in try/catch and errors are logged with structured fields: level, message, requestId, userId, durationMs, stack
- User-facing error messages never expose internal details or stack traces
- Seed files contain 10–20 realistic records per module, are idempotent, and reference valid foreign key IDs from other modules
- Resolve all inter-module data conflicts and document each one in the relevant ADR file

---

## OUTPUT INSTRUCTIONS
Output every file below sequentially. Label each with its exact path as a markdown header. Write the full file content immediately after. Do not skip any file. Do not summarize. Do not explain what you are doing between files.

---

## GENERATE ALL FILES IN THIS EXACT ORDER

### ROOT FILES

README.md
— Project name and one-line description inferred from user input. Badges for build status, coverage, and license. Prerequisites (runtime versions, required services). Environment variables table: name, type, default, required, description. Quickstart commands from clone to running locally. Module list with one sentence each. Link to docs/.

.env.example
— Every environment variable the project uses. One comment per variable explaining what it controls. Safe placeholder values only — no real secrets.

LICENSE
— MIT license. Current year. Project name.

CHANGELOG.md
— v0.1.0 entry. One bullet per module created. One bullet per cross-cutting feature added (auth, queue, logging, etc.).

CONTRIBUTING.md
— Branch naming convention (feat/, fix/, chore/). Commit format (conventional commits). PR process. Pre-submit checklist: tests pass, lint clean, migration included if schema changed.

SECURITY.md
— Supported versions table. Disclosure process. Response SLA: acknowledge within 48 hours, patch within 14 days.

---

### .github/

.github/workflows/ci.yml
— Triggers on push and pull request to main. Jobs: lint, test (with service containers for database and Redis if needed), build. Caches dependencies. Uploads coverage report.

.github/PULL_REQUEST_TEMPLATE.md
— Sections: what changed, why, how tested, migration notes, screenshots if UI changed, breaking change flag.

.github/ISSUE_TEMPLATE/bug_report.yml
— Fields: steps to reproduce, expected behavior, actual behavior, environment details, relevant logs, severity (dropdown).

.github/ISSUE_TEMPLATE/feature_request.yml
— Fields: problem being solved, proposed solution, alternatives considered, acceptance criteria.

---

### docs/

docs/ARCHITECTURE.md
— Full ASCII system diagram. Layer-by-layer breakdown. Data flow for the three most important operations. Module dependency map. Key design decisions with rationale.

docs/API.md
— Complete REST API reference for every endpoint across all modules. For each: method, path, auth required (yes/no and required role), request body schema, response body schema, error codes with meaning, and a curl example with realistic values.

docs/DEPLOYMENT.md
— Local dev setup. Docker Compose instructions if applicable. Staging deployment steps. Production deployment steps including zero-downtime procedure. Health check endpoint. Rollback steps.

docs/TESTING.md
— Test strategy. How to run the full suite. How to run a single test file. Coverage targets per module. How test data is isolated from production data. CI integration notes.

docs/TROUBLESHOOTING.md
— The 15 most likely errors for this stack and project type. For each: the error message, root cause, exact fix steps, relevant log location, and a prevention tip.

docs/STYLE_GUIDE.md
— Naming conventions for files, classes, functions, variables, database tables, and API endpoints. Folder structure rules. Formatting standards. Concrete do/don't code examples in the detected language.

---

### docs/adr/

docs/adr/001-stack-selection.md
— Decision: why this stack was chosen. Context: what alternatives were evaluated. Consequences: trade-offs accepted. Status: accepted.

docs/adr/002-auth-strategy.md
— Decision: which auth mechanism was chosen and why. Context: security requirements and token vs session trade-offs. Consequences: impact on API design and client integration. Status: accepted.

docs/adr/003-inter-module-conflicts.md
— For each data conflict identified between modules: which modules are involved, what data is shared, how ownership is resolved, and why that approach was chosen.

---

### docs/specs/

docs/specs/CORE_SPEC.md
— Full specification for every inferred module. For each: user stories with acceptance criteria, full data model with field names and types, API surface summary, edge cases, validation rules, business logic rules, and a Conflicts section noting any overlap with other modules and how it is resolved.

---

### docs/modules/

[For every module inferred from the user input, generate this file:]

docs/modules/[module-name]/README.md
— What this module does and its responsibilities. Full database schema: all tables, columns, types, indexes, and foreign keys. All relationships to other modules. Full API surface (list of endpoints). Key business rules. Known limitations. Future improvements.

---

### Configuration and tooling

docker-compose.yml
— Services: app, database, Redis if used, queue worker if used. Correct port mappings. Healthchecks on all services. Named volumes for database data.

[Build/task runner config native to the detected stack — Makefile, justfile, package.json scripts, composer.json scripts, etc.]
— Targets or scripts for: install, dev, build, test, lint, migrate, seed, and Docker up/down.

[Linter config native to the detected stack]
— Strict rules appropriate to the language and framework.

[Formatter config native to the detected stack]

[Type-checker or static analysis config native to the detected stack]
— Strictest safe settings for the stack.

---

### Shared utilities

[For every cross-cutting concern below, generate the file at the path and in the language native to the detected stack:]

Structured logger
— Uses the idiomatic logging library for the stack. Emits structured output with fields: level, message, requestId, userId, durationMs. Never logs passwords, tokens, or raw PII.

Typed error classes
— One class per error kind: NotFound, ValidationError, Unauthorized, Forbidden, Conflict. Each carries an HTTP status code. The global error handler maps these to the correct HTTP response.

Queue client
— Queue client setup. Typed job definitions. Retry policy: 3 attempts with exponential backoff starting at 1 second. Dead-letter handling for jobs that exhaust retries.

Database client
— Connection pool singleton. Transaction helper. Graceful shutdown hook that drains the pool before process exit.

Auth middleware
— Verifies the token or session using the auth method chosen for this stack. Attaches the authenticated user (id, role) to the request context. Returns 401 on invalid or expired credentials. Never throws — always responds.

Request ID middleware
— Generates a unique ID per request. Attaches it to the request context and to a response header. Included in every log line.

Global error handler
— Catches typed application errors and maps them to their HTTP status codes. Catches unknown errors and returns 500. Never exposes stack traces in production.

---

### Source code — repeat this block for every inferred module

For every module, generate the following layers using the file structure, naming conventions, and idioms native to the detected stack:

Schema / model layer
— Database schema for this module. All tables, columns, types, constraints, indexes, and foreign keys. Migration up and down.

Types / contracts layer
— All domain types for this module: entity definitions, enums for status and category fields, request and response shapes for every API operation. No logic.

Validation layer
— Input validation for every API operation in this module. Required fields, types, length limits, and allowed values. One schema per operation.

Repository layer
— All database queries for this module. No business logic. Returns typed domain objects.

Service layer
— Business logic. Calls the repository. Dispatches async jobs to the queue. Throws typed errors. No HTTP or database concerns.

Controller / handler layer
— HTTP layer only. Validates input. Calls the service. Returns the response envelope. Maps typed errors to HTTP status codes.

Unit tests
— Tests for every service function. Repository is mocked. Covers: happy path, validation errors, not-found, and authorization failures.

Integration tests
— Tests for every route. Uses the real database on an isolated test schema. Covers all relevant status codes.

Seed file
— 10–20 realistic records. Idempotent. References valid foreign key IDs from other modules' seed files.

---

Now begin. Output every file. Full content. No skipping.
`;

/**
 * Wraps the user's project idea in the full scaffold prompt.
 * The idea is JSON-encoded so quotes and newlines in the input remain safe.
 */
export function buildPlanScaffoldPrompt(userIdea: string): string {
  const trimmed = userIdea.trim();
  if (!trimmed)
    throw new Error('buildPlanScaffoldPrompt: idea must not be empty.');
  const head =
    '=======\n' +
    'You are a senior software architect and lead developer. The user wants to build: ' +
    JSON.stringify(trimmed) +
    '\n\n';
  return head + PLAN_PROMPT_SUFFIX;
}
