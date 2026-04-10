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

export const prodReadyCommand: SlashCommand = {
  name: 'prod-ready',
  get description() {
    return t(
      'Run the 7-phase production readiness chain: Analyst → Builder → Completer → Test Writer → Test Analyzer → Fixer → Prod Check. Loops until ready (optional: /prod-ready <focus>)',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (
    _context: CommandContext,
    args: string,
  ): Promise<AutopilotActionReturn> => {
    const focus = args.trim();
    return {
      type: 'autopilot',
      mode: 'prod-ready',
      initialIdea: focus.length > 0 ? focus : undefined,
    };
  },
};
