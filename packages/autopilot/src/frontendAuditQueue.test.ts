/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildFrontendAuditQueue } from './frontendAuditQueue.js';

describe('buildFrontendAuditQueue', () => {
  it('returns 4 phases in order', () => {
    const phases = buildFrontendAuditQueue();
    expect(phases).toHaveLength(4);
    expect(phases[0]).toContain('[FRONTEND AUDIT 1/4');
    expect(phases[1]).toContain('[FRONTEND AUDIT 2/4');
    expect(phases[2]).toContain('[FRONTEND AUDIT 3/4');
    expect(phases[3]).toContain('[FRONTEND AUDIT 4/4');
  });
});
