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

export const fullChainCommand: SlashCommand = {
  name: 'full-chain',
  get description() {
    return t(
      'Run the complete 10-phase BMAD chain: understand → document → audit (code + business + UX + roles) → plan → build → complete → test → analyze → fix → production gate. Loops until PROD_READY.',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (
    _context: CommandContext,
    _args: string,
  ): Promise<AutopilotActionReturn> => ({
    type: 'autopilot',
    mode: 'full-chain',
  }),
};
