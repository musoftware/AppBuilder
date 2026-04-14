/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { AuthType } from '@qwen-code/qwen-code-core';
import { resolveCliGenerationConfig } from './modelConfigUtils.js';
import type { Settings } from '../config/settings.js';

/**
 * Integration-style checks: active apiProfiles must flow into resolveModelConfig
 * so the CLI uses the selected account without extra flags.
 */
describe('resolveCliGenerationConfig (multi API profile / active account)', () => {
  const baseSettings = {
    model: { name: 'gpt-4' },
    security: {
      auth: {
        apiKey: 'flat-key',
        baseUrl: 'https://flat.example.com',
        apiProfiles: {
          activeProfileId: 'work',
          profiles: [
            {
              id: 'work',
              name: 'Work',
              apiKey: 'work-key',
              baseUrl: 'https://work.example.com',
            },
            {
              id: 'personal',
              name: 'Personal',
              apiKey: 'personal-key',
              baseUrl: 'https://personal.example.com',
            },
          ],
        },
      },
    },
  } as Settings;

  it('uses the active profile key and base URL over flat settings', () => {
    const result = resolveCliGenerationConfig({
      argv: {},
      settings: baseSettings,
      selectedAuthType: AuthType.USE_OPENAI,
      env: {},
    });
    expect(result.apiKey).toBe('work-key');
    expect(result.baseUrl).toBe('https://work.example.com');
  });

  it('switches resolved credentials when activeProfileId changes', () => {
    const other: Settings = {
      ...baseSettings,
      security: {
        auth: {
          ...baseSettings.security!.auth!,
          apiProfiles: {
            activeProfileId: 'personal',
            profiles: baseSettings.security!.auth!.apiProfiles!.profiles,
          },
        },
      },
    } as Settings;

    const r1 = resolveCliGenerationConfig({
      argv: {},
      settings: baseSettings,
      selectedAuthType: AuthType.USE_OPENAI,
      env: {},
    });
    const r2 = resolveCliGenerationConfig({
      argv: {},
      settings: other,
      selectedAuthType: AuthType.USE_OPENAI,
      env: {},
    });
    expect(r1.apiKey).toBe('work-key');
    expect(r2.apiKey).toBe('personal-key');
    expect(r2.baseUrl).toBe('https://personal.example.com');
  });
});
