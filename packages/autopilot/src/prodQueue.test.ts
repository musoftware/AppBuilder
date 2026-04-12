/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildProdQueue,
  getProdStackContextInstruction,
  getProjectBrainDirName,
  resolveSkillPhaseMessages,
  SKILL_MINI_LOOP_PHASE_COUNT,
  summarizeAutopilotQueue,
} from './prodQueue.js';

function tempWorkspace(): string {
  return mkdtempSync(join(tmpdir(), 'prod-queue-test-'));
}

describe('resolveSkillPhaseMessages', () => {
  const stack = getProdStackContextInstruction();
  const date = '2026-01-01';

  it('uses six phases when primary brain file is missing', () => {
    const root = tempWorkspace();
    const phases = resolveSkillPhaseMessages(
      root,
      'audit-backend',
      '[SKILL: audit-backend]\nRun.',
      stack,
      date,
    );
    expect(phases.length).toBe(SKILL_MINI_LOOP_PHASE_COUNT);
  });

  it('uses fix-only (four phases) when brain shows open issues', () => {
    const root = tempWorkspace();
    mkdirSync(join(root, '.project-brain'), { recursive: true });
    writeFileSync(
      join(root, '.project-brain', 'audit-backend.md'),
      [
        'SUMMARY:',
        'Audited backend endpoints.',
        '3 critical gaps found.',
        'VERDICT: NOT_READY — 3 issues',
        '',
        'FINDINGS:',
        '- src/routes/users.ts:42 — missing auth guard — unauthenticated access',
        '',
        'STATE:',
        'Auth guard missing on /users route; build must add middleware.',
        '',
        'NEXT_SKILLS: none',
      ].join('\n'),
    );
    const phases = resolveSkillPhaseMessages(
      root,
      'audit-backend',
      '[SKILL: audit-backend]\nRun.',
      stack,
      date,
    );
    expect(phases.length).toBe(4);
    expect(phases[0]).toMatch(/RERUN POLICY — FIX PATH/);
  });

  it('uses six phases again when brain is clean (re-scan)', () => {
    const root = tempWorkspace();
    mkdirSync(join(root, '.project-brain'), { recursive: true });
    writeFileSync(
      join(root, '.project-brain', 'audit-backend.md'),
      [
        'SUMMARY:',
        'Audited backend endpoints.',
        'All endpoints have auth guards.',
        'VERDICT: PROD_READY',
        '',
        'FINDINGS:',
        '- src/routes/users.ts:1 — all endpoints — guards in place',
        '',
        'STATE:',
        'Backend is clean; no action needed.',
        '',
        'NEXT_SKILLS: none',
      ].join('\n'),
    );
    const phases = resolveSkillPhaseMessages(
      root,
      'audit-backend',
      '[SKILL: audit-backend]\nRun.',
      stack,
      date,
    );
    expect(phases.length).toBe(SKILL_MINI_LOOP_PHASE_COUNT);
  });
});

describe('getProjectBrainDirName', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to .project-brain when unset', () => {
    vi.stubEnv('QWEN_PROJECT_BRAIN_DIR', '');
    expect(getProjectBrainDirName()).toBe('.project-brain');
  });

  it('uses a safe custom relative directory from the env', () => {
    vi.stubEnv('QWEN_PROJECT_BRAIN_DIR', 'custom-brain');
    expect(getProjectBrainDirName()).toBe('custom-brain');
  });

  it('rejects path traversal and drive-prefixed values', () => {
    vi.stubEnv('QWEN_PROJECT_BRAIN_DIR', '../etc');
    expect(getProjectBrainDirName()).toBe('.project-brain');
    vi.stubEnv('QWEN_PROJECT_BRAIN_DIR', 'C:/brain');
    expect(getProjectBrainDirName()).toBe('.project-brain');
  });
});

describe('summarizeAutopilotQueue', () => {
  it('counts messages and PHASE markers', () => {
    const s = summarizeAutopilotQueue([
      'a',
      '━━━ `x` — PHASE 1/6 — y ━━━',
      'PHASE 2/6',
    ]);
    expect(s.messageCount).toBe(3);
    expect(s.labeledPhaseMarkers).toBe(2);
  });
});

