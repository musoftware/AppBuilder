/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildPlanScaffoldPrompt } from './buildPlanScaffoldPrompt.js';

describe('buildPlanScaffoldPrompt', () => {
  it('embeds the idea with JSON quoting and includes scaffold instructions', () => {
    const out = buildPlanScaffoldPrompt('  a CRM for dentists  ');
    expect(out.startsWith('=======\n')).toBe(true);
    expect(out).toContain(
      'The user wants to build: ' + JSON.stringify('a CRM for dentists'),
    );
    expect(out).toContain('## AUTOMATIC INFERENCE RULES');
    expect(out).toContain('docs/adr/001-initial-architecture.md');
    expect(out).toContain(
      'Now begin. Output every file. Full content. No skipping.',
    );
  });

  it('escapes quotes in the user idea', () => {
    const out = buildPlanScaffoldPrompt('say "hello"');
    expect(out).toContain(JSON.stringify('say "hello"'));
  });
});
