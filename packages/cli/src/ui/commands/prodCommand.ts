/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  AutopilotActionReturn,
  CommandContext,
  SlashCommand,
} from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';

export const prodCommand: SlashCommand = {
  name: 'prod',
  get description() {
    return t(
      'Take any project to production: auto-detects the stack, audits backend, database, frontend, and roles, fixes issues, adds tests, and re-reports until PROD_READY.',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (
    _context: CommandContext,
    _args: string,
  ): Promise<AutopilotActionReturn> => ({
    type: 'autopilot',
    mode: 'prod',
  }),
};
