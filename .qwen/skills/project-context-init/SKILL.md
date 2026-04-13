---
name: project-context-init
description: Generate project context files (CONTEXT.md, ARCHITECTURE.md, CONTRIBUTING.md, CHANGELOG.md, AGENTS.md, TASKS.md, SECURITY.md, GLOSSARY.md) when starting a new project. Use this skill when the user starts a new project, runs --idea, says "initialize project context", "create project docs", "set up project files", "generate context files", "init project documentation", or after the understand phase of a new project. Always trigger this skill at the start of any new project or when the user asks to create project documentation structure.
---

# Project Context Init

Generates a complete set of project context files tailored to the user's project idea. These files help Qwen Code and other AI agents understand the codebase, conventions, and workflow from day one.

## When to Run

- User creates a new project with `--idea` or similar kickoff
- User says "initialize project", "create project docs", "set up context"
- After understanding the project scope in the understand/brainstorm phase
- User asks to generate or scaffold project documentation files

## Input Gathering

Before generating files, extract answers from the conversation and codebase:

1. **What does the project do?** — Purpose, users, domain
2. **What tech stack?** — Languages, frameworks, databases, tools
3. **Who are the users/roles?** — End users, admins, system roles
4. **What are key workflows?** — Main user journeys
5. **Any specific conventions?** — Naming, testing, deployment preferences

If information is missing, make reasonable defaults based on the project type and note assumptions in the generated files.

## File Generation

