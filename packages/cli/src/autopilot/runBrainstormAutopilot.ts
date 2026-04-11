import { AutopilotSession } from '@qwen-code/autopilot';
import type { Config } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../config/settings.js';
import { resolvePath } from '../utils/resolvePath.js';
import { writeStdoutLine } from '../utils/stdioHelpers.js';
import { createAutopilotModelAdapters } from './autopilotToolLoop.js';
import { runStandaloneQualityCheck } from './runStandaloneQualityCheck.js';

export async function runBrainstormAutopilot(
  config: Config,
  settings: LoadedSettings,
  initialIdea?: string,
  forceMode?: 'brownfield' | 'greenfield',
  mode?: 'quality-check-only' | 'prod-ready-only' | 'full-chain-only',
): Promise<void> {
  const ap = settings.merged.autopilot;
  const { callModel, callModelWithTools } =
    createAutopilotModelAdapters(config);

  if (mode === 'quality-check-only') {
    await runStandaloneQualityCheck(callModelWithTools, {
      maxTaskRetries: ap?.maxTaskRetries,
    });
    return;
  }

  if (mode === 'prod-ready-only') {
    const { buildProdReadyQueue } = await import('@qwen-code/autopilot');
    const focus = initialIdea?.trim();
    const phases = buildProdReadyQueue(focus ? focus : undefined);
    const system =
      'You are an expert autonomous coding agent. Execute the phase instructions in the user message completely in the current workspace.';
    for (const phase of phases) {
      await callModelWithTools(
        [{ role: 'user', content: phase }],
        system,
        true,
      );
    }
    return;
  }

  if (mode === 'full-chain-only') {
    const {
      buildFullChainRunPlan,
      buildFullChainContinuationPhases,
      clearChainCacheFile,
      persistProjectContextFromAssistantOutput,
      getFullChainMaxPasses,
      fullChainGateRequiresLoop,
      prependLoopPassNotice,
    } = await import('@qwen-code/autopilot');
    const workspaceRoot = process.cwd();
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
        return;
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
    return;
  }

  const session = new AutopilotSession(callModel, callModelWithTools, {
    skillsPath: ap?.skillsPath ? resolvePath(ap.skillsPath) : undefined,
    extraSkillsPaths:
      ap?.extraSkillsPaths && ap.extraSkillsPaths.length > 0
        ? ap.extraSkillsPaths.map((p) => resolvePath(p))
        : undefined,
    maxTaskRetries: ap?.maxTaskRetries,
    planPreviewSeconds: ap?.planPreviewSeconds,
    goTriggers:
      ap?.goTriggers && ap.goTriggers.length > 0 ? ap.goTriggers : undefined,
  });

  await session.run(initialIdea, forceMode);
}
