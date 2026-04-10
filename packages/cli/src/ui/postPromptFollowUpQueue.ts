/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { AutopilotDriver } from '@qwen-code/autopilot';
import type { LoadedSettings } from '../config/settings.js';
import { resolvePath } from '../utils/resolvePath.js';

const DEFAULT_PHASE_SKILL_IDS = [
  'post-turn-deep-test',
  'post-turn-verify-fix',
  'post-turn-complete',
] as const;

/**
 * Builds queued chat messages for the optional post-user-prompt skill pipeline.
 * Each message embeds one skill playbook plus the original user text as context.
 */
export async function buildPostUserPromptFollowUpMessages(
  originalUserPrompt: string,
  settings: LoadedSettings,
): Promise<string[]> {
  const followUp = settings.merged.ui?.postPromptFollowUp;
  if (!followUp?.enabled) {
    return [];
  }

  const phaseIds =
    followUp.skillPhaseIds && followUp.skillPhaseIds.length > 0
      ? followUp.skillPhaseIds
      : [...DEFAULT_PHASE_SKILL_IDS];

  const ap = settings.merged.autopilot;
  const driver = new AutopilotDriver({
    skillsPath: ap?.skillsPath ? resolvePath(ap.skillsPath) : undefined,
    extraSkillsPaths:
      ap?.extraSkillsPaths && ap.extraSkillsPaths.length > 0
        ? ap.extraSkillsPaths.map((p) => resolvePath(p))
        : undefined,
  });

  const resolvedSkillsPath = ap?.skillsPath
    ? resolvePath(ap.skillsPath)
    : undefined;

  const contextBlock = [
    '## Original user request (context for this automated follow-up phase)',
    '',
    'Treat everything below as the user’s goal for the session. Execute **this phase only** as defined in the skill playbook; later phases run as separate queued prompts.',
    '',
    originalUserPrompt.slice(0, 12_000),
    '',
  ].join('\n');

  const out: string[] = [];
  const total = phaseIds.length;

  for (let i = 0; i < phaseIds.length; i++) {
    const id = phaseIds[i]?.trim();
    if (!id) {
      continue;
    }
    try {
      const body = await driver.skillWorkflow(id, resolvedSkillsPath);
      out.push(
        [
          `[Automated follow-up ${i + 1}/${total}]`,
          '',
          contextBlock,
          '---',
          '',
          body,
        ].join('\n'),
      );
    } catch {
      // Skill missing from all paths — skip this phase
    }
  }

  return out;
}
