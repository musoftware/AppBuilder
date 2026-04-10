/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { AutopilotDriver } from '@qwen-code/autopilot';
import type { LoadedSettings } from '../config/settings.js';
import { resolvePath } from '../utils/resolvePath.js';

/**
 * Nine queued phases: 3× understand → 3× fix/gaps → 3× quality (same as post-turn
 * deep test / verify-fix / complete).
 */
export const PROJECT_HARDENING_SKILL_PHASES = [
  'project-harden-understand-1',
  'project-harden-understand-2',
  'project-harden-understand-3',
  'project-harden-fix-1',
  'project-harden-fix-2',
  'project-harden-fix-3',
  'post-turn-deep-test',
  'post-turn-verify-fix',
  'post-turn-complete',
] as const;

const BLOCK_LABELS = [
  'Understand (1/3)',
  'Understand (2/3)',
  'Understand (3/3)',
  'Fix & gaps (1/3)',
  'Fix & gaps (2/3)',
  'Fix & gaps (3/3)',
  'Quality — deep tests (1/3)',
  'Quality — verify & fix (2/3)',
  'Quality — complete (3/3)',
] as const;

/**
 * Builds nine autopilot-queue messages: skill playbooks plus optional user focus text.
 */
export async function buildProjectHardeningQueue(
  focusNote: string | undefined,
  settings: LoadedSettings,
): Promise<string[]> {
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

  const focus =
    focusNote?.trim() ||
    'General project hardening: analyze the whole workspace, then correctness and critical gaps, then tests and polish.';

  const contextBlock = [
    '## User focus / scope',
    '',
    focus.slice(0, 12_000),
    '',
    'Execute **only this queued phase**. Later phases run automatically after this turn finishes.',
    '',
  ].join('\n');

  const total = PROJECT_HARDENING_SKILL_PHASES.length;
  const out: string[] = [];

  for (let i = 0; i < total; i++) {
    const id = PROJECT_HARDENING_SKILL_PHASES[i]!;
    const label = BLOCK_LABELS[i] ?? `Phase ${i + 1}`;
    try {
      const body = await driver.skillWorkflow(id, resolvedSkillsPath);
      out.push(
        [
          `[Project hardening ${i + 1}/${total}] — ${label}`,
          '',
          contextBlock,
          '---',
          '',
          body,
        ].join('\n'),
      );
    } catch {
      // Missing skill on disk — skip
    }
  }

  return out;
}
