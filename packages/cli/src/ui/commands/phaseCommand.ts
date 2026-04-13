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
  SubmitPromptActionReturn,
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

const PHASE_HELP_TEXT = `Available pipelines and their phases:

1. prod — Full production workflow
   Phases: understand, scaffold, database-design, api-design, auth-setup,
           audit-backend, audit-frontend, audit-roles, audit-database,
           plan, build, review-implementation, refine, harden,
           test-unit, test-integration, test-e2e, test-fix,
           review-as-user, review-as-security, review-as-a11y,
           review-as-mobile, review-as-slow-network, review-as-developer,
           review-as-performance, review-as-qa, review-as-pm, review-as-data,
           deployment-config, prod-gate
   Plus any custom skill name from .qwen/skills/

2. prod-ready — Production readiness pipeline (7 phases)
   Phase 1: analyst (gap analysis)
   Phase 2: builder (implement missing features)
   Phase 3: completer (error handling, edge cases, validation)
   Phase 4: test-writer (unit, integration, E2E tests)
   Phase 5: test-analyzer (run tests, categorize failures)
   Phase 6: fixer (fix bugs, complete missing impl)
   Phase 7: prod-check (final production readiness review)
   Example: /phase prod-ready 3 -- tighten auth

3. full-chain — Complete BMAD chain (10 phases)
   Phase 0: project understander (or delta scan if cached)
   Phase 1: reverse brownfield (generate .ai-docs/ files)
   Phase 2: full-spectrum analyst (code + role + UX + domain + security audit)
   Phase 3: planner (prioritized implementation plan)
   Phase 4: builder (implement all tasks)
   Phase 5: completer (harden everything)
   Phase 6: test writer (comprehensive test suite)
   Phase 7: test analyzer (run and analyze tests)
   Phase 8: fixer (fix failures, complete untested areas)
   Phase 9: production gate (final review)
   Example: /phase full-chain 1-3

4. frontend-audit — Frontend audit pipeline (4 phases)
   Phase 1: mapper (map all screens, routes, components)
   Phase 2: fixer (fix broken wiring, missing routes, dead buttons)
   Phase 3: feature test writer (role access, screen features, regression)
   Phase 4: feature test runner & analyzer (run tests, fix failures, final gate)
   Example: /phase frontend-audit mapper

5. ready-production — Orchestrated production rounds
   Runs multiple rounds of: full-chain → frontend-audit → quality-check
   Default: 5 outer rounds (configurable via QWEN_READY_PRODUCTION_ROUNDS)
   Delegates to inner full-chain, frontend-audit, or quality-check phases
   Example: /phase ready-production 1-5

6. project-hardening — Systematic bug sweep & hardening (9 phases)
   Phase 1: project-harden-understand-1 (Understand 1/3)
   Phase 2: project-harden-understand-2 (Understand 2/3)
   Phase 3: project-harden-understand-3 (Understand 3/3)
   Phase 4: project-harden-fix-1 (Fix & gaps 1/3)
   Phase 5: project-harden-fix-2 (Fix & gaps 2/3)
   Phase 6: project-harden-fix-3 (Fix & gaps 3/3)
   Phase 7: post-turn-deep-test (Quality — deep tests 1/3)
   Phase 8: post-turn-verify-fix (Quality — verify & fix 2/3)
   Phase 9: post-turn-complete (Quality — complete 3/3)
   Block labels: Understand, Fix & gaps, Quality
   Example: /phase project-hardening fix-1,test-fix

7. quality-check — Quality check pipeline
   Phase 1: quality (run tests, fix failures, add coverage)
   Repeats up to 3 passes, then adds coverage-gap closure phase
   Aliases: 1, quality, qc, quality-check, check
   Example: /phase quality-check qc

Syntax:
  /phase <pipeline> <n|n-m|name[,name…]> [-- <focus>]

Examples:
  /phase prod 4                    # Queue phase 4 of prod
  /phase prod e2e-testing          # Queue e2e-testing skill from prod
  /phase full-chain planner        # Queue planner phase from full-chain
  /phase full-chain 2-10           # Queue phases 2 through 10
  /phase prod-ready 3 -- tighten auth  # Phase 3 with focus text
  /phase prod plan,user-stories    # Queue multiple phases
  /phase frontend-audit 1-2        # First two phases of frontend-audit
  /phase project-hardening 1-3     # Understand phases only
  /phase quality-check 1           # Run quality check`;

