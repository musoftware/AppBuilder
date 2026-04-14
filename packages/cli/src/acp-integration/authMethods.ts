/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '@qwen-code/qwen-code-core';
import type { AuthMethod } from '@agentclientprotocol/sdk';

export function buildAuthMethods(): AuthMethod[] {
  return [
    {
      id: AuthType.USE_OPENAI,
      name: 'Use OpenAI API key',
      description: 'Requires setting the `OPENAI_API_KEY` environment variable',
      _meta: {
        type: 'terminal',
        args: ['--auth-type=openai'],
      },
    },
    {
      id: AuthType.QWEN_OAUTH,
      name: 'Qwen OAuth',
      description:
        'OAuth authentication for Qwen models with free daily requests (ending 2026-04-15)',
      _meta: {
        type: 'terminal',
        args: ['--auth-type=qwen-oauth'],
      },
    },
    {
      id: AuthType.OPENAI_CODEX,
      name: 'OpenAI Codex (ChatGPT OAuth)',
      description:
        'Device login via auth.openai.com (same flow as the official Codex CLI); run `qwen auth codex-openai` first',
      _meta: {
        type: 'terminal',
        args: ['--auth-type=openai-codex'],
      },
    },
  ];
}

export function filterAuthMethodsById(
  authMethods: AuthMethod[],
  authMethodId: string,
): AuthMethod[] {
  return authMethods.filter((method) => method.id === authMethodId);
}

export function pickAuthMethodsForDetails(details?: string): AuthMethod[] {
  const authMethods = buildAuthMethods();
  if (!details) {
    return authMethods;
  }
  if (details.includes('qwen-oauth') || details.includes('Qwen OAuth')) {
    const narrowed = filterAuthMethodsById(authMethods, AuthType.QWEN_OAUTH);
    return narrowed.length ? narrowed : authMethods;
  }
  if (
    details.includes('openai-codex') ||
    details.includes('Codex') ||
    details.includes('ChatGPT')
  ) {
    const narrowed = filterAuthMethodsById(authMethods, AuthType.OPENAI_CODEX);
    return narrowed.length ? narrowed : authMethods;
  }
  return authMethods;
}
