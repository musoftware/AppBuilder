/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import {
  buildProdQueue,
  getProdStackContextInstruction,
  resolveSkillPhaseMessages,
  SKILL_MINI_LOOP_PHASE_COUNT,
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
      'VERDICT: NOT_READY\n',
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
      'VERDICT: PROD_READY\n',
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

describe('buildProdQueue', () => {
  it('starts with UNDERSTAND / brain flow and ends with final prod report gate', () => {
    const root = tempWorkspace();
    const phases = buildProdQueue(root);
    expect(phases.length).toBeGreaterThan(0);
    const first = phases[0] ?? '';
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
