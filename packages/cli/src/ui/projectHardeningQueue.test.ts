/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { PROJECT_HARDENING_SKILL_PHASES } from './projectHardeningQueue.js';

describe('projectHardeningQueue', () => {
  it('defines nine phases (3×3 structure + quality triad)', () => {
    expect(PROJECT_HARDENING_SKILL_PHASES).toHaveLength(9);
    expect(PROJECT_HARDENING_SKILL_PHASES.slice(6)).toEqual([
      'post-turn-deep-test',
      'post-turn-verify-fix',
      'post-turn-complete',
    ]);
  });
});
