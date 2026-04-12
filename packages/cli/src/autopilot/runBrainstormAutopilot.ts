import { AutopilotSession, type ChatMessage } from '@qwen-code/autopilot';
import type { Config } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../config/settings.js';
import { resolvePath } from '../utils/resolvePath.js';
import { writeStdoutLine } from '../utils/stdioHelpers.js';
import { createAutopilotModelAdapters } from './autopilotToolLoop.js';
import { runStandaloneFullChain } from './runStandaloneFullChain.js';
import { runStandaloneFrontendAudit } from './runStandaloneFrontendAudit.js';
import { runStandaloneQualityCheck } from './runStandaloneQualityCheck.js';
import {
  getAutopilotQueueLogPath,
  logAutopilotQueueTurn,
} from './autopilotQueueJsonl.js';

async function runHeadlessAutopilotPhaseLoop(
  phases: string[],
  callModelWithTools: (
    messages: ChatMessage[],
    system: string,
    yolo: boolean,
  ) => Promise<string>,
  system: string,
  source: string,
): Promise<void> {
  const logPath = getAutopilotQueueLogPath();
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i]!;
    logAutopilotQueueTurn(logPath, {
      kind: 'autopilot_queue',
      index: i + 1,
      total: phases.length,
      prompt: phase,
      extra: { source },
    });
    await callModelWithTools([{ role: 'user', content: phase }], system, true);
  }
}

export async function runBrainstormAutopilot(
  config: Config,
  settings: LoadedSettings,
  initialIdea?: string,
  forceMode?: 'brownfield' | 'greenfield',
  mode?:
    | 'quality-check-only'
    | 'prod-only'
    | 'prod-ready-only'
    | 'full-chain-only'
    | 'frontend-audit-only'
    | 'ready-production-only'
    | 'skill-only',
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

  if (mode === 'prod-only') {
    const { buildProdQueue } = await import('@qwen-code/autopilot');
    const phases = buildProdQueue(process.cwd());
    const system =
      'You are an expert autonomous coding agent. Execute the phase instructions in the user message completely in the current workspace.';
    await runHeadlessAutopilotPhaseLoop(
      phases,
      callModelWithTools,
      system,
      'prod-only',
    );
    return;
  }

  if (mode === 'prod-ready-only') {
    const { buildProdReadyQueue } = await import('@qwen-code/autopilot');
    const focus = initialIdea?.trim();
    const phases = buildProdReadyQueue(focus ? focus : undefined);
    const system =
      'You are an expert autonomous coding agent. Execute the phase instructions in the user message completely in the current workspace.';
    await runHeadlessAutopilotPhaseLoop(
      phases,
      callModelWithTools,
      system,
      'prod-ready-only',
    );
    return;
  }

  if (mode === 'full-chain-only') {
    await runStandaloneFullChain(callModelWithTools, process.cwd());
    return;
  }

  if (mode === 'ready-production-only') {
    const {
      getReadyProductionRounds,
      getReadyProductionExitWhenRoundGreen,
      readyProductionRoundLooksGreen,
    } = await import('@qwen-code/autopilot');
    const workspaceRoot = process.cwd();
    const maxRounds = getReadyProductionRounds();
    const exitWhenGreen = getReadyProductionExitWhenRoundGreen();

    for (let round = 1; round <= maxRounds; round++) {
      writeStdoutLine(
        `[ready-production] Round ${round}/${maxRounds}: full-chain…`,
      );
      const gateOutput = await runStandaloneFullChain(
        callModelWithTools,
        workspaceRoot,
      );

      writeStdoutLine(
        `[ready-production] Round ${round}/${maxRounds}: frontend-audit…`,
      );
      const feOutput = await runStandaloneFrontendAudit(callModelWithTools);

      writeStdoutLine(
        `[ready-production] Round ${round}/${maxRounds}: quality-check…`,
      );
      await runStandaloneQualityCheck(callModelWithTools, {
        maxTaskRetries: ap?.maxTaskRetries,
      });

      writeStdoutLine(
        `[ready-production] Round ${round}/${maxRounds}: trio complete.`,
      );

      if (
        exitWhenGreen &&
        readyProductionRoundLooksGreen(gateOutput, feOutput)
      ) {
        writeStdoutLine(
          `[ready-production] Full-chain + frontend gates look green — stopping after round ${round}/${maxRounds} (set QWEN_READY_PRODUCTION_EXIT_WHEN_READY=0 to always run all rounds).`,
        );
        break;
      }
    }
    return;
  }

  if (mode === 'frontend-audit-only') {
    await runStandaloneFrontendAudit(callModelWithTools);
    return;
  }

  if (mode === 'skill-only') {
    const { buildSingleSkillQueue } = await import('@qwen-code/autopilot');
    const skillName = initialIdea?.trim() ?? '';
    const phases = buildSingleSkillQueue(skillName, process.cwd());
    const system =
      'You are an expert autonomous coding agent. Execute the instructions in the user message completely in the current workspace.';
    await runHeadlessAutopilotPhaseLoop(
      phases,
      callModelWithTools,
      system,
      'skill-only',
    );
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
