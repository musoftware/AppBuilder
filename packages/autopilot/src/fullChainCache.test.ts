/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { extractProjectContextBlock } from './fullChainCache.js';

describe('extractProjectContextBlock', () => {
  it('returns the full block when present', () => {
    const text = `intro
---PROJECT CONTEXT START---
APP: x
---PROJECT CONTEXT END---
outro`;
    expect(extractProjectContextBlock(text)).toBe(`---PROJECT CONTEXT START---
APP: x
---PROJECT CONTEXT END---`);
  });

  it('returns null when missing', () => {
    expect(extractProjectContextBlock('no block here')).toBeNull();
  });
});
