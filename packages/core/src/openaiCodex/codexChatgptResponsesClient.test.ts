/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildCodexResponsesRequestBody } from './codexChatgptResponsesClient.js';

describe('buildCodexResponsesRequestBody', () => {
  it('uses input_text for user and output_text for assistant history', () => {
    const body = buildCodexResponsesRequestBody({
      model: 'codex-test',
      messages: [
        { role: 'system', content: 'Be helpful' },
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'Hello' },
      ],
    });

    const input = body['input'] as Array<{
      type?: string;
      role?: string;
      content?: Array<{ type?: string; text?: string }>;
    }>;

    expect(Array.isArray(input)).toBe(true);
    const userItem = input.find((i) => i.role === 'user');
    const assistantItem = input.find((i) => i.role === 'assistant');
    expect(userItem?.content).toEqual([{ type: 'input_text', text: 'hi' }]);
    expect(assistantItem?.content).toEqual([
      { type: 'output_text', text: 'Hello' },
    ]);
  });
});
