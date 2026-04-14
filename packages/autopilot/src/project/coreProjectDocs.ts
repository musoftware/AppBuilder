import fs from 'node:fs/promises';
import path from 'node:path';
import type { ContextSpec, TaskGraph } from '../types.js';

export interface CoreDocsWriteResult {
  /** New files written (did not exist before). */
  created: string[];
  /** Files overwritten or refreshed. */
  updated: string[];
}

/** AI-generated content for the core project documents. */
export interface GeneratedDocs {
  prd: string;
  architecture: string;
  context: string;
  env: string;
}

async function fileExists(absPath: string): Promise<boolean> {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
}

function isoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatList(items: string[], fallback: string): string {
  if (items.length === 0) {
    return fallback;
  }
  return items.map((x) => `- ${x}`).join('\n');
}

export function buildPrdMarkdown(context: ContextSpec): string {
  const stack = formatList(
    context.techStack,
    '_Capture preferred languages, frameworks, and services._',
  );
  const constraints = formatList(
    context.constraints,
    '_None captured yet — add hard requirements here._',
  );

  return `# Product Requirements Document (PRD)

> Seed from MU Code Autopilot (${isoDate()}). Expand sections as the product evolves.

## Product overview & goals

**Idea**

${context.idea}

**Goal**

${context.goal}

## User personas

- _Who uses this? Add roles and needs._

## Features & user stories

- _Break the goal into shippable features._

## Out of scope

- _Explicit non-goals to prevent scope creep._

## Success metrics

- _How you know v1 succeeded._

## Technical context

**Output shape:** ${context.outputFormat}

**Tech stack (initial)**

${stack}

**Constraints**

${constraints}
`;
}

export function buildArchitectureMarkdown(context: ContextSpec): string {
  const stack = formatList(
    context.techStack,
    '_Document chosen stack after decisions._',
  );

  return `# System Architecture

> Seed from MU Code Autopilot (${isoDate()}). Keep this the single map of how the system fits together.

## Tech stack

${stack}

## Folder / project structure

\`\`\`text
/your-project
├── src/          # application code
├── tests/        # automated tests
└── docs/         # optional deeper design notes
\`\`\`

_Adjust to match the real repo layout._

## Data & persistence

- _Database, schema highlights, migrations strategy._

## API design overview

- _REST/GraphQL/RPC — main resources and boundaries._

## Third-party integrations

- _Auth, payments, email, analytics, etc._

## Runtime & deployment

- _How it runs locally and in production._
`;
}

export function buildRulesMarkdown(): string {
  return `# AI & human coding rules

> Conventions for this repository. Keep \`.cursorrules\` in sync when you change critical rules.

## Naming & formatting

- Follow the stack’s idioms and the repo’s formatter/linter settings.
- Prefer clear names over abbreviations.

## Libraries & patterns

- Prefer dependencies already in the project.
- Prefer small, testable modules over large monoliths.

## What to avoid

- Secrets or real credentials in repo files (use env vars; document keys in ENV.md only).
- Unscoped refactors unrelated to the current task.

## Versions

- Record language/runtime versions the project targets (see package files or toolchain).
`;
}

export function buildCursorrulesContent(): string {
  return `You are working in a repo that uses core docs at the root:

- PRD.md — what to build
- ARCHITECTURE.md — how it is structured
- TASKS.md — current work queue (Autopilot syncs the plan here)
- CONTEXT.md — decisions, progress, and session memory (update as you go)
- PROJECT.md — entry point; points to CONTEXT.md for memory
- ENV.md — how to run locally (no secret values)
- CHANGELOG.md — notable changes over time

Rules:
- Read PRD.md and ARCHITECTURE.md before large changes.
- After meaningful progress, update CONTEXT.md (what changed, key decisions) and TASKS.md checkboxes to match reality.
- Follow RULES.md for style and patterns.
- Do not commit secrets; use placeholders in ENV.md.
`;
}

export function buildContextMarkdown(context: ContextSpec): string {
  const clar = JSON.stringify(context.clarifications, null, 2);

  return `# Project context

> Living memory for AI-assisted sessions. Append or edit after each significant session.

## What we are building

${context.idea}

## Current goal

${context.goal}

## Decisions so far

- Autopilot captured initial brainstorm on ${isoDate()}.
- Output format: **${context.outputFormat}**

## Known issues & constraints

${formatList(context.constraints, '- _None listed._')}

## Brainstorm notes (structured)

\`\`\`json
${clar}
\`\`\`
`;
}