/**
 * Suggests a close match for a misspelled pipeline name using simple string
 * similarity. Returns null if nothing is close enough.
 */
function suggestPipeline(
  misspelled: string,
  candidates: readonly string[],
): string | null {
  const lower = misspelled.toLowerCase();
  let best: string | null = null;
  let bestScore = 0;

  for (const c of candidates) {
    // Simple similarity: count matching characters
    const a = lower.split('');
    const b = c.split('');
    const matches = a.filter((ch) => {
      const idx = b.indexOf(ch);
      if (idx === -1) return false;
      b.splice(idx, 1);
      return true;
    }).length;
    const score = matches / Math.max(a.length, b.length);
    if (score > bestScore && score > 0.5) {
      bestScore = score;
      best = c;
    }
  }

  return best;
}

/** Builds a list of available phase names for a given pipeline (static summary). */
function availablePhasesFor(pipeline: string): string {
  switch (pipeline) {
    case 'prod':
      return 'understand, scaffold, database-design, api-design, auth-setup, audit-backend, audit-frontend, audit-roles, audit-database, plan, build, review-implementation, refine, harden, test-unit, test-integration, test-e2e, test-fix, review-as-*, deployment-config, prod-gate';
    case 'prod-ready':
      return '1/analyst, 2/builder, 3/completer, 4/test-writer, 5/test-analyzer, 6/fixer, 7/prod-check';
    case 'full-chain':
      return '0/understand, 1/reverse-brownfield, 2/analyst, 3/planner, 4/builder, 5/completer, 6/test-writer, 7/test-analyzer, 8/fixer, 9/prod-gate';
    case 'frontend-audit':
      return '1/mapper, 2/fixer, 3/feature-test-writer, 4/test-runner-analyzer';
    case 'ready-production':
      return 'delegates to inner full-chain, frontend-audit, or quality-check phases';
    case 'project-hardening':
      return 'understand-1, understand-2, understand-3, fix-1, fix-2, fix-3, deep-test, verify-fix, complete';
    case 'quality-check':
      return '1, quality, qc, quality-check, check';
    default:
      return '';
  }
}

export function parseAutopilotPhasePickArgs(
  args: string,
): { ok: true; pick: AutopilotPhasePick } | { ok: false; error: string } {
  const trimmed = args.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: `Usage: /phase <pipeline> <n|n-m|name[,name…]> [-- <focus>]\nPipelines: ${PHASE_PIPELINES.join(', ')}.\nExamples: /phase prod 4  |  /phase prod e2e-testing  |  /phase full-chain planner  |  /phase prod-ready 2 -- tighten auth`,
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
    const suggestion = suggestPipeline(tokens[0] ?? '', PHASE_PIPELINES);
    const suffix = suggestion
      ? `\n\nDid you mean: /phase ${suggestion} <phase>?`
      : `\n\nAvailable pipelines: ${PHASE_PIPELINES.join(', ')}.`;
    return {
      ok: false,
      error: `Missing pipeline or selector. Example: /phase full-chain 3-5 or /phase prod audit-backend${suffix}`,
    };
  }

  const pipelineRaw = tokens[0]!;
  if (!PIPELINE_SET.has(pipelineRaw)) {
    const suggestion = suggestPipeline(pipelineRaw, PHASE_PIPELINES);
    const suffix = suggestion
      ? `\n\nDid you mean: /phase ${suggestion} ${tokens.slice(1).join(' ')}?`
      : `\n\nAvailable pipelines: ${PHASE_PIPELINES.join(', ')}.`;
    return {
      ok: false,
      error: `Unknown pipeline "${pipelineRaw}".${suffix}`,
    };
  }
  const pipeline = pipelineRaw as AutopilotPhasePickPipeline;

  const rest = tokens.slice(1).join(' ').trim();
  if (!rest) {
    return {
      ok: false,
      error: `Missing phase index or name after pipeline.\n\nAvailable phases for ${pipeline}: ${availablePhasesFor(pipeline)}`,
    };
  }

  const rangeM = /^(\d+)(?:-(\d+))?$/.exec(rest);
  let pick: AutopilotPhasePick;

  if (rangeM) {
    const start = Number(rangeM[1]);
    const end = rangeM[2] === undefined ? undefined : Number(rangeM[2]);
    pick = { pipeline, start, end };
  } else {
    const phaseNames = rest
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (phaseNames.length === 0) {
      return {
        ok: false,
        error: `No phase names after pipeline.\n\nAvailable phases for ${pipeline}: ${availablePhasesFor(pipeline)}`,
      };
    }
    pick = { pipeline, phaseNames };
  }

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

  if (pipelineFocus) {
    pick = { ...pick, pipelineFocus };
  }

  return { ok: true, pick };
}

