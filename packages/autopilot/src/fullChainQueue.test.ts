/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  buildFullChainContinuationPhases,
  buildFullChainQueue,
} from './fullChainQueue.js';

describe('buildFullChainQueue', () => {
  it('returns 10 sequential phases in order', () => {
    const phases = buildFullChainQueue();
    expect(phases).toHaveLength(10);
    expect(phases[0]).toContain('[FULL CHAIN 0/9');
    expect(phases[9]).toContain('[FULL CHAIN 9/9');
    for (let i = 0; i < 10; i++) {
      expect(phases[i]).toContain(`[FULL CHAIN ${i}/9`);
    }
  });

  it('can inject cached Phase 0 and omit Phase 1 cache preamble', () => {
    const phases = buildFullChainQueue({
      phase0Prompt: '---CACHED PHASE 0---',
      includePhase1CacheInstructions: false,
    });
    expect(phases).toHaveLength(10);
    expect(phases[0]).toBe('---CACHED PHASE 0---');
    expect(phases[1]).not.toContain('.chain-cache.json');
    expect(phases[1]).toContain('[FULL CHAIN 1/9');
  });

  it('continuation is phases 2–9 only (8 items)', () => {
    const tail = buildFullChainContinuationPhases();
    expect(tail).toHaveLength(8);
    expect(tail[0]).toContain('[FULL CHAIN 2/9');
    expect(tail[7]).toContain('[FULL CHAIN 9/9');
  });
});
