import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROD_FIXED_REVIEW_SKILL_ORDER } from './prodQueue.js';

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

/**
 * Default playbooks shipped with the package:
 * - Unpacked `@qwen-code/autopilot`: `project-brain-skills/` next to `dist/`.
 * - Single-file CLI bundle (`dist/cli.js`): `dist/project-brain-skills/` (see
 *   `scripts/copy_bundle_assets.js`).
 */
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

/**
 * Prepended to `--smart` / `--skill` prompts so the model uses the CLI-bundled
 * `project-brain-skills/` tree when the workspace has no `.qwen/skills/`.
 */
export function buildSkillPathsPreamble(workspaceRoot: string): string {
  const bundleRoot = getBundledProjectBrainSkillsRoot();
  const workspaceSkillsDir = resolve(join(workspaceRoot, '.qwen', 'skills'));
  const workspaceExists = existsSync(workspaceSkillsDir);

  if (!bundleRoot) {
    return [
      '## RESOLVED SKILL PATHS',
      '',
      'Bundled `project-brain-skills` was not found on this install. Use workspace paths only:',
      `- \`${workspaceSkillsDir}\``,
      '',
    ].join('\n');
  }

  const bundleDir = resolve(bundleRoot);
  const wsPlaybook = join(workspaceSkillsDir, '<skill-name>', 'SKILL.md');
  const bdPlaybook = join(bundleDir, '<skill-name>', 'SKILL.md');

  const lines = [
    '## RESOLVED SKILL PATHS',
    '',
    'The open project may have **no** `.qwen/skills/` directory. That is expected; playbooks ship **with the CLI**.',
    '',
    'Whenever this run refers to `.qwen/skills/<skill-name>/SKILL.md`, open the file in this order:',
    '',
    `1. **Project override (if it exists):** \`${wsPlaybook}\` (replace \`<skill-name>\`).`,
    `2. **Bundled with MU Code / @qwen-code/autopilot:** \`${bdPlaybook}\` (replace \`<skill-name>\`).`,
    '',
    workspaceExists
      ? `Workspace skills dir exists: \`${workspaceSkillsDir}\` — use step 1 when the file is there; otherwise step 2.`
      : `No workspace skills dir at \`${workspaceSkillsDir}\` — use step 2 for all built-in pipeline skills.`,
    '',
    'Do **not** stop with “missing `.qwen/skills`” without reading from the bundled path in step 2.',
    '',
  ];

  return lines.join('\n');
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
  const reserved = new Set<string>([
    ...PROJECT_BRAIN_SKILL_ORDER,
    'smart-orchestrator',
    'understand',
  ]);
  const seen = new Set<string>();
  const out: string[] = [];

  const collect = (skillsDir: string) => {
    if (!existsSync(skillsDir)) {
      return;
    }
    try {
      const names = readdirSync(skillsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
      for (const name of names) {
        if (reserved.has(name)) {
          continue;
        }
        if (!existsSync(join(skillsDir, name, 'SKILL.md'))) {
          continue;
        }
        if (seen.has(name)) {
          continue;
        }
        seen.add(name);
        out.push(name);
      }
    } catch {
      /* ignore */
    }
  };

  collect(join(workspaceRoot, '.qwen', 'skills'));
  const bundle = getBundledProjectBrainSkillsRoot();
  if (bundle) {
    collect(bundle);
  }

  return out;
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
    return [
      `${buildSkillPathsPreamble(workspaceRoot)}\n\n---\n\n${orchestratorSkill}`,
    ];
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
  ...PROD_FIXED_REVIEW_SKILL_ORDER,
  'smart-orchestrator',
  'report',
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
      `[SKILL: ${trimmed || '(empty)'}]\nSkill not found: neither .qwen/skills/${trimmed || '<name>'}/SKILL.md in the workspace nor the bundled default in @qwen-code/autopilot.\nPrint: ❌ SKILL NOT FOUND: ${trimmed || '(empty)'}\nKnown built-in names: ${KNOWN_SKILLS_LIST}`,
    ];
  }

  const understand = readUnderstand(workspaceRoot);
  const context = understand
    ? `PROJECT CONTEXT (from .project-brain/understand.md):\n${understand}\n\n---\n\n`
    : '';
  const preamble = buildSkillPathsPreamble(workspaceRoot);

  return [`${context}${preamble}\n\n---\n\n${skill}`];
}
