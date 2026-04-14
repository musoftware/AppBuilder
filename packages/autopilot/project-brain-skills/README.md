# Project Brain Skills

This directory contains the **bundled skill playbooks** shipped with the CLI. These are the default skills used by autopilot pipelines when the workspace has no `.qwen/skills/` overrides.

## Purpose

Skills here are used by:

- `/prod` pipeline (via `prodQueue.ts`)
- `/full-chain` pipeline (via `fullChainQueue.ts`)
- `/phase` command (for selective phase execution)
- `smart-orchestrator` (for dynamic skill selection)

## Resolution Order

When a skill is requested, the system checks in this order:

1. **Workspace**: `<workspace>/.qwen/skills/<skill-name>/SKILL.md`
   - Project-specific overrides (takes priority)
   - Create this path to customize behavior

2. **Bundled**: `packages/autopilot/project-brain-skills/<skill-name>/SKILL.md` ← **you are here**
   - Default playbooks shipped with the CLI
   - Used when workspace has no override

## Adding a New Skill

1. Create a directory: `<skill-name>/`
2. Create `SKILL.md` with:
   - YAML frontmatter (`name`, `description`)
   - Skill title and description
   - Required sections: `SUMMARY`, `FINDINGS`, `STATE`, `NEXT_SKILLS`
3. Add the skill name to `PROJECT_BRAIN_SKILL_ORDER` in `prodQueue.ts`
4. Run `npm run validate:skills` to verify

## Skill Categories

**Audit skills**: audit-backend, audit-frontend, audit-roles, audit-database
**Build skills**: plan, build, review-implementation, refine, harden
**Test skills**: test-unit, test-integration, test-e2e, test-fix
**Review personas**: review-as-user, review-as-security, review-as-a11y, review-as-mobile, review-as-slow-network, review-as-developer, review-as-performance, review-as-qa, review-as-pm, review-as-data
**Meta skills**: understand, prod-gate, deployment-config
