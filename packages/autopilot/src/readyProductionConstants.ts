/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

/** Default outer rounds: full-chain → frontend-audit → quality-check per round. */
export const DEFAULT_READY_PRODUCTION_ROUNDS = 5;

const ENV_ROUNDS = 'QWEN_READY_PRODUCTION_ROUNDS';
const ENV_EXIT_WHEN_READY = 'QWEN_READY_PRODUCTION_EXIT_WHEN_READY';

export function getReadyProductionRounds(): number {
  const raw = process.env[ENV_ROUNDS]?.trim();
  if (!raw) {
    return DEFAULT_READY_PRODUCTION_ROUNDS;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return DEFAULT_READY_PRODUCTION_ROUNDS;
  }
  return Math.min(n, 50);
}

/**
 * When true (default), stop remaining outer rounds if the last full-chain gate
 * and frontend-audit final output both look green.
 */
export function getReadyProductionExitWhenRoundGreen(): boolean {
  const v = process.env[ENV_EXIT_WHEN_READY]?.trim().toLowerCase();
  if (v === '0' || v === 'false' || v === 'no') {
    return false;
  }
  return true;
}
