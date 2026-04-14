/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * True when the production gate output asks for another iteration.
 * Fails closed: NOT_READY / LOOP_REQUIRED trigger continuation even if the model also mentioned PROD_READY elsewhere.
 */
export function fullChainGateRequiresLoop(phase9Output: string): boolean {
  if (/\bNOT_READY\b/.test(phase9Output)) {
    return true;
  }
  if (/\bLOOP_REQUIRED\b/.test(phase9Output)) {
    return true;
  }
  return false;
}

/**
 * Prefixes audit→gate phases for pass 2+ so the model knows this is a continuation.
 */
export function prependLoopPassNotice(
  phases: readonly string[],
  passNumber: number,
  maxPasses: number,
): string[] {
  if (phases.length === 0) {
    return [...phases];
  }
  const banner = `[FULL CHAIN — LOOP PASS ${passNumber}/${maxPasses}]

The previous production gate returned NOT_READY and/or LOOP_REQUIRED. The workspace and .ai-docs/ may have changed. This pass repeats from the audit phase through the production gate: use existing .ai-docs/ and prior outputs as hints, but verify every claim against the current files and test results (do not assume the last pass finished everything).

---

`;
  return [`${banner}${phases[0]!}`, ...phases.slice(1)];
}
