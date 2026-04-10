/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  AutopilotActionReturn,
  CommandContext,
  SlashCommand,
} from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';

/**
 * Built-in slash commands that queue a single autopilot message embedding the
 * matching `.qwen/skills/<id>/SKILL.md` playbook (see AutopilotDriver.skillWorkflow).
 *
 * Descriptions are aligned with each skill’s frontmatter `description` field.
 */
const SKILL_WORKFLOW_DEFINITIONS: ReadonlyArray<{
  readonly id: string;
  readonly description: string;
}> = [
  {
    id: 'e2e-testing',
    description:
      'Run the e2e-testing skill — CLI headless runs, MCP testing, API traffic inspection',
  },
  {
    id: 'structured-debugging',
    description:
      'Run the structured-debugging skill — hypothesis-driven debugging for hard bugs',
  },
  {
    id: 'docs-audit-and-refresh',
    description:
      'Run the docs-audit-and-refresh skill — audit docs/ against the codebase and refresh pages',
  },
  {
    id: 'docs-update-from-diff',
    description:
      'Run the docs-update-from-diff skill — sync official docs/ with local git changes',
  },
  {
    id: 'terminal-capture',
    description:
      'Run the terminal-capture skill — terminal UI screenshot automation for CLI output',
  },
  {
    id: 'qwen-code-claw',
    description:
      'Run the qwen-code-claw skill — code understanding, features, fixes, and refactors',
  },
  {
    id: 'cross-platform-shell',
    description:
      'Run the cross-platform-shell skill — portable CLI commands (Windows vs Linux, no duplicate triples)',
  },
] as const;

function makeSkillWorkflowCommand(
  id: string,
  description: string,
): SlashCommand {
  return {
    name: id,
    get description() {
      return t(description);
    },
    kind: CommandKind.BUILT_IN,
    action: async (
      _context: CommandContext,
      _args: string,
    ): Promise<AutopilotActionReturn> => ({
      type: 'autopilot',
      mode: 'skill',
      initialIdea: id,
    }),
  };
}

export const skillWorkflowCommands: SlashCommand[] =
  SKILL_WORKFLOW_DEFINITIONS.map((def) =>
    makeSkillWorkflowCommand(def.id, def.description),
  );
