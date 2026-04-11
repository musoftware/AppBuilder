/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ChatMessage } from '@qwen-code/autopilot';

/**
 * Runs all frontend-audit phases sequentially.
 * @returns The last model text (typically phase 4 / final report).
 */
export async function runStandaloneFrontendAudit(
  callModelWithTools: (
    messages: ChatMessage[],
    system: string,
    yolo: boolean,
  ) => Promise<string>,
): Promise<string> {
  const { buildFrontendAuditQueue } = await import('@qwen-code/autopilot');
  const phases = buildFrontendAuditQueue();
  const system =
    'You are an expert autonomous coding agent. Execute the phase instructions in the user message completely in the current workspace.';
  let last = '';
  for (const phase of phases) {
    last = await callModelWithTools(
      [{ role: 'user', content: phase }],
      system,
      true,
    );
  }
  return last;
}