export function buildEnvMarkdown(): string {
  return `# Environment & setup

> No secret values — only variable names and how to obtain them.

## Required environment variables

| Variable | Purpose | How to get |
|----------|---------|------------|
| _EXAMPLE_API_KEY_ | _Example_ | _Add real rows_ |

## Local development

1. Install dependencies (_document package manager / runtime_).
2. Copy \`.env.example\` to \`.env\` if present (never commit \`.env\`).
3. Run: _fill in actual commands_

## Deployment

- _Hosting target, build command, release checklist._
`;
}

export function buildChangelogMarkdown(): string {
  return `# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added

- Initial core documentation scaffold (${isoDate()}) via MU Code Autopilot.
`;
}

export function buildProjectIndexMarkdown(): string {
  return `# Project

Use **CONTEXT.md** for living session memory, decisions, and what has been built so far.
This file is a short entry point so tools that expect \`PROJECT.md\` still land in the right place.
`;
}

export function buildTasksMarkdown(
  context: ContextSpec,
  graph: TaskGraph,
): string {
  const lines = graph.tasks.map((t, i) => {
    const skill = t.skill ? ` \`@${t.skill.name}\`` : '';
    return `${i + 1}. [ ] **${t.title}** (\`${t.id}\`)${skill}\n   - ${t.description.replace(/\n+/g, ' ').trim()}`;
  });

  return `# Task breakdown

> **Autopilot sync:** this file is refreshed when a new plan is generated (${isoDate()}).  
> Mark items \`[x]\` as you complete them; keep CONTEXT.md updated with decisions.

**Related:** PRD.md · ARCHITECTURE.md · CONTEXT.md

## Phased milestones

_Use this section for higher-level phases if you split work beyond the list below._

## Current autopilot plan

${lines.join('\n\n')}

## Later / backlog

- _Ideas not in the current plan._
`;
}

async function writeIfAbsent(
  root: string,
  relative: string,
  body: string,
  created: string[],
): Promise<void> {
  const abs = path.join(root, relative);
  if (await fileExists(abs)) {
    return;
  }
  await fs.writeFile(abs, body, 'utf8');
  created.push(relative);
}

/**
 * Writes the recommended “core documents” layout under the workspace root.
 * Existing PRD/ARCH/RULES/etc. are left untouched so manual edits are preserved.
 * TASKS.md is always regenerated from the current task graph.
 * When `generated` is provided its AI-produced content is used instead of the
 * static template builders for PRD, ARCHITECTURE, CONTEXT and ENV.
 */
export async function writeCoreProjectDocs(
  workspaceRoot: string | undefined,
  context: ContextSpec,
  graph: TaskGraph,
  generated?: GeneratedDocs,
): Promise<CoreDocsWriteResult> {
  const created: string[] = [];
  const updated: string[] = [];

  if (!workspaceRoot) {
    return { created, updated };
  }

  const root = path.resolve(workspaceRoot);

  await writeIfAbsent(
    root,
    'PRD.md',
    generated?.prd ?? buildPrdMarkdown(context),
    created,
  );
  await writeIfAbsent(
    root,
    'ARCHITECTURE.md',
    generated?.architecture ?? buildArchitectureMarkdown(context),
    created,
  );
  await writeIfAbsent(root, 'RULES.md', buildRulesMarkdown(), created);
  await writeIfAbsent(root, '.cursorrules', buildCursorrulesContent(), created);
  await writeIfAbsent(
    root,
    'CONTEXT.md',
    generated?.context ?? buildContextMarkdown(context),
    created,
  );
  await writeIfAbsent(root, 'PROJECT.md', buildProjectIndexMarkdown(), created);
  await writeIfAbsent(
    root,
    'ENV.md',
    generated?.env ?? buildEnvMarkdown(),
    created,
  );
  await writeIfAbsent(root, 'CHANGELOG.md', buildChangelogMarkdown(), created);

  const tasksPath = path.join(root, 'TASKS.md');
  const hadTasks = await fileExists(tasksPath);
  await fs.writeFile(tasksPath, buildTasksMarkdown(context, graph), 'utf8');
  if (hadTasks) {
    updated.push('TASKS.md');
  } else {
    created.push('TASKS.md');
  }

  return { created, updated };
}
