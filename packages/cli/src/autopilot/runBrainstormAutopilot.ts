import { AutopilotSession } from '@qwen-code/autopilot';
import type { Config } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../config/settings.js';
import { resolvePath } from '../utils/resolvePath.js';
import { createAutopilotModelAdapters } from './autopilotToolLoop.js';

export async function runBrainstormAutopilot(
  config: Config,
  settings: LoadedSettings,
  initialIdea?: string,
): Promise<void> {
  const ap = settings.merged.autopilot;
  const { callModel, callModelWithTools } =
    createAutopilotModelAdapters(config);

  const session = new AutopilotSession(callModel, callModelWithTools, {
    skillsPath: ap?.skillsPath ? resolvePath(ap.skillsPath) : undefined,
    maxTaskRetries: ap?.maxTaskRetries,
    planPreviewSeconds: ap?.planPreviewSeconds,
    goTriggers:
      ap?.goTriggers && ap.goTriggers.length > 0 ? ap.goTriggers : undefined,
  });

  await session.run(initialIdea);
}
