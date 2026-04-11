import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

/** Built-in project-brain pipeline skills under `.qwen/skills/<name>/SKILL.md`. */
export const PROJECT_BRAIN_SKILL_ORDER = [
  'understand',
  'audit-backend',
  'audit-frontend',
  'audit-roles',
  'audit-database',
  'plan',
  'build',
  'harden',
  'test-unit',
  'test-integration',
  'test-e2e',
  'test-fix',
  'prod-gate',
] as const;

function readSkill(skillName: string, workspaceRoot: string): string | null {
  const skillPath = join(
    workspaceRoot,
    '.qwen',
    'skills',
    skillName,
    'SKILL.md',
  );
  if (!existsSync(skillPath)) {
    return null;
  }
  return readFileSync(skillPath, 'utf8');
}

function readBrainFile(
  skillName: string,
  workspaceRoot: string,
): string | null {
  const brainPath = join(workspaceRoot, '.project-brain', `${skillName}.md`);
  if (!existsSync(brainPath)) {
    return null;
  }
  return readFileSync(brainPath, 'utf8');
}

function getLastCommit(workspaceRoot: string): string {
  try {
    return execSync('git rev-parse HEAD', {
      cwd: workspaceRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'no-git';
  }
}

function brainFileIsCurrent(
  skillName: string,
  workspaceRoot: string,
  currentCommit: string,
): boolean {
  if (currentCommit === 'no-git') {
    return false;
  }
  const content = readBrainFile(skillName, workspaceRoot);
  if (!content) {
    return false;
  }
  return content.includes(currentCommit);
}

function readUnderstand(workspaceRoot: string): string {
  return readBrainFile('understand', workspaceRoot) ?? '';
}

function projectHasFrontend(workspaceRoot: string): boolean {
  const understand = readUnderstand(workspaceRoot);
  return understand.includes('HAS FRONTEND: Yes');
}

function projectHasBackend(workspaceRoot: string): boolean {
  const understand = readUnderstand(workspaceRoot);
  if (!understand) {
    return true;
  }
  return understand.includes('HAS BACKEND: Yes');
}

function findCustomSkills(workspaceRoot: string): string[] {
  const skillsDir = join(workspaceRoot, '.qwen', 'skills');
  if (!existsSync(skillsDir)) {
    return [];
  }
  try {
    const names = readdirSync(skillsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    const ordered = new Set<string>(PROJECT_BRAIN_SKILL_ORDER);
    return names.filter(
      (name) =>
        !ordered.has(name) &&
        name !== 'smart-orchestrator' &&
        existsSync(join(skillsDir, name, 'SKILL.md')),
    );
  } catch {
    return [];
  }
}

/**
 * Build queued user messages for `--smart`: prefer the smart-orchestrator
 * playbook when present; otherwise deterministic skill prompts with skip hints.
 */
export function buildSmartQueue(workspaceRoot: string): string[] {
  const currentCommit = getLastCommit(workspaceRoot);
  const hasFrontend = projectHasFrontend(workspaceRoot);
  const hasBackend = projectHasBackend(workspaceRoot);

  const orchestratorSkill = readSkill('smart-orchestrator', workspaceRoot);
  if (orchestratorSkill) {
    return [orchestratorSkill];
  }

  const queue: string[] = [];

  for (const skillName of PROJECT_BRAIN_SKILL_ORDER) {
    if (
      !hasFrontend &&
      (skillName === 'audit-frontend' || skillName === 'test-e2e')
    ) {
      continue;
    }
    if (
      !hasBackend &&
      (skillName === 'audit-backend' ||
        skillName === 'audit-database' ||
        skillName === 'test-unit' ||
        skillName === 'test-integration')
    ) {
      continue;
    }

    const skill = readSkill(skillName, workspaceRoot);
    if (!skill) {
      continue;
    }

    const isCurrent = brainFileIsCurrent(
      skillName,
      workspaceRoot,
      currentCommit,
    );
    if (isCurrent) {
      const short = currentCommit.slice(0, 7);
      queue.push(
        `[SKILL: ${skillName}]\nPrevious output is current (matches git commit ${short}).\nRead .project-brain/${skillName}.md and use it as context. Skip re-running. Print: ✅ SKIP: ${skillName} (current)`,
      );
    } else {
      queue.push(skill);
    }
  }

  const customSkills = findCustomSkills(workspaceRoot);
  for (const name of customSkills) {
    const skill = readSkill(name, workspaceRoot);
    if (skill) {
      if (queue.length > 0) {
        queue.splice(queue.length - 1, 0, skill);
      } else {
        queue.push(skill);
      }
    }
  }

  return queue;
}

const KNOWN_SKILLS_LIST = [
  ...PROJECT_BRAIN_SKILL_ORDER,
  'smart-orchestrator',
].join(', ');

/**
 * Build queued messages for `--skill <name>`: one playbook plus optional
 * `.project-brain/understand.md` preamble.
 */
export function buildSingleSkillQueue(
  skillName: string,
  workspaceRoot: string,
): string[] {
  const trimmed = skillName?.trim() ?? '';
  const skill = readSkill(trimmed, workspaceRoot);
  if (!skill) {
    return [
      `[SKILL: ${trimmed || '(empty)'}]\nSkill file not found at .qwen/skills/${trimmed || '<name>'}/SKILL.md\nPrint: ❌ SKILL NOT FOUND: ${trimmed || '(empty)'}\nKnown built-in names: ${KNOWN_SKILLS_LIST}\n(Any folder under .qwen/skills/ with SKILL.md can be used if present.)`,
    ];
  }

  const understand = readUnderstand(workspaceRoot);
  const context = understand
    ? `PROJECT CONTEXT (from .project-brain/understand.md):\n${understand}\n\n---\n\n`
    : '';

  return [context + skill];
}
