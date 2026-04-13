/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  AutopilotActionReturn,
  AutopilotPhasePick,
  AutopilotPhasePickPipeline,
  CommandContext,
  MessageActionReturn,
  SlashCommand,
} from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';

const PHASE_PIPELINES: readonly AutopilotPhasePickPipeline[] = [
  'prod',
  'prod-ready',
  'full-chain',
  'frontend-audit',
  'ready-production',
  'project-hardening',
  'quality-check',
] as const;

const PIPELINE_SET: ReadonlySet<string> = new Set(PHASE_PIPELINES);

export function parseAutopilotPhasePickArgs(
  args: string,
): { ok: true; pick: AutopilotPhasePick } | { ok: false; error: string } {
  const trimmed = args.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: `Usage: /phase <pipeline> <n|n-m> [-- <focus>]\nPipelines: ${PHASE_PIPELINES.join(', ')}.\nExample: /phase prod 4   or   /phase prod-ready 2 -- tighten auth`,
    };
  }

  let pipelineFocus: string | undefined;
  let head = trimmed;
  const sep = /\s--\s/;
  if (sep.test(trimmed)) {
    const parts = trimmed.split(sep);
    head = parts[0]?.trim() ?? '';
    const rest = parts.slice(1).join(' -- ').trim();
    pipelineFocus = rest === '' ? undefined : rest;
  }

  const tokens = head.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) {
    return {
      ok: false,
      error: `Missing pipeline or range. Example: /phase full-chain 3-5`,
    };
  }
  if (tokens.length > 2) {
    return {
      ok: false,
      error:
        'Too many tokens before `--`. Use `/phase <pipeline> <n|n-m> -- <focus>` for prod-ready or project-hardening.',
    };
  }

  const pipelineRaw = tokens[0]!;
  if (!PIPELINE_SET.has(pipelineRaw)) {
    return {
      ok: false,
      error: `Unknown pipeline "${pipelineRaw}". Use one of: ${PHASE_PIPELINES.join(', ')}.`,
    };
  }
  const pipeline = pipelineRaw as AutopilotPhasePickPipeline;

  const rangeTok = tokens[1]!;
  const rangeM = /^(\d+)(?:-(\d+))?$/.exec(rangeTok);
  if (!rangeM) {
    return {
      ok: false,
      error: `Invalid range "${rangeTok}". Use one index or start-end (e.g. 6 or 2-4).`,
    };
  }
  const start = Number(rangeM[1]);
  const end = rangeM[2] === undefined ? undefined : Number(rangeM[2]);

  if (
    pipelineFocus &&
    pipeline !== 'prod-ready' &&
    pipeline !== 'project-hardening'
  ) {
    return {
      ok: false,
      error: `Focus text after -- is only supported for prod-ready and project-hardening.`,
    };
  }

  return {
    ok: true,
    pick: {
      pipeline,
      start,
      end,
      ...(pipelineFocus ? { pipelineFocus } : {}),
    },
  };
}

export const phaseCommand: SlashCommand = {
  name: 'phase',
  get description() {
    return t(
      'Queue a subset of autopilot messages: /phase <pipeline> <n|n-m> [-- focus]. Pipelines: prod, prod-ready, full-chain, frontend-audit, ready-production, project-hardening, quality-check.',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (
    _context: CommandContext,
    args: string,
  ): Promise<AutopilotActionReturn | MessageActionReturn> => {
    const parsed = parseAutopilotPhasePickArgs(args);
    if (!parsed.ok) {
      return { type: 'message', messageType: 'error', content: parsed.error };
    }
    return { type: 'autopilot', phasePick: parsed.pick };
  },
};
