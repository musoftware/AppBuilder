/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ChatMessage } from '@qwen-code/autopilot';
import { getErrorMessage } from '@qwen-code/qwen-code-core';
import {
  getAutopilotQueueLogPath,
  logAutopilotQueueHalted,
  logAutopilotQueueTurn,
} from './autopilotQueueJsonl.js';
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

  const logPath = getAutopilotQueueLogPath();
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
      logAutopilotQueueTurn(logPath, {
        kind: 'autopilot_queue',
        index: i + 1,
        total: phasesThisPass.length,
        prompt: phase,
        extra: {
          source: 'full-chain-only',
          pass: pass + 1,
          maxPasses,
        },
      });
      try {
        gateOutput = await callModelWithTools(
          [{ role: 'user', content: phase }],
          system,
          true,
        );
      } catch (error: unknown) {
        const remainingThisPass = phasesThisPass.length - i - 1;
        const remainingPassesAfter = maxPasses - pass - 1;
        const droppedRemaining = remainingThisPass + remainingPassesAfter;
        if (droppedRemaining > 0) {
          logAutopilotQueueHalted(logPath, {
            reason: 'headless_phase_error',
            source: 'full-chain-only',
            droppedRemaining,
            pass: pass + 1,
            phaseInPass: i + 1,
            phasesInPass: phasesThisPass.length,
            fullPassesRemainingAfterCurrent: remainingPassesAfter,
            errorPreview: (getErrorMessage(error) || String(error)).slice(
              0,
              200,
            ),
          });
        }
        throw error;
      }
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
