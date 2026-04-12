import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import {
  PROJECT_BRAIN_SKILL_ORDER,
  buildSingleSkillQueue,
  buildSmartQueue,
} from './smartSkillsQueue.js';

describe('smartSkillsQueue', () => {
  it('buildSingleSkillQueue returns not-found message for missing skill', () => {
    const root = mkdtempSync(join(tmpdir(), 'pb-skill-'));
    const q = buildSingleSkillQueue('nonexistent-skill-xyz', root);
    expect(q).toHaveLength(1);
    expect(q[0]).toContain('SKILL NOT FOUND');
    expect(q[0]).toContain('nonexistent-skill-xyz');
  });

  it('buildSingleSkillQueue prepends understand context and expands plan into six phases', () => {
    const root = mkdtempSync(join(tmpdir(), 'pb-skill-'));
    mkdirSync(join(root, '.project-brain'), { recursive: true });
    writeFileSync(
      join(root, '.project-brain', 'understand.md'),
      'HAS FRONTEND: Yes\n',
      'utf8',
    );
    mkdirSync(join(root, '.qwen', 'skills', 'plan'), { recursive: true });
    writeFileSync(
      join(root, '.qwen', 'skills', 'plan', 'SKILL.md'),
      '[SKILL: plan]\nDo the plan.\n',
      'utf8',
    );
    const q = buildSingleSkillQueue('plan', root);
    expect(q).toHaveLength(6);
    expect(q[0]).toContain('PROJECT CONTEXT');
    expect(q[0]).toContain('HAS FRONTEND: Yes');
    expect(q[0]).toContain('## RESOLVED SKILL PATHS');
    expect(q[0]).toContain('[SKILL: plan]');
    expect(q[0]).toContain('PHASE 1/6');
    expect(q[5]).toContain('PHASE 6/6');
  });

  it('buildSmartQueue returns orchestrator only when smart-orchestrator exists', () => {
    const root = mkdtempSync(join(tmpdir(), 'pb-smart-'));
    mkdirSync(join(root, '.qwen', 'skills', 'smart-orchestrator'), {
      recursive: true,
    });
    writeFileSync(
      join(root, '.qwen', 'skills', 'smart-orchestrator', 'SKILL.md'),
      '[SKILL: smart-orchestrator]\nRun all.\n',
      'utf8',
    );
    const q = buildSmartQueue(root);
    expect(q).toHaveLength(1);
    expect(q[0]).toContain('## RESOLVED SKILL PATHS');
    expect(q[0]).toContain('[SKILL: smart-orchestrator]\nRun all.\n');
  });

  it('buildSmartQueue uses bundled skills when workspace has no .qwen/skills', () => {
    const root = mkdtempSync(join(tmpdir(), 'pb-bundle-'));
    const q = buildSmartQueue(root);
    expect(q.length).toBeGreaterThan(0);
    expect(q[0]).toContain('## RESOLVED SKILL PATHS');
    expect(q[0]).toContain('[SKILL: smart-orchestrator]');
  });

  it('PROJECT_BRAIN_SKILL_ORDER places persona reviews after test-fix and before prod-gate', () => {
    const order = [...PROJECT_BRAIN_SKILL_ORDER];
    const tf = order.indexOf('test-fix');
    const user = order.indexOf('review-as-user');
    const gate = order.indexOf('prod-gate');
    expect(tf).toBeGreaterThan(-1);
    expect(user).toBeGreaterThan(tf);
    expect(gate).toBeGreaterThan(user);
  });
});
