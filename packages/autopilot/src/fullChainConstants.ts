/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

/** Default number of full-chain passes (Phase 0–9, then Phase 2–9 repeats) before stopping. */
export const DEFAULT_FULL_CHAIN_MAX_PASSES = 5;

const ENV_MAX_PASSES = 'QWEN_FULL_CHAIN_MAX_PASSES';

export function getFullChainMaxPasses(): number {
  const raw = process.env[ENV_MAX_PASSES]?.trim();
  if (!raw) {
    return DEFAULT_FULL_CHAIN_MAX_PASSES;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return DEFAULT_FULL_CHAIN_MAX_PASSES;
  }
  return Math.min(n, 50);
}