export const phaseCommand: SlashCommand = {
  name: 'phase',
  get description() {
    return t(
      'Queue part of an autopilot pipeline: /phase <pipeline> <n|n-m|name[,name…]> [-- focus]. Names: prod skills (e2e-testing), full-chain (planner), prod-ready (analyst), frontend-audit (mapper), project-hardening skill ids, quality (qc).',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (
    context: CommandContext,
    args: string,
  ): Promise<
    AutopilotActionReturn | MessageActionReturn | SubmitPromptActionReturn
  > => {
    const trimmed = args.trim();

    // --list flag → show all pipelines and phases
    if (trimmed === '--list' || trimmed === '-l') {
      const listOutput = [
        'Available pipelines and their phases:',
        '',
        ...PHASE_PIPELINES.map((p) => `• ${p}: ${availablePhasesFor(p)}`),
        '',
        'Use /phase <pipeline> <phase> to queue specific phases.',
        'Use /phase --dry-run <pipeline> <phase> to preview without queuing.',
      ].join('\n');
      return { type: 'message', messageType: 'info', content: listOutput };
    }

    // --dry-run flag → show what would be queued without actually running
    if (trimmed.startsWith('--dry-run') || trimmed.startsWith('--dry')) {
      const dryRunArgs = trimmed
        .replace(/^--dry-run\s*/, '')
        .replace(/^--dry\s*/, '');
      if (!dryRunArgs.trim()) {
        return {
          type: 'message',
          messageType: 'error',
          content:
            'Usage: /phase --dry-run <pipeline> <phase>\nExample: /phase --dry-run prod e2e-testing',
        };
      }
      const parsed = parseAutopilotPhasePickArgs(dryRunArgs);
      if (!parsed.ok) {
        return { type: 'message', messageType: 'error', content: parsed.error };
      }
      const { pipeline, start, end, phaseNames } = parsed.pick;
      const phases = phaseNames
        ? `Phases: ${phaseNames.join(', ')}`
        : start && end
          ? `Phases: ${start}-${end}`
          : start
            ? `Phase: ${start}`
            : 'All phases';
      const dryRunOutput = [
        `DRY RUN — this would queue:`,
        `Pipeline: ${pipeline}`,
        phases,
        '',
        'To actually run, omit the --dry-run flag.',
      ].join('\n');
      return { type: 'message', messageType: 'info', content: dryRunOutput };
    }

    // No args or help request → use AI to assist the user
    if (
      !trimmed ||
      trimmed === '?' ||
      trimmed === 'help' ||
      trimmed === '--help'
    ) {
      return {
        type: 'submit_prompt',
        content: [
          {
            text: `Help me build a /phase command. Here are the available pipelines and syntax:

${PHASE_HELP_TEXT}

Ask me what I want to accomplish, then suggest the exact /phase command to use. Be concise and practical.`,
          },
        ],
      };
    }

    const parsed = parseAutopilotPhasePickArgs(args);
    if (!parsed.ok) {
      return { type: 'message', messageType: 'error', content: parsed.error };
    }
    return { type: 'autopilot', phasePick: parsed.pick };
  },
};
