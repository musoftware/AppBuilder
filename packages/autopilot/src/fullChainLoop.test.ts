/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  fullChainGateRequiresLoop,
  prependLoopPassNotice,
} from './fullChainLoop.js';

describe('fullChainGateRequiresLoop', () => {
  it('returns true for NOT_READY', () => {
    expect(fullChainGateRequiresLoop('NOT_READY')).toBe(true);
  });

  it('returns true for LOOP_REQUIRED', () => {
    expect(fullChainGateRequiresLoop('LOOP_REQUIRED')).toBe(true);
  });

  it('returns false for clean PROD_READY', () => {
    expect(fullChainGateRequiresLoop('PROD_READY')).toBe(false);
  });

  it('NOT_READY wins over PROD_READY in same blob', () => {
    expect(fullChainGateRequiresLoop('PROD_READY\nNOT_READY\n')).toBe(true);
  });
});

describe('prependLoopPassNotice', () => {
  it('prefixes first phase only', () => {
    const out = prependLoopPassNotice(['a', 'b'], 2, 5);
    expect(out).toHaveLength(2);
    expect(out[0]).toContain('LOOP PASS 2/5');
    expect(out[0]).toContain('a');
    expect(out[1]).toBe('b');
  });
});
