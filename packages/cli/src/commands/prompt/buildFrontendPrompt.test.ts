/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildFrontendPrompt } from './buildFrontendPrompt.js';

describe('buildFrontendPrompt', () => {
  it('embeds the brief with JSON quoting and includes frontend instructions', () => {
    const out = buildFrontendPrompt('  rebuild the settings page tabs  ');
    expect(out.startsWith('=======\n')).toBe(true);
    expect(out).toContain(
      'Implement the following UI goal end-to-end in the codebase: ' +
        JSON.stringify('rebuild the settings page tabs'),
    );
    expect(out).toContain('## AUTOMATIC INFERENCE RULES');
    expect(out).toContain('WCAG AA');
    expect(out).toContain('docs/CHANGELOG.md');
    expect(out).toContain(
      'Now begin. Output every file. Full content. No skipping.',
    );
  });

  it('escapes quotes in the user brief', () => {
    const out = buildFrontendPrompt('label says "Save"');
    expect(out).toContain(JSON.stringify('label says "Save"'));
  });

  it('throws when the brief is empty after trim', () => {
    expect(() => buildFrontendPrompt('   ')).toThrow(
      'buildFrontendPrompt: UI brief must not be empty.',
    );
  });
});
