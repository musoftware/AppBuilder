/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

/** True when `message` is exactly a trigger or starts with trigger + space/comma. */
export function messageMatchesGoTrigger(
  message: string,
  triggers: readonly string[],
): boolean {
  const lower = message.trim().toLowerCase();
  return triggers.some(
    (t) =>
      lower === t || lower.startsWith(t + ' ') || lower.startsWith(t + ','),
  );
}
