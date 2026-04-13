# Skills System

The skills system enables AI agents to perform complex, multi-step workflows in your project. Skills are reusable playbooks that guide the agent through audit, build, test, and review tasks.

## Overview

A **skill** is a markdown file (`SKILL.md`) that contains instructions for the AI agent. Skills are organized into **pipelines** — ordered sequences of phases that run automatically in autopilot mode.

## Skill Locations

Skills can exist in three locations (resolved in this order):

1. **Workspace skills** — `.qwen/skills/<skill-name>/SKILL.md`
   - Project-specific overrides or custom skills
   - Takes priority over bundled skills

2. **Bundled skills** — `packages/autopilot/project-brain-skills/<skill-name>/SKILL.md`
   - Shipped with the CLI
   - Default playbooks for all built-in pipelines

3. **Legacy bundled** — `packages/autopilot/src/bundled-skills/<skill-name>/SKILL.md`
   - Older location, still supported
   - Will be merged into `project-brain-skills/` in future

### Resolution Order

When a skill is requested:

1. Check workspace `.qwen/skills/<skill-name>/SKILL.md` (if exists)
2. Check bundled `project-brain-skills/<skill-name>/SKILL.md`
3. Return `null` if neither exists

## Skill File Structure

Every `SKILL.md` must have:

### Required Sections

```markdown
---
name: skill-name
description: Short description of what this skill does
---

# Skill Title

Description of the skill's purpose and when to use it.

SUMMARY:
<what was done>
<key findings>
<verdict>

FINDINGS:

- <file:line> — <issue> — <severity>
- ...

STATE:
<current state of the codebase for next skill>

NEXT_SKILLS: skill1, skill2, skill3
```

### Section Purposes

- **SUMMARY** — One-line overview of what was scanned and key finding
- **FINDINGS** — Specific issues with file:line references (no raw code blocks)
- **STATE** — Context for the next skill (what it needs to know)
- **NEXT_SKILLS** — Comma-separated list of skills that should run next (enables dynamic skill discovery)

### Optional Sections

Skills may include additional sections based on their purpose:

- `CRITICAL` / `HIGH PRIORITY` / `MEDIUM` / `LOW` — Prioritized issue lists
- `VERDICT` — `PROD_READY` | `NOT_READY` | `NEEDS_WORK`
- Custom sections specific to the skill's domain

## Creating a Custom Skill

1. Create the skill directory:

   ```bash
   mkdir -p .qwen/skills/my-skill
   ```

2. Create `SKILL.md`:

   ```markdown
   ---
   name: my-skill
   description: My custom skill description
   ---

   # My Skill

   What this skill does and when to use it.

   [Include required sections: SUMMARY, FINDINGS, STATE, NEXT_SKILLS]
   ```

3. The skill is now available for use with `/phase prod my-skill` or other pipelines.

## Built-in Pipelines

### 1. `prod` — Full Production Workflow

The main production pipeline. Runs a series of audit, build, test, and review skills.

**Phases**: understand, scaffold, database-design, api-design, auth-setup, audit-backend, audit-frontend, audit-roles, audit-database, plan, build, review-implementation, refine, harden, test-unit, test-integration, test-e2e, test-fix, review-as-\* (10 personas), deployment-config, prod-gate

**Usage**:

```bash
/phase prod e2e-testing      # Run only e2e-testing skill
/phase prod 1-5              # Run first 5 phases
/phase prod plan,user-stories # Run specific phases by name
```

### 2. `prod-ready` — Production Readiness (7 phases)

A focused pipeline for getting a project production-ready.

| Phase | Name          | Purpose                                    |
| ----- | ------------- | ------------------------------------------ |
| 1     | analyst       | Gap analysis — what exists, what's missing |
| 2     | builder       | Implement missing features                 |
| 3     | completer     | Error handling, edge cases, validation     |
| 4     | test-writer   | Write comprehensive test suite             |
| 5     | test-analyzer | Run tests, categorize failures             |
| 6     | fixer         | Fix bugs, complete missing implementation  |
| 7     | prod-check    | Final production readiness review          |

**Usage**:

```bash
/phase prod-ready 3                    # Run completer phase
/phase prod-ready 3 -- tighten auth    # Phase 3 with focus text
```

### 3. `full-chain` — Complete BMAD Chain (10 phases)

Full documentation → audit → plan → build → test → fix cycle.