Generate each file below in the project root (or `.qwen/` directory if that's the convention). Customize every value — never output placeholder text like `[Project Name]` unless the user hasn't provided any info yet.

---

### 1. CONTEXT.md

Project identity, tech stack, conventions, and AI agent guidelines.

```markdown
# CONTEXT.md

Project-level context file read by Qwen Code at startup. Defines conventions, constraints, and project knowledge for the AI agent.

**Used in**: Qwen Code CLI, Qwen Code interactive mode, Qwen Code autopilot

---

## Project Identity

**Name**: {project-name}
**Type**: {web-app | api | cli-tool | library | mobile-app | monorepo}
**Domain**: {business domain}
**Description**: {one sentence — what this does and who uses it}

## Tech Stack

| Layer           | Technology  | Version | Purpose    |
| --------------- | ----------- | ------- | ---------- | --------- | --------- | --------- | --------- |
| Runtime         | {node       | python  | go         | etc.}     | {version} | {purpose} |
| Framework       | {framework} | —       | {purpose}  |
| Language        | {typescript | python  | etc.}      | {version} | {purpose} |
| Database        | {postgres   | mysql   | mongo      | sqlite    | none}     | —         | {purpose} |
| ORM/Query       | {prisma     | drizzle | knex       | raw       | none}     | —         | {purpose} |
| Testing         | {vitest     | jest    | playwright | pytest    | etc.}     | —         | {purpose} |
| Build           | {vite       | esbuild | turborepo  | etc.}     | —         | {purpose} |
| Package Manager | {npm        | pnpm    | yarn       | pip       | go mod}   | —         | {purpose} |

## Codebase Structure
```

{project-root}/
├── src/ # Source code
├── tests/ # Test files
├── docs/ # Documentation
├── scripts/ # Utility scripts
├── public/ # Static assets
├── package.json # Dependencies and scripts
└── README.md # Project overview

````

## Key Conventions

### File Naming
- {conventions — e.g., PascalCase for components, kebab-case for utilities}

### Code Style
- {conventions — quotes, semicolons, indentation, line length}

### Architecture Patterns
- {patterns — e.g., module structure, dependency injection, error handling}

## Business Context

### Users & Roles
- **{Role 1}**: {what they do, what they need}
- **{Role 2}**: {what they do, what they need}

### Domain Terms
| Term | Definition |
|------|-----------|
| {term} | {meaning in this project} |

## AI Agent Guidelines

When working with this codebase:

1. **Read before writing** — Explore relevant files before making changes
2. **Follow existing patterns** — Match the project's code style and architecture
3. **Run tests after changes** — Confirm nothing is broken
4. **Update docs when behavior changes** — Keep CONTEXT.md and ARCHITECTURE.md current
5. **Ask before major refactors** — Don't restructure without confirming
6. **Stay in scope** — Only modify files related to the task
7. **Use TypeScript strictly** — No `any`, enable all strict checks
8. **Write tests for new features** — Both unit and integration tests where appropriate

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Environment |
| `DATABASE_URL` | {yes/no} | — | {description} |
| {other vars} | | | |

## Common Commands

```bash
{common commands for this project}
````

````

---

### 2. ARCHITECTURE.md

System design, component relationships, data flows, and tech decisions.

```markdown
# ARCHITECTURE.md

High-level system design, component relationships, data flows, and tech stack decisions. Helps Qwen Code reason about the full system.

**Used in**: Qwen Code CLI, Qwen Code autopilot, multi-agent sessions

---

## System Overview

{one paragraph — what the system does and how it works}

## Architecture Style

{monolith | microservices | monorepo | serverless | event-driven | layered}

### Why This Architecture?

{brief rationale for architectural decisions}

## Component Diagram

````

{text-based diagram showing layers — client, API, services, data}

```

## Directory Structure

```

{detailed directory tree with comments explaining each folder}

```

## Module Pattern

Each feature module follows this pattern:

```

module/
├── module.controller.ts # HTTP request handlers
├── module.service.ts # Business logic
├── module.repository.ts # Data access layer
├── module.types.ts # Module-specific types
└── module.test.ts # Tests

```

### Layer Responsibilities

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Controller** | {responsibility} | {example} |
| **Service** | {responsibility} | {example} |
| **Repository** | {responsibility} | {example} |

## Data Flow

### Request Flow

```

Client → [Middleware] → Controller → Service → Repository → Database → Response

````

## Tech Stack Decisions

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| {decision} | {choice} | {alternatives} | {why} |

## External Integrations

| Service | Purpose | SDK/Library | Auth Method |
|---------|---------|-------------|-------------|
| {service} | {purpose} | {library} | {auth} |

## Error Handling

### Error Response Format

```json
{error response structure}
````

## Security Considerations

- {security practices relevant to this project}

## Development Environment

### Local Setup

```bash
{setup commands}
```

### Required Services

- {services needed — database, cache, etc. with ports}

````

---

### 3. CONTRIBUTING.md

Coding standards, commit conventions, and PR process.

```markdown
# CONTRIBUTING.md

Contribution guidelines — coding standards, commit conventions, and PR process. AI uses this to match your team's patterns.

---

## Getting Started

```bash
{setup commands}
````

## Code Style

- {style guidelines specific to this project}

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:

```
feat(auth): add JWT refresh token flow
fix(api): handle null user in profile endpoint
docs: update ARCHITECTURE.md with new service layer
```

## Pull Request Process

1. Create a feature branch: `git checkout -b feat/feature-name`
2. Make changes with tests
3. Commit with conventional commit messages
4. Push and create PR
5. Ensure all CI checks pass

### PR Requirements

- [ ] Description of changes
- [ ] Tests added/updated
- [ ] Documentation updated if behavior changed
- [ ] Conventional commit messages

## Testing

```bash
{test commands}
```

## Code Review Guidelines

- {review standards specific to this project}

````

---

### 4. AGENTS.md

Instructions for autonomous AI agents — tools, decision rules, boundaries.

```markdown
# AGENTS.md

Instructions for autonomous AI agents working on this project. Defines tools available, decision rules, and operational boundaries.

**Used in**: Qwen Code multi-agent sessions, autopilot pipelines, agentic workflows

---

## Common Commands

### Building

```bash
{build commands}
````

### Testing

```bash
{test commands and gotchas}
```

### Linting & Formatting

```bash
{lint and format commands}
```

## Code Conventions

- **Module system**: {ESM | CommonJS}
- **TypeScript**: {strict mode settings}
- **Formatting**: {prettier/eslint config summary}
- **Tests**: {test file location convention}
- **Commits**: {commit message convention}

## Testing, Debugging, and Bug Fixes

- {project-specific testing guidance}
- {debugging tips for this stack}

## Project Structure Decisions

- {key architectural decisions that agents should know}

## AI Agent Boundaries

When working autonomously:

1. **Scope**: Only modify files related to the assigned task
2. **Safety**: Never modify production config, secrets, or CI pipelines without approval
3. **Verification**: Always run tests after changes
4. **Documentation**: Update docs when behavior changes
5. **Communication**: Report blockers, don't silently skip them

````

---

### 5. TASKS.md

Tracked task list with status, priority, and description.

```markdown
# TASKS.md

Tracked task list for this project. AI agents read this to know what to work on next.

---

## Legend

- [ ] Not started
- [🔄] In progress
- [✅] Complete
- [⏸] Blocked

## Priority Levels

- **P0**: Critical — system broken without this
- **P1**: High — major feature missing
- **P2**: Medium — nice to have
- **P3**: Low — polish, edge cases

## Tasks

### Phase 1 — Foundation

- [ ] {task} — P{priority} — {assignee} — {description}

### Phase 2 — Core Features

- [ ] {task} — P{priority} — {assignee} — {description}

### Phase 3 — Polish & Deploy

- [ ] {task} — P{priority} — {assignee} — {description}
````

---

### 6. SECURITY.md

Security policies, AI tool permissions, data access rules.

```markdown
# SECURITY.md

Security policies and notes on what AI tools are/aren't permitted to access. Governs AI tool permissions and data access.

---

## Security Policies

- **Secrets management**: All secrets via environment variables, never in code
- **API keys**: Rotate every {period}, store in {vault/service}
- **Database access**: Least-privilege credentials for AI agents
- **Code scanning**: Run {security tool} on every PR

## AI Tool Permissions

The following operations require explicit user approval:

- **Allowed without approval**: Read code, run tests, suggest fixes in development
- **Requires approval**: Modify CI/CD pipelines, change production config, delete data
- **Never allowed**: Commit secrets, expose credentials, bypass security middleware

## Responsible Disclosure

Report security issues to: {contact}

## Sensitive Areas

- {project-specific sensitive files and directories}
```

---

### 7. GLOSSARY.md

Domain-specific terms and definitions.

```markdown
# GLOSSARY.md

Domain-specific terms and definitions. Prevents AI from misinterpreting jargon unique to this project.

---

## Terms

| Term   | Definition      | Usage                      |
| ------ | --------------- | -------------------------- |
| {term} | {what it means} | {example of how it's used} |
```

---

### 8. CHANGELOG.md

Versioned log of changes (initialize with v0.1.0).

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Initial project setup
- {key features from the idea}

### Changed

- Nothing yet

### Fixed

- Nothing yet
```

---

## Generation Order

Generate files in this order (each builds on the previous):

1. **CONTEXT.md** — Foundation (identity, stack, conventions)
2. **ARCHITECTURE.md** — System design (depends on CONTEXT for stack)
3. **CONTRIBUTING.md** — Team conventions (depends on ARCHITECTURE structure)
4. **AGENTS.md** — AI agent rules (depends on all above)
5. **TASKS.md** — Work items (depends on ARCHITECTURE scope)
6. **SECURITY.md** — Security policies (depends on stack and integrations)
7. **GLOSSARY.md** — Domain terms (depends on CONTEXT business context)
8. **CHANGELOG.md** — Change log (standalone, but references initial features)

## Quality Rules

1. **Never output placeholders** — Every value should be filled based on the user's idea or reasonable defaults
2. **Cross-reference files** — TASKS.md should reference ARCHITECTURE modules, AGENTS.md should reference CONTRIBUTING conventions
3. **Be specific** — Use actual technology names, real commands, concrete examples
4. **Match the project type** — A CLI tool needs different sections than a web app; a monorepo needs different structure than a single package
5. **Keep it lean** — Each file should be dense with useful information, not padded with generic advice
6. **Update existing files** — If a file already exists, merge new info rather than overwriting

## Output Location

Write all files to the project root directory (alongside `package.json`, `README.md`, etc.). If the project uses a `.qwen/` or `docs/` folder for documentation, place them there instead — ask the user if unsure.
