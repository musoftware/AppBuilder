/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Argv, CommandModule } from 'yargs';
import { buildAddFeaturePrompt } from './prompt/buildAddFeaturePrompt.js';
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

const featureCommand: CommandModule<
  Record<string, unknown>,
  { request?: string | string[] }
> = {
  command: 'feature <request..>',
  describe:
    'Print the full "add feature to existing codebase" prompt with your request embedded (for pasting into an LLM).',
  builder: (yargs: Argv) =>
    yargs
      .positional('request', {
        describe:
          'What to build (all words after "feature" are joined into one request).',
        type: 'string',
      })
      .version(false),
  handler: (argv) => {
    const raw = argv['request'];
    const parts = Array.isArray(raw) ? raw : raw !== undefined ? [raw] : [];
    const joined = parts.join(' ').trim();
    if (!joined) {
      writeStderrLine(
        'Error: Missing feature request. Example: qwen prompt feature add CSV export to the reports page',
      );
      process.exit(1);
    }
    writeStdoutLine(buildAddFeaturePrompt(joined));
  },
};

export const promptCommand: CommandModule = {
  command: 'prompt',
  describe: 'Utilities for assembling LLM prompts from the CLI.',
  builder: (yargs: Argv) =>
    yargs
      .command(planCommand)
      .command(featureCommand)
      .demandCommand(1, 'Choose a prompt subcommand (try: plan or feature).')
      .version(false),
  handler: () => {
    /* Subcommands handle execution. */
  },
};
