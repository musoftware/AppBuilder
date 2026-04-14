/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { promptSlashCommand } from './promptSlashCommand.js';
import { parseSlashCommand } from '../../utils/commands.js';
import { createMockCommandContext } from '../../test-utils/mockCommandContext.js';
import type { CommandContext } from './types.js';

describe('promptSlashCommand', () => {
  const plan = promptSlashCommand.subCommands?.[0];
  const mockContext: CommandContext = createMockCommandContext({});

  it('parses /prompt plan <idea> via parseSlashCommand', () => {
    const commands = [promptSlashCommand] as const;
    const parsed = parseSlashCommand('/prompt plan a billing SaaS', commands);
    expect(parsed.commandToExecute?.name).toBe('plan');
    expect(parsed.args).toBe('a billing SaaS');
    expect(parsed.canonicalPath).toEqual(['prompt', 'plan']);
  });

  it('returns submit_prompt with wrapped scaffold text', async () => {
    if (!plan?.action) {
      throw new Error('prompt plan subcommand must have an action');
    }
    const result = await plan.action(mockContext, '  an inventory tool  ');
    expect(result).toMatchObject({ type: 'submit_prompt' });
    if (result?.type === 'submit_prompt') {
      const text = result.content[0]?.text ?? '';
      expect(text).toContain('=======\n');
      expect(text).toContain('"an inventory tool"');
      expect(text).toContain('Now begin. Output every file.');
    }
  });

  it('strips zero-width spaces from args', async () => {
    if (!plan?.action) {
      throw new Error('prompt plan subcommand must have an action');
    }
    const result = await plan.action(mockContext, '\u200B\u200Ba CRM\u200B');
    expect(result).toMatchObject({ type: 'submit_prompt' });
  });

  it('errors when idea is missing', async () => {
    if (!plan?.action) {
      throw new Error('prompt plan subcommand must have an action');
    }
    const result = await plan.action(mockContext, '   \u200B  ');
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content:
        'Missing project idea after `/prompt plan`. Example: `/prompt plan a SaaS billing dashboard`.',
    });
  });
});
