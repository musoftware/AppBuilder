/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule, Argv } from 'yargs';
import {
  handleQwenAuth,
  runInteractiveAuth,
  showAuthStatus,
} from './auth/handler.js';
import { t } from '../i18n/index.js';

// Define subcommands separately
const qwenOauthCommand = {
  command: 'qwen-oauth',
  describe: t('Authenticate using Qwen OAuth'),
  handler: async () => {
    await handleQwenAuth('qwen-oauth', {});
  },
};

const codePlanCommand = {
  command: 'coding-plan',
  describe: t('Authenticate using Alibaba Cloud Coding Plan'),
  builder: (yargs: Argv) =>
    yargs
      .option('region', {
        alias: 'r',
        describe: t('Region for Coding Plan (china/global)'),
        type: 'string',
      })
      .option('key', {
        alias: 'k',
        describe: t('API key for Coding Plan'),
        type: 'string',
      }),
  handler: async (argv: { region?: string; key?: string }) => {
    const region = argv['region'] as string | undefined;
    const key = argv['key'] as string | undefined;

    // If region and key are provided, use them directly
    if (region && key) {
      await handleQwenAuth('coding-plan', { region, key });
    } else {
      // Otherwise, prompt interactively
      await handleQwenAuth('coding-plan', {});
    }
  },
};

const statusCommand = {
  command: 'status',
  describe: t('Show current authentication status'),
  handler: async () => {
    await showAuthStatus();
  },
};

const logoutCommand = {
  command: 'logout',
  describe: t('Logout from Qwen OAuth account(s)'),
  builder: (yargs: Argv) =>
    yargs.option('all', {
      alias: 'a',
      describe: t('Logout all Qwen OAuth accounts'),
      type: 'boolean',
      default: false,
    }),
  handler: async (argv: { all?: boolean }) => {
    await handleQwenAuth('logout', {
      all: argv['all'],
    });
  },
};

export const authCommand: CommandModule = {
  command: 'auth',
  describe: t(
    'Configure Qwen authentication information with Qwen-OAuth or Alibaba Cloud Coding Plan',
  ),
  builder: (yargs: Argv) =>
    yargs
      .command(qwenOauthCommand)
      .command(codePlanCommand)
      .command(statusCommand)
      .command(logoutCommand)
      .demandCommand(0) // Don't require a subcommand
      .version(false),
  handler: async () => {
    // This handler is for when no subcommand is provided - show interactive menu
    await runInteractiveAuth();
  },
};