describe('buildProdQueue', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('starts with UNDERSTAND / brain flow and ends with final prod report gate', () => {
    const root = tempWorkspace();
    const phases = buildProdQueue(root);
    expect(phases.length).toBeGreaterThan(0);
    const first = phases[0] ?? '';
    expect(first).toMatch(/RESOLVED SKILL PATHS/);
    expect(first).toMatch(/project codebase|BRAIN UPDATED/i);
    const last = phases[phases.length - 1] ?? '';
    expect(last).toMatch(/FINAL PROD REPORT/i);
    expect(last).toMatch(/PRODUCTION READY|REMAINING ISSUES/i);
  });

  it('queues six phased prompts per stacked skill with visible PHASE labels', () => {
    const root = tempWorkspace();
    mkdirSync(join(root, '.project-brain'), { recursive: true });
    writeFileSync(
      join(root, '.project-brain', 'understand.md'),
      ['HAS_BACKEND: Yes', 'HAS_FRONTEND: No', 'REST API', ''].join('\n'),
    );
    const phases = buildProdQueue(root);
    const joined = phases.join('\n');
    expect(joined).toMatch(/PHASE 1\/6/);
    expect(joined).toMatch(/PHASE 6\/6/);
  });

  it('includes bundled audit-backend mini-loop when workspace has no .qwen/skills', () => {
    const root = tempWorkspace();
    const phases = buildProdQueue(root);
    const joined = phases.join('\n');
    expect(joined).toMatch(/SKILL: AUDIT-BACKEND/i);
    expect(joined).toMatch(/AUDIT DONE: audit-backend/i);
  });

  it('uses workspace smart-orchestrator as one message when present (default)', () => {
    const root = tempWorkspace();
    mkdirSync(join(root, '.qwen', 'skills', 'smart-orchestrator'), {
      recursive: true,
    });
    writeFileSync(
      join(root, '.qwen', 'skills', 'smart-orchestrator', 'SKILL.md'),
      '[SKILL: smart-orchestrator]\nRun all phases.\n',
    );
    const phases = buildProdQueue(root);
    expect(phases).toHaveLength(1);
    expect(phases[0]).toContain('Run all phases');
  });

  it('builds phased queue when workspace orchestrator exists but useWorkspaceOrchestrator is false', () => {
    const root = tempWorkspace();
    mkdirSync(join(root, '.qwen', 'skills', 'smart-orchestrator'), {
      recursive: true,
    });
    writeFileSync(
      join(root, '.qwen', 'skills', 'smart-orchestrator', 'SKILL.md'),
      '[SKILL: smart-orchestrator]\nRun all phases.\n',
    );
    const phases = buildProdQueue(root, { useWorkspaceOrchestrator: false });
    expect(phases.length).toBeGreaterThan(1);
    expect(phases.join('\n')).toMatch(/PHASE 1\/6/);
  });

  it('always appends fixed persona review skills before final gate', () => {
    const root = tempWorkspace();
    mkdirSync(join(root, '.project-brain'), { recursive: true });
    writeFileSync(
      join(root, '.project-brain', 'understand.md'),
      ['HAS_BACKEND: Yes', 'HAS_FRONTEND: No', 'REST API', ''].join('\n'),
    );
    const phases = buildProdQueue(root);
    const joined = phases.join('\n');
    expect(joined).toMatch(/SKILL: REVIEW-AS-USER/i);
    expect(joined).toMatch(/SKILL: REVIEW-AS-SECURITY/i);
    expect(joined).toMatch(/SKILL: REVIEW-AS-DATA/i);
    const gateIdx = joined.search(/FINAL PROD REPORT/i);
    const userIdx = joined.search(/SKILL: REVIEW-AS-USER/i);
    expect(gateIdx).toBeGreaterThan(userIdx);
  });

  it('skips frontend audits but still runs test-e2e when understand has no frontend', () => {
    const root = tempWorkspace();
    mkdirSync(join(root, '.project-brain'), { recursive: true });
    writeFileSync(
      join(root, '.project-brain', 'understand.md'),
      ['HAS_BACKEND: Yes', 'HAS_FRONTEND: No', 'REST API', ''].join('\n'),
    );
    const phases = buildProdQueue(root);
    const joined = phases.join('\n');
    expect(joined).not.toMatch(/SKILL: AUDIT-FRONTEND/i);
    expect(joined).not.toMatch(/SKILL: AUDIT-ROLES/i);
    expect(joined).toMatch(/SKILL: TEST-E2E/i);
    expect(joined).toMatch(/SKILL: AUDIT-BACKEND/i);
  });

  it('prepends governance files to the first queued message when present', () => {
    const root = tempWorkspace();
    mkdirSync(join(root, '.project-brain'), { recursive: true });
    writeFileSync(
      join(root, '.project-brain', 'preferences.md'),
      'Prefer Vitest over Jest.\n',
      'utf8',
    );
    writeFileSync(
      join(root, '.project-brain', 'decisions.md'),
      '2026-04-01 — Chose PostgreSQL for primary store.\n',
      'utf8',
    );
    const phases = buildProdQueue(root);
    const first = phases[0] ?? '';
    expect(first).toMatch(/preferences\.md/);
    expect(first).toMatch(/Prefer Vitest/);
    expect(first).toMatch(/decisions\.md/);
    expect(first).toMatch(/PostgreSQL/);
  });

  it('reads governance from QWEN_PROJECT_BRAIN_DIR when set', () => {
    vi.stubEnv('QWEN_PROJECT_BRAIN_DIR', 'alt-brain');
    const root = tempWorkspace();
    mkdirSync(join(root, 'alt-brain'), { recursive: true });
    writeFileSync(
      join(root, 'alt-brain', 'preferences.md'),
      'Use pnpm.\n',
      'utf8',
    );
    const phases = buildProdQueue(root);
    const first = phases[0] ?? '';
    expect(first).toMatch(/alt-brain\/preferences\.md/);
    expect(first).toMatch(/Use pnpm/);
  });

  it('selects multi-tenant and billing when understand mentions SaaS', () => {
    const root = tempWorkspace();
    mkdirSync(join(root, '.qwen', 'skills', 'audit-multi-tenant'), {
      recursive: true,
    });
    mkdirSync(join(root, '.qwen', 'skills', 'audit-billing'), {
      recursive: true,
    });
    writeFileSync(
      join(root, '.qwen', 'skills', 'audit-multi-tenant', 'SKILL.md'),
      '# audit-multi-tenant\n\nRun checks.\n',
    );
    writeFileSync(
      join(root, '.qwen', 'skills', 'audit-billing', 'SKILL.md'),
      '# audit-billing\n\nRun checks.\n',
    );
    mkdirSync(join(root, '.project-brain'), { recursive: true });
    writeFileSync(
      join(root, '.project-brain', 'understand.md'),
      [
        'HAS_BACKEND: Yes',
        'HAS_FRONTEND: No',
        'SaaS multi-tenant subscription billing',
      ].join('\n'),
    );
    const phases = buildProdQueue(root);
    const joined = phases.join('\n');
    expect(joined).toMatch(/SKILL: AUDIT-MULTI-TENANT/i);
    expect(joined).toMatch(/SKILL: AUDIT-BILLING/i);
  });
});
