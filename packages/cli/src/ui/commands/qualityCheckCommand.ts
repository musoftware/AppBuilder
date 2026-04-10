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

export const qualityCheckCommand: SlashCommand = {
  name: 'quality-check',
  get description() {
    return t(
      'Run autopilot quality check — analyze and fix bugs in the current project',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (
    _context: CommandContext,
    _args: string,
  ): Promise<AutopilotActionReturn> => ({ type: 'autopilot', mode: 'quality-check' }),
};
