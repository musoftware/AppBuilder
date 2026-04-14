/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns a 1-based inclusive slice of autopilot queue messages.
 */
export function sliceAutopilotPhaseMessages(
  messages: readonly string[],
  start: number,
  end?: number,
): { ok: true; messages: string[] } | { ok: false; error: string } {
  const total = messages.length;
  if (total === 0) {
    return {
      ok: false,
      error: 'This pipeline produced no queued messages.',
    };
  }
  const lo = start;
  const hi = end ?? start;
  if (
    !Number.isInteger(lo) ||
    !Number.isInteger(hi) ||
    lo < 1 ||
    hi < lo ||
    hi > total
  ) {
    return {
      ok: false,
      error: `Invalid phase range. This run has ${total} queued message(s) (valid indices: 1–${total}).`,
    };
  }
  return { ok: true, messages: messages.slice(lo - 1, hi) };
}
