/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  AutopilotPhasePick,
  AutopilotPhasePickPipeline,
} from '../commands/types.js';
import {
  PROJECT_HARDENING_BLOCK_LABELS,
  PROJECT_HARDENING_SKILL_PHASES,
} from '../projectHardeningQueue.js';
import { sliceAutopilotPhaseMessages } from './sliceAutopilotPhases.js';

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matches `/prod` per-skill mini-loop headers (see prodQueue.skillPhaseIntro). */
function prodSkillPhaseHeaderRe(skillName: string): RegExp {
  return new RegExp(`(^|[\\r\\n])━━━ \`${escapeRegExp(skillName)}\` — PHASE `);
}

function prodMessageMatchesToken(message: string, token: string): boolean {
  const t = norm(token);
  if (
    t === 'understand' ||
    t === 'brain' ||
    t === 'brain-scan' ||
    t === 'brain-refresh'
  ) {
    return (
      /\/PROD — GLOBAL PROJECT BRAIN REFRESH/.test(message) ||
      /Read the ENTIRE project codebase before doing anything/.test(message) ||
      /The project brain exists and is current/.test(message) ||
      (/understand\.md/.test(message) &&
        /Write to |^Read |Check only files changed/.test(message))
    );
  }
  if (t === 'gate' || t === 'final-gate' || t === 'prod-gate') {
    return /FINAL PROD REPORT/.test(message);
  }
  if (t === 'git' || t === 'git-tool') {
    return /## GIT TOOL — persist/.test(message);
  }
  if (!/^[a-z0-9][\w-]*$/i.test(token.trim())) {
    return false;
  }
  return prodSkillPhaseHeaderRe(token.trim()).test(message);
}

function bracketPhaseMatch(
  message: string,
  token: string,
  pattern: RegExp,
): boolean {
  const m = message.match(pattern);
  if (!m) {
    return false;
  }
  const phaseNum = m[1]!;
  const title = m[2]!.toLowerCase();
  const t = norm(token);
  if (/^\d+$/.test(t)) {
    return phaseNum === t;
  }
  const titleSlug = title.replace(/\s+/g, '-');
  return (
    title.includes(t) ||
    titleSlug.includes(t) ||
    title.replace(/[^a-z0-9]+/gi, '-').includes(t)
  );
}

function fullChainMessageMatches(message: string, token: string): boolean {
  return bracketPhaseMatch(
    message,
    token,
    /\[FULL CHAIN (\d+)\/9 — ([^\]]+)\]/,
  );
}

function prodReadyMessageMatches(message: string, token: string): boolean {
  return bracketPhaseMatch(
    message,
    token,
    /\[PROD-READY PHASE (\d+)\/7 — ([^\]]+)\]/,
  );
}

function frontendAuditMessageMatches(message: string, token: string): boolean {
  return bracketPhaseMatch(
    message,
    token,
    /\[FRONTEND AUDIT (\d+)\/4 — ([^\]]+)\]/,
  );
}

function qualityCheckInnerMatches(message: string, token: string): boolean {
  const t = norm(token);
  return (
    t === '1' ||
    t === 'quality' ||
    t === 'qc' ||
    t === 'quality-check' ||
    t === 'check'
  );
}

function projectHardeningMessageMatches(
  message: string,
  token: string,
  index: number,
): boolean {
  const t = norm(token);
  const id = PROJECT_HARDENING_SKILL_PHASES[index];
  if (id && norm(id) === t) {
    return true;
  }
  const label = PROJECT_HARDENING_BLOCK_LABELS[index]?.toLowerCase() ?? '';
  if (
    label &&
    (label.includes(t) ||
      norm(label.replace(/\s+/g, '')).includes(t.replace(/\s+/g, '')))
  ) {
    return true;
  }
  const head = message.match(/^\[Project hardening \d+\/9\] — ([^\n]+)/);
  if (head && norm(head[1]!).includes(t)) {
    return true;
  }
  return false;
}

const RP_PREFIX =
  /^\[READY-PRODUCTION round \d+\/\d+ — (full-chain|frontend-audit|quality-check)\]\s*\n\n(.*)$/s;

function readyProductionMessageMatches(
  message: string,
  token: string,
): boolean {
  const rm = message.match(RP_PREFIX);
  if (!rm) {
    return false;
  }
  const segment = rm[1]!;
  const inner = rm[2]!;
  switch (segment) {
    case 'full-chain':
      return fullChainMessageMatches(inner, token);
    case 'frontend-audit':
      return frontendAuditMessageMatches(inner, token);
    case 'quality-check':
      return qualityCheckInnerMatches(inner, token);
    default:
      return false;
  }
}

function messageMatchesName(
  pipeline: AutopilotPhasePickPipeline,
  message: string,
  index: number,
  token: string,
): boolean {
  switch (pipeline) {
    case 'prod':
      return prodMessageMatchesToken(message, token);
    case 'full-chain':
      return fullChainMessageMatches(message, token);
    case 'prod-ready':
      return prodReadyMessageMatches(message, token);
    case 'frontend-audit':
      return frontendAuditMessageMatches(message, token);
    case 'project-hardening':
      return projectHardeningMessageMatches(message, token, index);
    case 'ready-production':
      return readyProductionMessageMatches(message, token);
    case 'quality-check':
      return qualityCheckInnerMatches(message, token);
    default: {
      const _exhaustiveCheck: never = pipeline;
      throw new Error(`Unknown pipeline: ${_exhaustiveCheck}`);
    }
  }
}

function collectByNames(
  pipeline: AutopilotPhasePickPipeline,
  full: readonly string[],
  names: readonly string[],
): { ok: true; messages: string[] } | { ok: false; error: string } {
  const tokens = names.map((n) => n.trim()).filter(Boolean);
  if (tokens.length === 0) {
    return { ok: false, error: 'No phase names were provided.' };
  }
  const matched = new Set<number>();
  for (const tok of tokens) {
    for (let i = 0; i < full.length; i++) {
      if (messageMatchesName(pipeline, full[i]!, i, tok)) {
        matched.add(i);
      }
    }
  }
  if (matched.size === 0) {
    return {
      ok: false,
      error: `No queued messages matched: ${tokens.map((t) => `\`${t}\``).join(', ')}. Try numeric indices (e.g. \`/phase ${pipeline} 3\`) or another slug (full-chain: planner, prod-ready: analyst, …).`,
    };
  }
  const ordered = [...matched].sort((a, b) => a - b);
  return { ok: true, messages: ordered.map((i) => full[i]!) };
}

/**
 * Applies a `/phase` pick (numeric slice or name-based selection) to a built queue.
 */
export function resolvePhasePickFromQueue(
  pick: AutopilotPhasePick,
  full: readonly string[],
): { ok: true; messages: string[] } | { ok: false; error: string } {
  if (full.length === 0) {
    return { ok: false, error: 'This pipeline produced no queued messages.' };
  }

  if (pick.phaseNames && pick.phaseNames.length > 0) {
    return collectByNames(pick.pipeline, full, pick.phaseNames);
  }

  if (pick.start != null) {
    return sliceAutopilotPhaseMessages(full, pick.start, pick.end);
  }

  return {
    ok: false,
    error:
      'Invalid /phase pick: provide a numeric range (e.g. 3 or 2-7) or phase name(s) (e.g. e2e-testing or planner).',
  };
}
