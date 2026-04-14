/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ChatMessage } from '@qwen-code/autopilot';
import { runHeadlessPhasesWithJsonl } from './autopilotQueueJsonl.js';

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
  return runHeadlessPhasesWithJsonl(
    phases,
    callModelWithTools,
    system,
    'frontend-audit-only',
  );
}
