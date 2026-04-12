import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildGovernanceBlock,
  buildProdQueue,
  buildSkillPathsPreamble,
  getProdStackContextInstruction,
  getProjectBrainDirName,
  PROJECT_BRAIN_SKILL_ORDER,
  resolveSkillPhaseMessages,
} from './prodQueue.js';

/** @deprecated Use {@link buildProdQueue}; `/prod` and `--prod` now include this behavior. */
export function buildSmartQueue(workspaceRoot: string): string[] {
  return buildProdQueue(workspaceRoot);
}

function getBundledProjectBrainSkillsRoot(): string | null {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, '..', 'project-brain-skills'),
    join(here, 'project-brain-skills'),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) {
      return dir;
    }
  }
  return null;
}

function readSkill(skillName: string, workspaceRoot: string): string | null {
  const workspacePath = join(
    workspaceRoot,
    '.qwen',
    'skills',
    skillName,
    'SKILL.md',
  );
  if (existsSync(workspacePath)) {
    return readFileSync(workspacePath, 'utf8');
  }
  const bundleRoot = getBundledProjectBrainSkillsRoot();
  if (bundleRoot) {
    const bundledPath = join(bundleRoot, skillName, 'SKILL.md');
    if (existsSync(bundledPath)) {
      return readFileSync(bundledPath, 'utf8');
    }
  }
  return null;
}

function readBrainFile(
  skillName: string,
  workspaceRoot: string,
): string | null {
  const brainPath = join(
    workspaceRoot,
    getProjectBrainDirName(),
    `${skillName}.md`,
  );
  if (!existsSync(brainPath)) {
    return null;
  }
  return readFileSync(brainPath, 'utf8');
}

function readUnderstand(workspaceRoot: string): string {
  return readBrainFile('understand', workspaceRoot) ?? '';
}

// Re-export for callers that imported the constant from this module.
export { PROJECT_BRAIN_SKILL_ORDER, buildSkillPathsPreamble };

const KNOWN_SKILLS_LIST = [
  ...PROJECT_BRAIN_SKILL_ORDER,
  'user-stories',
  'smart-orchestrator',
  'report',
].join(', ');

/** One-shot queue entries (orchestrator is self-phasing; understand matches prod’s first prompt style). */
const SINGLE_PHASE_SKILL_NAMES = new Set(['smart-orchestrator', 'understand']);

/**
 * Build queued messages for `--skill <name>`: by default the same **six phases**
 * as `/prod` (brain → report → fix → verify → complete), except
 * `understand` and `smart-orchestrator` which stay a single message.
 */
export function buildSingleSkillQueue(
  skillName: string,
  workspaceRoot: string,
): string[] {
  const trimmed = skillName?.trim() ?? '';
  const skill = readSkill(trimmed, workspaceRoot);
  if (!skill) {
    return [
      `[SKILL: ${trimmed || '(empty)'}]\nSkill not found: neither .qwen/skills/${trimmed || '<name>'}/SKILL.md in the workspace nor the bundled default in @qwen-code/autopilot.\nPrint: ❌ SKILL NOT FOUND: ${trimmed || '(empty)'}\nKnown built-in names: ${KNOWN_SKILLS_LIST}`,
    ];
  }

  const understand = readUnderstand(workspaceRoot);
  const context = understand
    ? `PROJECT CONTEXT (from ${getProjectBrainDirName()}/understand.md):\n${understand}\n\n---\n\n`
    : '';
  const preamble = buildSkillPathsPreamble(workspaceRoot);
  const gov = buildGovernanceBlock(workspaceRoot);
  const govSep = gov ? `${gov}\n\n---\n\n` : '';
  const head = `${context}${preamble}\n\n---\n\n${govSep}`;

  if (SINGLE_PHASE_SKILL_NAMES.has(trimmed)) {
    return [`${head}${skill}`];
  }

  const date = new Date().toISOString().split('T')[0] ?? '';
  const phases = resolveSkillPhaseMessages(
    workspaceRoot,
    trimmed,
    skill,
    getProdStackContextInstruction(),
    date,
    undefined,
    'prod',
  );
  return phases.map((p, i) => (i === 0 ? `${head}${p}` : p));
}
