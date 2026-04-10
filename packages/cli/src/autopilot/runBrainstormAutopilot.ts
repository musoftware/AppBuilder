import { AutopilotSession } from '@qwen-code/autopilot';
import type { Config } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../config/settings.js';
import { resolvePath } from '../utils/resolvePath.js';
import { createAutopilotModelAdapters } from './autopilotToolLoop.js';
import { runStandaloneQualityCheck } from './runStandaloneQualityCheck.js';

export async function runBrainstormAutopilot(
  config: Config,
  settings: LoadedSettings,
  initialIdea?: string,
  forceMode?: 'brownfield' | 'greenfield',
  mode?: 'quality-check-only' | 'prod-ready-only',
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
