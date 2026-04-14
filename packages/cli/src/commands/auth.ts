/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule, Argv } from 'yargs';
import { getErrorMessage } from '@qwen-code/qwen-code-core';
import { writeStderrLine } from '../utils/stdioHelpers.js';
import {
  handleGoogleVertexOAuthAuth,
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

const apiKeyAddCommand = {
  command: 'add',
  describe: t('Add a stored OpenAI-compatible API key profile'),
  builder: (yargs: Argv) =>
    yargs
      .option('id', {
        describe: t('Profile id (defaults to a random id if omitted)'),
        type: 'string',
      })
      .option('name', {
        alias: 'n',
        describe: t('Optional display name'),
        type: 'string',
      })
      .option('key', {
        alias: 'k',
        describe: t('API key (omit to enter interactively)'),
        type: 'string',
      })
      .option('base-url', {
        describe: t('Optional base URL for this profile'),
        type: 'string',
      })
      .option('active', {
        alias: 'a',
        describe: t('Make this profile active after saving'),
        type: 'boolean',
        default: false,
      }),
  handler: async (argv: {
    id?: string;
    name?: string;
    key?: string;
    baseUrl?: string;
    active?: boolean;
  }) => {
    await handleQwenAuth('api-key', {
      op: 'add',
      id: argv['id'] as string | undefined,
      name: argv['name'] as string | undefined,
      key: argv['key'] as string | undefined,
      baseUrl: argv['baseUrl'] as string | undefined,
      active: argv['active'] as boolean | undefined,
    });
  },
};

const apiKeyListCommand = {
  command: 'list',
  describe: t('List stored OpenAI-compatible API key profiles'),
  handler: async () => {
    await handleQwenAuth('api-key', { op: 'list' });
  },
};

const apiKeyUseCommand = {
  command: 'use <id>',
  describe: t('Select the active API key profile'),
  builder: (yargs: Argv) =>
    yargs.positional('id', {
      describe: t('Profile id'),
      type: 'string',
      demandOption: true,
    }),
  handler: async (argv: { id: string }) => {
    await handleQwenAuth('api-key', { op: 'use', id: argv['id'] });
  },
};

const apiKeyRemoveCommand = {
  command: 'remove <id>',
  describe: t('Remove a stored API key profile'),
  builder: (yargs: Argv) =>
    yargs.positional('id', {
      describe: t('Profile id'),
      type: 'string',
      demandOption: true,
    }),
  handler: async (argv: { id: string }) => {
    await handleQwenAuth('api-key', { op: 'remove', id: argv['id'] });
  },
};

const apiKeyCommand = {
  command: 'api-key',
  describe: t('Manage stored OpenAI-compatible API keys'),
  builder: (yargs: Argv) =>
    yargs
      .command(apiKeyAddCommand)
      .command(apiKeyListCommand)
      .command(apiKeyUseCommand)
      .command(apiKeyRemoveCommand)
      .demandCommand(1),
  handler: async () => {
    /* handled by subcommands */
  },
};

const oauthAccountListCommand = {
  command: 'list',
  describe: t('List stored Qwen OAuth accounts'),
  handler: async () => {
    await handleQwenAuth('oauth-account', { op: 'list' });
  },
};

const oauthAccountUseCommand = {
  command: 'use <id>',
  describe: t('Select the active Qwen OAuth account (used for API calls)'),
  builder: (yargs: Argv) =>
    yargs.positional('id', {
      describe: t('Account id'),
      type: 'string',
      demandOption: true,
    }),
  handler: async (argv: { id: string }) => {
    await handleQwenAuth('oauth-account', { op: 'use', id: argv['id'] });
  },
};

const oauthAccountRemoveCommand = {
  command: 'remove <id>',
  describe: t('Remove a stored Qwen OAuth account'),
  builder: (yargs: Argv) =>
    yargs.positional('id', {
      describe: t('Account id'),
      type: 'string',
      demandOption: true,
    }),
  handler: async (argv: { id: string }) => {
    await handleQwenAuth('oauth-account', { op: 'remove', id: argv['id'] });
  },
};

const googleVertexOauthCommand = {
  command: 'google-vertex-oauth',
  describe: t(
    'Sign in with Google for Vertex AI Gemini (OAuth). Requires QWEN_GOOGLE_VERTEX_OAUTH_CLIENT_ID, QWEN_GOOGLE_VERTEX_OAUTH_CLIENT_SECRET, GOOGLE_CLOUD_PROJECT, and GOOGLE_CLOUD_LOCATION.',
  ),
  builder: (yargs: Argv) =>
    yargs.option('clear', {
      type: 'boolean',
      default: false,
      describe: t('Remove stored Google OAuth credentials'),
    }),
  handler: async (argv: { clear?: boolean }) => {
    try {
      await handleGoogleVertexOAuthAuth(argv.clear ? 'clear' : 'login');
      process.exit(0);
    } catch (error) {
      writeStderrLine(getErrorMessage(error));
      process.exit(1);
    }
  },
};

const oauthAccountCommand = {
  command: 'oauth-account',
  describe: t('Manage multiple Qwen OAuth logins'),
  builder: (yargs: Argv) =>
    yargs
      .command(oauthAccountListCommand)
      .command(oauthAccountUseCommand)
      .command(oauthAccountRemoveCommand)
      .demandCommand(1),
  handler: async () => {
    /* handled by subcommands */
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
      .command(googleVertexOauthCommand)
      .command(codePlanCommand)
      .command(statusCommand)
      .command(logoutCommand)
      .command(apiKeyCommand)
      .command(oauthAccountCommand)
      .demandCommand(0) // Don't require a subcommand
      .version(false),
  handler: async () => {
    // This handler is for when no subcommand is provided - show interactive menu
    await runInteractiveAuth();
  },
};
