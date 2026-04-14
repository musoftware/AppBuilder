/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { isLikelyNewFeatureOrImplementationRequest } from './postPromptFollowUpTrigger.js';

describe('isLikelyNewFeatureOrImplementationRequest', () => {
  it('returns false for short or ack-only messages', () => {
    expect(isLikelyNewFeatureOrImplementationRequest('ok')).toBe(false);
    expect(isLikelyNewFeatureOrImplementationRequest('thanks')).toBe(false);
    expect(isLikelyNewFeatureOrImplementationRequest('yes')).toBe(false);
  });

  it('returns false for pure explanatory questions', () => {
    expect(
      isLikelyNewFeatureOrImplementationRequest(
        'What is the purpose of this module?',
      ),
    ).toBe(false);
    expect(
      isLikelyNewFeatureOrImplementationRequest(
        'How does the config merge work?',
      ),
    ).toBe(false);
    expect(
      isLikelyNewFeatureOrImplementationRequest('Explain the autopilot queue'),
    ).toBe(false);
  });

  it('returns true for implementation / new feature phrasing', () => {
    expect(
      isLikelyNewFeatureOrImplementationRequest(
        'Please add a new slash command for exporting history',
      ),
    ).toBe(true);
    expect(
      isLikelyNewFeatureOrImplementationRequest(
        'Implement OAuth refresh in the CLI auth flow',
      ),
    ).toBe(true);
    expect(
      isLikelyNewFeatureOrImplementationRequest(
        'We need to build a new feature for workspace trust prompts',
      ),
    ).toBe(true);
    expect(
      isLikelyNewFeatureOrImplementationRequest(
        'Can you create an API endpoint for listing skills',
      ),
    ).toBe(true);
  });

  it('returns true when a question includes build intent', () => {
    expect(
      isLikelyNewFeatureOrImplementationRequest(
        'What is the best way to add retry logic to the client?',
      ),
    ).toBe(true);
  });
});
