/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildPlanScaffoldPrompt } from '../../commands/prompt/buildPlanScaffoldPrompt.js';
import {
  CommandKind,
  type CommandContext,
  type SlashCommand,
  type SlashCommandActionReturn,
} from './types.js';

/** Strips zero-width and other invisible chars that break pasted slash args. */
function normalizePromptArgs(raw: string): string {
  return raw.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

const promptPlanSubcommand: SlashCommand = {
  name: 'plan',
  description:
    'Submit the full-stack scaffold planning prompt with your idea (same as `qwen prompt plan`).',
  kind: CommandKind.BUILT_IN,
  action: async (
    _context: CommandContext,
    args: string,
  ): Promise<SlashCommandActionReturn> => {
    const idea = normalizePromptArgs(args);
    if (!idea) {
      return {
        type: 'message',
        messageType: 'error',
        content:
          'Missing project idea after `/prompt plan`. Example: `/prompt plan a SaaS billing dashboard`.',
      };
    }
    return {
      type: 'submit_prompt',
      content: [{ text: buildPlanScaffoldPrompt(idea) }],
    };
  },
};

export const promptSlashCommand: SlashCommand = {
  name: 'prompt',
  description: 'Wrap text in reusable LLM prompt templates.',
  kind: CommandKind.BUILT_IN,
  subCommands: [promptPlanSubcommand],
};
