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
  const plan = promptSlashCommand.subCommands?.find((c) => c.name === 'plan');
  const feature = promptSlashCommand.subCommands?.find(
    (c) => c.name === 'feature',
  );
  const mockContext: CommandContext = createMockCommandContext({});

  it('parses /prompt plan <idea> via parseSlashCommand', () => {
    const commands = [promptSlashCommand] as const;
    const parsed = parseSlashCommand('/prompt plan a billing SaaS', commands);
    expect(parsed.commandToExecute?.name).toBe('plan');
    expect(parsed.args).toBe('a billing SaaS');
    expect(parsed.canonicalPath).toEqual(['prompt', 'plan']);
  });

  it('parses /prompt feature <request> via parseSlashCommand', () => {
    const commands = [promptSlashCommand] as const;
    const parsed = parseSlashCommand(
      '/prompt feature OAuth2 login for admins',
      commands,
    );
    expect(parsed.commandToExecute?.name).toBe('feature');
    expect(parsed.args).toBe('OAuth2 login for admins');
    expect(parsed.canonicalPath).toEqual(['prompt', 'feature']);
  });

  it('returns submit_prompt with wrapped scaffold text', async () => {
    if (!plan?.action) {
      throw new Error('prompt plan subcommand must have an action');
    }
    const result = await plan.action(mockContext, '  an inventory tool  ');
    expect(result).toMatchObject({ type: 'submit_prompt' });
    if (result?.type !== 'submit_prompt') {
      throw new Error('expected submit_prompt');
    }
    expect(result).toHaveProperty(
      'content.0.text',
      expect.stringContaining('=======\n'),
    );
    expect(result).toHaveProperty(
      'content.0.text',
      expect.stringContaining('"an inventory tool"'),
    );
    expect(result).toHaveProperty(
      'content.0.text',
      expect.stringContaining('Now begin. Output every file.'),
    );
  });

  it('returns submit_prompt with wrapped add-feature text', async () => {
    if (!feature?.action) {
      throw new Error('prompt feature subcommand must have an action');
    }
    const result = await feature.action(mockContext, '  add webhook retries  ');
    expect(result).toMatchObject({ type: 'submit_prompt' });
    if (result?.type !== 'submit_prompt') {
      throw new Error('expected submit_prompt');
    }
    expect(result).toHaveProperty(
      'content.0.text',
      expect.stringContaining('=======\n'),
    );
    expect(result).toHaveProperty(
      'content.0.text',
      expect.stringContaining('"add webhook retries"'),
    );
    expect(result).toHaveProperty(
      'content.0.text',
      expect.stringContaining('The user wants to add the following feature:'),
    );
    expect(result).toHaveProperty(
      'content.0.text',
      expect.stringContaining('docs/CHANGELOG.md'),
    );
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

  it('errors when feature request is missing', async () => {
    if (!feature?.action) {
      throw new Error('prompt feature subcommand must have an action');
    }
    const result = await feature.action(mockContext, '   \u200B  ');
    expect(result).toEqual({
      type: 'message',
      messageType: 'error',
      content:
        'Missing feature request after `/prompt feature`. Example: `/prompt feature add dark mode to settings`.',
    });
  });
});
