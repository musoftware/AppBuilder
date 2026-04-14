/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { readyProductionRoundLooksGreen } from './readyProductionGate.js';

describe('readyProductionRoundLooksGreen', () => {
  it('is false when full-chain gate still requires loop', () => {
    expect(
      readyProductionRoundLooksGreen('NOT_READY', '- FRONTEND READY: ok'),
    ).toBe(false);
  });

  it('is false when frontend reports NOT READY', () => {
    expect(
      readyProductionRoundLooksGreen(
        'PROD_READY',
        'VERDICT:\n- FRONTEND NOT READY: bugs',
      ),
    ).toBe(false);
  });

  it('is true when prod gate satisfied and frontend READY line present', () => {
    expect(
      readyProductionRoundLooksGreen(
        'PROD_READY',
        'VERDICT:\n- FRONTEND READY: all good',
      ),
    ).toBe(true);
  });
});
