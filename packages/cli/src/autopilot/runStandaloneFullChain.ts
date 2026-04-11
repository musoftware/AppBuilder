/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ChatMessage } from '@qwen-code/autopilot';
import { writeStdoutLine } from '../utils/stdioHelpers.js';

/**
 * Runs the standalone full-chain loop (internal multi-pass until PROD_READY or max).
 * @returns The last model text from the final phase executed (production gate output).
 */
export async function runStandaloneFullChain(
  callModelWithTools: (
    messages: ChatMessage[],
    system: string,
    yolo: boolean,
  ) => Promise<string>,
  workspaceRoot: string,
): Promise<string> {
  const {
    buildFullChainRunPlan,
    buildFullChainContinuationPhases,
    clearChainCacheFile,
    persistProjectContextFromAssistantOutput,
    getFullChainMaxPasses,
    fullChainGateRequiresLoop,
    prependLoopPassNotice,
  } = await import('@qwen-code/autopilot');

  const maxPasses = getFullChainMaxPasses();
  const firstPlan = buildFullChainRunPlan(workspaceRoot, {
    includePhase1CacheInstructions: false,
  });
  const system =
    'You are an expert autonomous coding agent. Execute the phase instructions in the user message completely in the current workspace.';

  let gateOutput = '';
  for (let pass = 0; pass < maxPasses; pass++) {
    const phasesThisPass =
      pass === 0
        ? firstPlan.phases
        : prependLoopPassNotice(
            buildFullChainContinuationPhases(),
            pass + 1,
            maxPasses,
          );
    const persistPhase0 = pass === 0 && firstPlan.persistPhase0OutputToCache;

    for (let i = 0; i < phasesThisPass.length; i++) {
      const phase = phasesThisPass[i]!;
      gateOutput = await callModelWithTools(
        [{ role: 'user', content: phase }],
        system,
        true,
      );
      if (persistPhase0 && i === 0) {
        if (
          persistProjectContextFromAssistantOutput(workspaceRoot, gateOutput)
        ) {
          writeStdoutLine(
            '[full-chain] Project context cached to .ai-docs/.chain-cache.json',
          );
        }
      }
    }

    if (!fullChainGateRequiresLoop(gateOutput)) {
      writeStdoutLine(
        `[full-chain] Production gate: done after ${pass + 1} pass(es).`,
      );
      return gateOutput;
    }

    if (pass + 1 < maxPasses) {
      writeStdoutLine(
        `[full-chain] Production gate: NOT_READY / LOOP_REQUIRED — starting pass ${pass + 2}/${maxPasses} (audit → gate).`,
      );
    }
  }

  if (fullChainGateRequiresLoop(gateOutput)) {
    clearChainCacheFile(workspaceRoot);
    writeStdoutLine(
      '[full-chain] Max passes reached while still NOT_READY — cleared .ai-docs/.chain-cache.json so the next run rescans project context.',
    );
  }
  return gateOutput;
}
