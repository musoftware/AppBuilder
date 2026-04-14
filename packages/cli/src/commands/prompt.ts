/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Argv, CommandModule } from 'yargs';
import { buildPlanScaffoldPrompt } from './prompt/buildPlanScaffoldPrompt.js';
import { writeStderrLine, writeStdoutLine } from '../utils/stdioHelpers.js';

const planCommand: CommandModule<
  Record<string, unknown>,
  { idea?: string | string[] }
> = {
  command: 'plan <idea..>',
  describe:
    'Print the full-stack project scaffold prompt with your idea embedded (for pasting into an LLM).',
  builder: (yargs: Argv) =>
    yargs
      .positional('idea', {
        describe:
          'What you want to build (all words after "plan" are joined into one idea).',
        type: 'string',
      })
      .version(false),
  handler: (argv) => {
    const raw = argv['idea'];
    const parts = Array.isArray(raw) ? raw : raw !== undefined ? [raw] : [];
    const joined = parts.join(' ').trim();
    if (!joined) {
      writeStderrLine(
        'Error: Missing project idea. Example: qwen prompt plan a SaaS billing dashboard',
      );
      process.exit(1);
    }
    writeStdoutLine(buildPlanScaffoldPrompt(joined));
  },
};

export const promptCommand: CommandModule = {
  command: 'prompt',
  describe: 'Utilities for assembling LLM prompts from the CLI.',
  builder: (yargs: Argv) =>
    yargs
      .command(planCommand)
      .demandCommand(1, 'Choose a prompt subcommand (try: plan).')
      .version(false),
  handler: () => {
    /* Subcommands handle execution. */
  },
};
