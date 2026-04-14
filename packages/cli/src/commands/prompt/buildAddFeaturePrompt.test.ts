/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildAddFeaturePrompt } from './buildAddFeaturePrompt.js';

describe('buildAddFeaturePrompt', () => {
  it('embeds the request with JSON quoting and includes add-feature instructions', () => {
    const out = buildAddFeaturePrompt('  export invoices to PDF  ');
    expect(out.startsWith('=======\n')).toBe(true);
    expect(out).toContain(
      'The user wants to add the following feature: ' +
        JSON.stringify('export invoices to PDF'),
    );
    expect(out).toContain('## AUTOMATIC INFERENCE RULES');
    expect(out).toContain('docs/CHANGELOG.md');
    expect(out).toContain(
      'Now begin. Output every file. Full content. No skipping.',
    );
  });

  it('escapes quotes in the user request', () => {
    const out = buildAddFeaturePrompt('say "hello"');
    expect(out).toContain(JSON.stringify('say "hello"'));
  });

  it('throws when the request is empty after trim', () => {
    expect(() => buildAddFeaturePrompt('   ')).toThrow(
      'buildAddFeaturePrompt: feature request must not be empty.',
    );
  });
});
