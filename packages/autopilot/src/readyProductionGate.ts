/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { fullChainGateRequiresLoop } from './fullChainLoop.js';

/** Heuristic: prod gate satisfied and frontend audit verdict is FRONTEND READY. */
export function readyProductionRoundLooksGreen(
  fullChainGateOutput: string,
  lastFrontendAuditOutput: string,
): boolean {
  if (fullChainGateRequiresLoop(fullChainGateOutput)) {
    return false;
  }
  const fe = lastFrontendAuditOutput;
  if (fe.includes('- FRONTEND NOT READY:')) {
    return false;
  }
  return fe.includes('- FRONTEND READY:');
}
