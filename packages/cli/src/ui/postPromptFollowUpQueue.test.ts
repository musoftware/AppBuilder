/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { buildPostUserPromptFollowUpMessages } from './postPromptFollowUpQueue.js';
import type { LoadedSettings } from '../config/settings.js';

function minimalSettings(
  overrides: Partial<LoadedSettings['merged']> = {},
): LoadedSettings {
  return {
    merged: {
      ui: {},
      autopilot: {},
      ...overrides,
    },
  } as LoadedSettings;
}

describe('buildPostUserPromptFollowUpMessages', () => {
  it('returns empty when disabled', async () => {
    const s = minimalSettings({
      ui: { postPromptFollowUp: { enabled: false } },
    });
    expect(await buildPostUserPromptFollowUpMessages('hello', s)).toEqual([]);
  });

  it('returns empty when setting omitted', async () => {
    const s = minimalSettings();
    expect(await buildPostUserPromptFollowUpMessages('hello', s)).toEqual([]);
  });
});
