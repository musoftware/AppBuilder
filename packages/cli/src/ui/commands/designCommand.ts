/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  AutopilotActionReturn,
  CommandContext,
  SlashCommand,
  MessageActionReturn,
} from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';

export const designCommand: SlashCommand = {
  name: 'design',
  get description() {
    return t(
      'Apply a design system to the project via DESIGN.md (e.g. /design cursor, /design stripe, /design notion)',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (
    _context: CommandContext,
    args: string,
  ): Promise<AutopilotActionReturn | MessageActionReturn> => {
    const name = args.trim().toLowerCase();

    if (!name) {
      return {
        type: 'message',
        messageType: 'info',
        content: [
          '**Usage:** `/design <name>`',
          '',
          'Downloads a DESIGN.md into your project and applies it via autopilot.',
          'Any name from https://github.com/VoltAgent/awesome-design-md works.',
          '',
          'Examples: `/design cursor` `/design stripe` `/design notion` `/design vercel`',
        ].join('\n'),
      };
    }

    return {
      type: 'autopilot',
      mode: 'design',
      initialIdea: name,
    };
  },
};
