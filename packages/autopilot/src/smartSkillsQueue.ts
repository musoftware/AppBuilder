import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectNextSkillsDynamic,
  getProdStackContextInstruction,
  PROD_FIXED_REVIEW_SKILL_ORDER,
  resolveSkillPhaseMessages,
} from './prodQueue.js';

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
  /** Same persona pass as `--prod` (`buildProdQueue`); must not rely on “extra skill” discovery. */
  ...PROD_FIXED_REVIEW_SKILL_ORDER,
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

function readUnderstand(workspaceRoot: string): string {
  return readBrainFile('understand', workspaceRoot) ?? '';
}

function projectHasFrontend(workspaceRoot: string): boolean {
  const u = readUnderstand(workspaceRoot).toLowerCase();
  return u.includes('has_frontend: yes') || u.includes('has frontend: yes');
}

function projectHasBackend(workspaceRoot: string): boolean {
  const understand = readUnderstand(workspaceRoot);
  if (!understand.trim()) {
    return true;
  }
  const u = understand.toLowerCase();
  return u.includes('has_backend: yes') || u.includes('has backend: yes');
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
 * playbook when present; otherwise the same **six-phase** cycle per skill as
 * `buildProdQueue` (brain → report → fix ×2 → verify → complete). Rerun policy:
 * missing `.project-brain/<skill>.md` → full 6 phases; file has NOT_READY/NEEDS_WORK
 * → fix-only (phases 3–6); clean → full 6 phases again (re-scan).
 */
export function buildSmartQueue(workspaceRoot: string): string[] {
  const hasFrontend = projectHasFrontend(workspaceRoot);
  const hasBackend = projectHasBackend(workspaceRoot);

  const orchestratorSkill = readSkill('smart-orchestrator', workspaceRoot);
  if (orchestratorSkill) {
    return [
      `${buildSkillPathsPreamble(workspaceRoot)}\n\n---\n\n${orchestratorSkill}`,
    ];
  }

  const preamble = buildSkillPathsPreamble(workspaceRoot);
  const date = new Date().toISOString().split('T')[0] ?? '';
  const stackInstruction = getProdStackContextInstruction();
  const queue: string[] = [];
  let firstQueued = false;

  const enqueue = (text: string) => {
    if (!firstQueued) {
      queue.push(`${preamble}\n\n---\n\n${text}`);
      firstQueued = true;
    } else {
      queue.push(text);
    }
  };

  let prevSmartSkill: string | undefined = undefined;
  const enqueuePhasedSkill = (skillName: string, skillContent: string) => {
    for (const phase of resolveSkillPhaseMessages(
      workspaceRoot,
      skillName,
      skillContent,
      stackInstruction,
      date,
      prevSmartSkill,
      'smart',
    )) {
      enqueue(phase);
    }
    prevSmartSkill = skillName;
  };

  const skillsBeforeProdGate = PROJECT_BRAIN_SKILL_ORDER.filter(
    (n) => n !== 'prod-gate',
  );

  for (const skillName of skillsBeforeProdGate) {
    if (!hasFrontend && skillName === 'audit-frontend') {
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

    if (skillName === 'understand') {
      enqueue(skill);
    } else {
      enqueuePhasedSkill(skillName, skill);
    }
  }

  const customSkills = findCustomSkills(workspaceRoot);
  for (const name of customSkills) {
    const skill = readSkill(name, workspaceRoot);
    if (skill) {
      enqueuePhasedSkill(name, skill);
    }
  }

  // Expand NEXT_SKILLS from existing brain files (smart mode only, max depth 3, no duplicates)
  const allQueuedSmart = new Set<string>([
    'understand',
    ...skillsBeforeProdGate,
    ...customSkills,
    ...PROD_FIXED_REVIEW_SKILL_ORDER,
    'prod-gate',
  ]);
  const nextSkillsExpanded = collectNextSkillsDynamic(
    workspaceRoot,
    allQueuedSmart,
    3,
  );
  for (const name of nextSkillsExpanded) {
    const skill = readSkill(name, workspaceRoot);
    if (skill) {
      enqueuePhasedSkill(name, skill);
    }
  }

  const prodGateSkill = readSkill('prod-gate', workspaceRoot);
  if (prodGateSkill) {
    enqueuePhasedSkill('prod-gate', prodGateSkill);
  }

  return queue;
}

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
 * as `--prod` / `--smart` (brain → report → fix → verify → complete), except
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
    ? `PROJECT CONTEXT (from .project-brain/understand.md):\n${understand}\n\n---\n\n`
    : '';
  const preamble = buildSkillPathsPreamble(workspaceRoot);
  const head = `${context}${preamble}\n\n---\n\n`;

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
  );
  return phases.map((p, i) => (i === 0 ? `${head}${p}` : p));
}
