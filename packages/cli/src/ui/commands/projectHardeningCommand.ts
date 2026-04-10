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

export const projectHardeningCommand: SlashCommand = {
  name: 'project-hardening',
  get description() {
    return t(
      '9-phase project hardening: 3× understand, 3× bugs/gaps/fix, 3× tests/verify/complete (optional: /project-hardening <focus>)',
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
      mode: 'project-hardening',
      initialIdea: focus.length > 0 ? focus : undefined,
    };
  },
};
