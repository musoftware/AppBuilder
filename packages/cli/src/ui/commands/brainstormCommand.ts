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

export const brainstormCommand: SlashCommand = {
  name: 'brainstorm',
  get description() {
    return t(
      'Start autopilot brainstorm: plan with skills, then queue tasks (same UI as /prod-style flags)',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (
    _context: CommandContext,
    args: string,
  ): Promise<AutopilotActionReturn> => {
    const trimmed = args.trim();
    return {
      type: 'autopilot',
      initialIdea: trimmed.length > 0 ? trimmed : undefined,
    };
  },
};
