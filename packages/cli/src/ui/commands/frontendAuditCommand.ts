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

export const frontendAuditCommand: SlashCommand = {
  name: 'frontend-audit',
  get description() {
    return t(
      'Audit every frontend screen by role: maps what exists, finds dead buttons / missing guards / broken routes, fixes wiring, then writes and runs feature tests to prove each screen works for the right roles.',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (
    _context: CommandContext,
    _args: string,
  ): Promise<AutopilotActionReturn> => ({
    type: 'autopilot',
    mode: 'frontend-audit',
  }),
};