| Phase | Name               | Purpose                                              |
| ----- | ------------------ | ---------------------------------------------------- |
| 0     | understander       | Full project understanding (or delta scan if cached) |
| 1     | reverse-brownfield | Generate `.ai-docs/` files                           |
| 2     | analyst            | Code + role + UX + domain + security audit           |
| 3     | planner            | Prioritized implementation plan                      |
| 4     | builder            | Implement all tasks                                  |
| 5     | completer          | Harden everything                                    |
| 6     | test-writer        | Comprehensive test suite                             |
| 7     | test-analyzer      | Run and analyze tests                                |
| 8     | fixer              | Fix failures, complete untested areas                |
| 9     | prod-gate          | Final review                                         |

### 4. `frontend-audit` — Frontend Audit (4 phases)

Focused on frontend quality and completeness.

| Phase | Name                 | Purpose                                         |
| ----- | -------------------- | ----------------------------------------------- |
| 1     | mapper               | Map all screens, routes, components             |
| 2     | fixer                | Fix broken wiring, missing routes, dead buttons |
| 3     | feature-test-writer  | Role access, screen features, regression tests  |
| 4     | test-runner-analyzer | Run tests, fix failures, final gate             |

### 5. `ready-production` — Orchestrated Rounds

Runs multiple rounds of: full-chain → frontend-audit → quality-check.

Default: 5 outer rounds (configurable via `QWEN_READY_PRODUCTION_ROUNDS`).

### 6. `project-hardening` — Bug Sweep & Hardening (9 phases)

Systematic quality improvement.

| Phase | Name                        | Block Label                |
| ----- | --------------------------- | -------------------------- |
| 1     | project-harden-understand-1 | Understand 1/3             |
| 2     | project-harden-understand-2 | Understand 2/3             |
| 3     | project-harden-understand-3 | Understand 3/3             |
| 4     | project-harden-fix-1        | Fix & gaps 1/3             |
| 5     | project-harden-fix-2        | Fix & gaps 2/3             |
| 6     | project-harden-fix-3        | Fix & gaps 3/3             |
| 7     | post-turn-deep-test         | Quality — deep tests 1/3   |
| 8     | post-turn-verify-fix        | Quality — verify & fix 2/3 |
| 9     | post-turn-complete          | Quality — complete 3/3     |

### 7. `quality-check` — Quality Check

Runs tests, fixes failures, adds coverage. Repeats up to 3 passes.

**Aliases**: `1`, `quality`, `qc`, `quality-check`, `check`

## Using the `/phase` Command

The `/phase` command lets you run specific phases or subsets of a pipeline.

### Syntax

```
/phase <pipeline> <n|n-m|name[,name…]> [-- <focus>]
```

### Examples

```bash
# Run phase 4 of prod
/phase prod 4

# Run e2e-testing skill from prod pipeline
/phase prod e2e-testing

# Run phases 2-10 of full-chain
/phase full-chain 2-10

# Run planner phase from full-chain
/phase full-chain planner

# Run phase 3 of prod-ready with focus text
/phase prod-ready 3 -- tighten auth

# Run multiple phases
/phase prod plan,user-stories

# Show help / AI-assisted guidance
/phase
/phase ?
/phase help

# List all available pipelines and phases
/phase --list
```

## Skill Dependencies

Skills can declare dependencies via the `NEXT_SKILLS` section in their output. This enables dynamic skill discovery — when a skill completes, it can recommend which skills should run next.

### How It Works

1. Skill runs and outputs `NEXT_SKILLS: skill1, skill2`
2. System reads the recommendation
3. Next skills are queued if they exist

### Validation

Run `npm run validate:skills` to check:

- All referenced skills have `SKILL.md` files
- Required sections are present
- No syntax errors in skill files

## Environment Variables

| Variable                       | Purpose                                             |
| ------------------------------ | --------------------------------------------------- |
| `QWEN_PROJECT_BRAIN_DIR`       | Override `.project-brain` directory for brain files |
| `QWEN_READY_PRODUCTION_ROUNDS` | Override default 5 rounds for ready-production      |
| `QWEN_FULL_CHAIN_MAX_PASSES`   | Override default 5 passes for full-chain            |
| `QWEN_AUTOPILOT_QUEUE_LOG`     | JSONL log file for autopilot queue                  |

## Best Practices

1. **Use file:line references, not code blocks** — Skills reference files, next skills read them fresh
2. **Include all four required sections** — SUMMARY, FINDINGS, STATE, NEXT_SKILLS
3. **Be specific in findings** — `src/auth.ts:42 — missing input validation — high` not `auth is broken`
4. **Use consistent verdict format** — `PROD_READY` | `NOT_READY` | `NEEDS_WORK`
5. **Declare NEXT_SKILLS** — Enables dynamic skill discovery and proper ordering
6. **Follow existing patterns** — When implementing, match the project's code style
