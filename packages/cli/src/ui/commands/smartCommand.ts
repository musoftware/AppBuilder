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

export const smartCommand: SlashCommand = {
  name: 'smart',
  get description() {
    return t(
      'Smart orchestrator: reads .project-brain/, selects skills, runs them in order (same as --smart).',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (
    _context: CommandContext,
    _args: string,
  ): Promise<AutopilotActionReturn> => ({
    type: 'autopilot',
    mode: 'smart',
  }),
};

export const brainSkillCommand: SlashCommand = {
  name: 'skill',
  get description() {
    return t(
      'Run one project-brain skill. Usage: /skill <name> (e.g. audit-frontend, prod-gate).',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (
    _context: CommandContext,
    args: string,
  ): Promise<AutopilotActionReturn> => ({
    type: 'autopilot',
    mode: 'brain-skill',
    initialIdea: args.trim().length > 0 ? args.trim() : undefined,
  }),
};
