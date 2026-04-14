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

export const readyProductionCommand: SlashCommand = {
  name: 'ready-production',
  get description() {
    return t(
      'Repeat full-chain → frontend-audit → quality-check per round (default 5 rounds; set QWEN_READY_PRODUCTION_ROUNDS). Headless run stops early when prod + frontend gates look green unless QWEN_READY_PRODUCTION_EXIT_WHEN_READY=0.',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (
    _context: CommandContext,
    _args: string,
  ): Promise<AutopilotActionReturn> => ({
    type: 'autopilot',
    mode: 'ready-production',
  }),
};
