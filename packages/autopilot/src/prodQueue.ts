/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PROJECT_BRAIN_DIR = '.project-brain';

/**
 * Relative directory under the workspace root for project memory (brain files).
 * Override with `QWEN_PROJECT_BRAIN_DIR` — must be a relative path under the
 * workspace (no `..`, no Windows drive prefix).
 */
export function getProjectBrainDirName(): string {
  const raw = process.env['QWEN_PROJECT_BRAIN_DIR']?.trim();
  if (!raw) {
    return DEFAULT_PROJECT_BRAIN_DIR;
  }
  const norm = raw.replace(/\\/g, '/').replace(/^\/+/, '').trim();
  if (!norm || norm.includes('..')) {
    return DEFAULT_PROJECT_BRAIN_DIR;
  }
  if (/^[a-zA-Z]:/.test(norm)) {
    return DEFAULT_PROJECT_BRAIN_DIR;
  }
  return norm;
}

function projectBrainRoot(workspaceRoot: string): string {
  return join(workspaceRoot, getProjectBrainDirName());
}

/** POSIX-style path segments for prompts (model-facing). */
function brainPromptRel(...parts: string[]): string {
  return [getProjectBrainDirName(), ...parts].join('/');
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getGitCommit(root: string): string {
  try {
    return execSync('git rev-parse HEAD', {
      cwd: root,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'no-git';
  }
}

function readBrainFile(name: string, root: string): string {
  const p = join(projectBrainRoot(root), `${name}.md`);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
}

function brainIsCurrent(root: string): boolean {
  const content = readBrainFile('understand', root);
  if (!content) {
    return false;
  }
  const commit = getGitCommit(root);
  return commit !== 'no-git' && content.includes(commit);
}

/** Bundled playbooks next to compiled output (see smartSkillsQueue). */
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
 * Prepended to the first `/prod` prompt so the model uses the CLI-bundled
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
    `**Project governance:** If \`${brainPromptRel('preferences.md')}\` or \`${brainPromptRel('decisions.md')}\` exist, treat them as read-only user or team constraints and past architectural choices. Do not edit them unless the user explicitly asked you to.`,
    '',
  ];

  return lines.join('\n');
}

function readSkillFile(skillName: string, root: string): string | null {
  const workspacePath = join(root, '.qwen', 'skills', skillName, 'SKILL.md');
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

/** Workspace-only skill file (no bundle). Used so bundled `smart-orchestrator` does not replace phased `/prod`. */
function readWorkspaceSkillFile(
  skillName: string,
  root: string,
): string | null {
  const workspacePath = join(root, '.qwen', 'skills', skillName, 'SKILL.md');
  if (existsSync(workspacePath)) {
    return readFileSync(workspacePath, 'utf8');
  }
  return null;
}

const GOVERNANCE_PREFS_MAX = 6000;
const GOVERNANCE_DECISIONS_MAX = 24000;

function readGovernanceFile(
  root: string,
  filename: string,
  maxChars: number,
): string {
  const p = join(projectBrainRoot(root), filename);
  if (!existsSync(p)) {
    return '';
  }
  try {
    const raw = readFileSync(p, 'utf8').trim();
    if (!raw) {
      return '';
    }
    return raw.length > maxChars
      ? `${raw.slice(0, maxChars)}\n\n[truncated]`
      : raw;
  } catch {
    return '';
  }
}

/**
 * User preferences and architectural decision ledger under the project brain dir.
 * Injected into `/prod` and prepended to context recap so every phase honors them.
 */
export function buildGovernanceBlock(workspaceRoot: string): string {
  const prefs = readGovernanceFile(
    workspaceRoot,
    'preferences.md',
    GOVERNANCE_PREFS_MAX,
  );
  const decisions = readGovernanceFile(
    workspaceRoot,
    'decisions.md',
    GOVERNANCE_DECISIONS_MAX,
  );
  const blocks: string[] = [];
  if (prefs) {
    blocks.push(
      `## GOVERNING — ${brainPromptRel('preferences.md')} (user-owned; read-only for this run)\n\n` +
        prefs,
    );
  }
  if (decisions) {
    blocks.push(
      `## GOVERNING — ${brainPromptRel('decisions.md')} (append-only decision ledger; read-only for this run)\n\n` +
        decisions,
    );
  }
  return blocks.join('\n\n');
}

// ─── NEXT_SKILLS PARSING ─────────────────────────────────────────────────────

/** Extract skill names from a `NEXT_SKILLS: a, b, c` line in any brain file. */
function parseNextSkills(text: string): string[] {
  const match = text.match(/^NEXT_SKILLS:\s*(.+)$/im);
  if (!match?.[1]) return [];
  const val = match[1].trim();
  if (!val || /^none$/i.test(val)) return [];
  return val
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Walk existing project brain reports (see `getProjectBrainDirName()`) up to
 * `maxDepth` hops, collecting any skills named in NEXT_SKILLS: lines that are
 * not already in `allSeen`. Returns newly discovered skill names in discovery order.
 */
export function collectNextSkillsDynamic(
  root: string,
  initialSkills: Set<string>,
  maxDepth: number,
): string[] {
  const allSeen = new Set(initialSkills);
  const added: string[] = [];
  let frontier = [...initialSkills];

  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
    const nextFrontier: string[] = [];
    for (const skillName of frontier) {
      const brainText = readBrainFile(skillName, root);
      if (!brainText) continue;
      for (const next of parseNextSkills(brainText)) {
        if (!allSeen.has(next)) {
          allSeen.add(next);
          added.push(next);
          nextFrontier.push(next);
        }
      }
    }
    frontier = nextFrontier;
  }

  return added;
}

// ─── FILE HASH HELPERS ───────────────────────────────────────────────────────

/** Extract file-path tokens from brain/report text (e.g. `src/foo.ts:42`). */
function extractFileMentions(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  // Match: path-like token with at least one slash or a dot-extension
  const re = /(?:^|\s|`|'|"|\()([a-zA-Z0-9_./-]+\.[a-zA-Z]{1,10})(?::\d+)?/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const p = m[1];
    if (p && !seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
}

function hashFileSha1(absPath: string): string | null {
  try {
    const buf = readFileSync(absPath);
    return createHash('sha1').update(buf).digest('hex').slice(0, 10);
  } catch {
    return null;
  }
}

function loadStoredHashes(
  root: string,
  skillName: string,
): Record<string, string> {
  const p = join(projectBrainRoot(root), `${skillName}-filehashes.json`);
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as Record<string, string>;
  } catch {
    return {};
  }
}

function storeFileHashes(root: string, skillName: string, text: string): void {
  const paths = extractFileMentions(text);
  if (paths.length === 0) return;
  const hashes: Record<string, string> = {};
  for (const rel of paths) {
    const h = hashFileSha1(join(root, rel));
    if (h) hashes[rel] = h;
  }
  if (Object.keys(hashes).length === 0) return;
  try {
    const brainDir = projectBrainRoot(root);
    writeFileSync(
      join(brainDir, `${skillName}-filehashes.json`),
      JSON.stringify(hashes, null, 2),
    );
  } catch {
    /* ignore write errors */
  }
}

/**
 * Returns true if any file mentioned in `text` has changed since the last
 * stored hash snapshot for this skill. When no snapshot exists, returns false
 * (no baseline → cannot detect change → stay on fix-only path).
 */
function mentionedFilesChanged(
  root: string,
  skillName: string,
  text: string,
): boolean {
  const stored = loadStoredHashes(root, skillName);
  if (Object.keys(stored).length === 0) return false;
  for (const rel of extractFileMentions(text)) {
    if (!(rel in stored)) continue;
    const current = hashFileSha1(join(root, rel));
    if (current !== null && stored[rel] !== current) return true;
  }
  return false;
}

// ─── REPORT FORMAT VALIDATION ────────────────────────────────────────────────

/**
 * Returns true only when all four required sections are present in the correct
 * order: SUMMARY → FINDINGS → STATE → NEXT_SKILLS.
 */
function isValidReportFormat(text: string): boolean {
  const order = ['SUMMARY', 'FINDINGS', 'STATE', 'NEXT_SKILLS'];
  let lastIdx = -1;
  for (const section of order) {
    const re = new RegExp(`^${section}:`, 'im');
    const m = text.match(re);
    if (!m || m.index === undefined) return false;
    if (m.index < lastIdx) return false;
    lastIdx = m.index;
  }
  return true;
}

// ─── CONTEXT RECAP ───────────────────────────────────────────────────────────

function extractBrainSection(text: string, section: string): string {
  // Multi-line: "SECTION:\nlines\n" until next ALL_CAPS: label or end
  const re = new RegExp(
    `^${section}:\\s*\\n([\\s\\S]*?)(?=\\n[A-Z_]{2,}:|$)`,
    'im',
  );
  const m = text.match(re);
  if (m?.[1]?.trim()) return m[1].trim().slice(0, 400);
  // Inline: "SECTION: value on same line"
  const il = text.match(new RegExp(`^${section}:\\s*(.+)$`, 'im'));
  if (il?.[1]?.trim()) return il[1].trim().slice(0, 400);
  return '';
}

/**
 * Build a ≤2000-token (≈8 000 char) recap from SUMMARY and STATE sections of
 * every skill brain file under the project brain directory. Oldest entries are
 * dropped first when the limit is exceeded.
 */
function buildContextRecap(root: string, maxChars = 8000): string {
  const gov = buildGovernanceBlock(root);
  const brainDir = projectBrainRoot(root);
  if (!existsSync(brainDir) && !gov) {
    return '';
  }

  let files: string[] = [];
  try {
    if (existsSync(brainDir)) {
      files = readdirSync(brainDir)
        .filter(
          (f) =>
            f.endsWith('.md') &&
            !f.includes('-report') &&
            !f.includes('-handoff') &&
            !f.includes('-fix1') &&
            f !== 'work-log.md' &&
            f !== 'preferences.md' &&
            f !== 'decisions.md',
        )
        .sort();
    }
  } catch {
    files = [];
  }

  type Excerpt = { text: string };
  const excerpts: Excerpt[] = [];
  for (const f of files) {
    try {
      const raw = readFileSync(join(brainDir, f), 'utf8');
      const sum = extractBrainSection(raw, 'SUMMARY');
      const state = extractBrainSection(raw, 'STATE');
      if (!sum && !state) continue;
      const lines: string[] = [`[${f}]`];
      if (sum) lines.push(`SUMMARY: ${sum}`);
      if (state) lines.push(`STATE: ${state}`);
      excerpts.push({ text: lines.join('\n') });
    } catch {
      /* skip unreadable files */
    }
  }

  // Drop oldest entries until total is within limit
  while (
    excerpts.length > 1 &&
    excerpts.map((e) => e.text).join('\n\n').length > maxChars
  ) {
    excerpts.shift();
  }

  const combined =
    excerpts.length > 0
      ? `PRIOR CONTEXT (SUMMARY + STATE from earlier skill reports):\n${excerpts.map((e) => e.text).join('\n\n')}\n`
      : '';

  const parts = [gov.trim(), combined.trim()].filter(Boolean);
  if (parts.length === 0) {
    return '';
  }
  return `${parts.join('\n\n')}\n`;
}

// ─── HANDOFF NOTES ───────────────────────────────────────────────────────────

function readHandoffNote(root: string, skillName: string): string {
  const p = join(projectBrainRoot(root), `${skillName}-handoff.md`);
  if (!existsSync(p)) return '';
  try {
    return readFileSync(p, 'utf8').trim();
  } catch {
    return '';
  }
}

/**
 * Persona / lens reviews — always appended in `buildProdQueue` after stack-selected
 * skills. Excluded from `getAvailableSkills` so empty-understand "run all" does not
 * duplicate them.
 */
export const PROD_FIXED_REVIEW_SKILL_ORDER = [
  'review-as-user',
  'review-as-security',
  'review-as-a11y',
  'review-as-mobile',
  'review-as-slow-network',
  'review-as-developer',
  'review-as-performance',
  'review-as-qa',
  'review-as-pm',
  'review-as-data',
] as const;

/**
 * Default bundled pipeline order (for reserving skill dir names so “custom” skills
 * are only extras under `.qwen/skills/`).
 */
export const PROJECT_BRAIN_SKILL_ORDER = [
  'understand',
  'scaffold',
  'database-design',
  'api-design',
  'auth-setup',
  'audit-backend',
  'audit-frontend',
  'audit-roles',
  'audit-database',
  'plan',
  'build',
  'review-implementation',
  'refine',
  'harden',
  'test-unit',
  'test-integration',
  'test-e2e',
  'test-fix',
  ...PROD_FIXED_REVIEW_SKILL_ORDER,
  'deployment-config',
  'prod-gate',
] as const;

function readUnderstandForShape(root: string): string {
  return readBrainFile('understand', root);
}

function projectHasFrontend(workspaceRoot: string): boolean {
  const u = readUnderstandForShape(workspaceRoot).toLowerCase();
  return u.includes('has_frontend: yes') || u.includes('has frontend: yes');
}

function projectHasBackend(workspaceRoot: string): boolean {
  const understand = readUnderstandForShape(workspaceRoot);
  if (!understand.trim()) {
    return true;
  }
  const u = understand.toLowerCase();
  return u.includes('has_backend: yes') || u.includes('has backend: yes');
}

/**
 * Drop audits/tests that do not apply when understand.md already says there is
 * no frontend or no backend (same rules as the former `--smart` queue).
 */
function filterSelectedForProjectShape(
  selected: string[],
  root: string,
): string[] {
  const hasFrontend = projectHasFrontend(root);
  const hasBackend = projectHasBackend(root);
  return selected.filter((skillName) => {
    if (!hasFrontend && skillName === 'audit-frontend') {
      return false;
    }
    if (
      !hasBackend &&
      (skillName === 'audit-backend' ||
        skillName === 'audit-database' ||
        skillName === 'test-unit' ||
        skillName === 'test-integration')
    ) {
      return false;
    }
    return true;
  });
}

function findCustomSkills(workspaceRoot: string): string[] {
  const reserved = new Set<string>([
    ...PROJECT_BRAIN_SKILL_ORDER,
    'smart-orchestrator',
    'understand',
    'git-feature-workflow',
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

/** Meta / orchestration playbooks — not run as per-skill mini-loops (prod-gate is the final prompt). */
const SKILL_EXCLUDE = new Set([
  'smart-orchestrator',
  'understand',
  'plan',
  'build',
  'harden',
  'prod-gate',
  'report',
  /** Large meta-playbook: run via `--skill user-stories` or smart list, not auto "run all" prod. */
  'user-stories',
  /** Git checklist: appended once after final prod gate as a tool closure, not a 6-phase loop. */
  'git-feature-workflow',
  ...PROD_FIXED_REVIEW_SKILL_ORDER,
]);

function listSkillDirs(skillsDir: string): string[] {
  if (!existsSync(skillsDir)) {
    return [];
  }
  try {
    return readdirSync(skillsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

function getAvailableSkills(root: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const consider = (skillsDir: string) => {
    for (const name of listSkillDirs(skillsDir)) {
      if (SKILL_EXCLUDE.has(name)) {
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
  };

  consider(join(root, '.qwen', 'skills'));
  const bundle = getBundledProjectBrainSkillsRoot();
  if (bundle) {
    consider(bundle);
  }

  return out;
}

// ─── SKILL SELECTOR ──────────────────────────────────────────────────────────
//
// This function selects skills based on the project's characteristics from
// understand.md. Only skills that actually exist in the repository are checked
// here. To add a new audit skill:
// 1. Create packages/autopilot/project-brain-skills/<skill-name>/SKILL.md
// 2. Add '<skill-name>' to PROJECT_BRAIN_SKILL_ORDER above
// 3. Add the selection logic below with appropriate keyword matching
// ─────────────────────────────────────────────────────────────────────────────

function selectSkills(understand: string, availableSkills: string[]): string[] {
  const has = (keyword: string) =>
    understand.toLowerCase().includes(keyword.toLowerCase());

  const selected: string[] = [];

  // Core audit skills that exist in the bundled skill set
  if (has('has_backend: yes')) {
    if (availableSkills.includes('audit-backend')) {
      selected.push('audit-backend');
    }
    if (availableSkills.includes('audit-database')) {
      selected.push('audit-database');
    }
  }

  if (has('has_frontend: yes')) {
    if (availableSkills.includes('audit-frontend')) {
      selected.push('audit-frontend');
    }
    if (availableSkills.includes('audit-roles')) {
      selected.push('audit-roles');
    }
  }

  // Test skills (always include when available)
  if (availableSkills.includes('test-unit')) {
    selected.push('test-unit');
  }
  if (availableSkills.includes('test-integration')) {
    selected.push('test-integration');
  }
  if (availableSkills.includes('test-e2e')) {
    selected.push('test-e2e');
  }
  if (availableSkills.includes('test-fix')) {
    selected.push('test-fix');
  }

  // Extensibility: any other skill found in availableSkills will be included
  // automatically. This allows custom skills under .qwen/skills/ to work
  // without code changes here.
  const knownSkills = new Set([
    'audit-backend',
    'audit-database',
    'audit-frontend',
    'audit-roles',
    'test-unit',
    'test-integration',
    'test-e2e',
    'test-fix',
  ]);

  for (const skill of availableSkills) {
    if (!knownSkills.has(skill) && !selected.includes(skill)) {
      selected.push(skill);
    }
  }

  return [...new Set(selected)];
}

/** When understand.md is missing/empty, run every available skill playbook (except excluded). */
const TEST_SKILL_ORDER = [
  'test-unit',
  'test-integration',
  'test-e2e',
  'test-fix',
] as const;

const TEST_SKILL_SET = new Set<string>(TEST_SKILL_ORDER);

function selectAllAvailableOrdered(availableSkills: string[]): string[] {
  const tests = TEST_SKILL_ORDER.filter((n) => availableSkills.includes(n));
  const audits = availableSkills.filter((n) => !TEST_SKILL_SET.has(n));
  return [...audits, ...tests];
}

// ─── MINI LOOP BUILDER ───────────────────────────────────────────────────────

/** Six queued steps per skill: brain → report → fix → continue fix → verify → complete. */
export const SKILL_MINI_LOOP_PHASE_COUNT = 6;

function skillPhaseIntro(
  skillName: string,
  phase: 1 | 2 | 3 | 4 | 5 | 6,
  title: string,
): string {
  const tail =
    phase < SKILL_MINI_LOOP_PHASE_COUNT
      ? `The next queued message is **phase ${phase + 1}/${SKILL_MINI_LOOP_PHASE_COUNT}** for the same skill.`
      : `This is the **final phase** for this skill; print COMPLETE when done.`;
  return `━━━ \`${skillName}\` — PHASE ${phase}/${SKILL_MINI_LOOP_PHASE_COUNT} — ${title} ━━━
Each skill runs in **${SKILL_MINI_LOOP_PHASE_COUNT} separate queue steps**. Finish **only** phase ${phase} in this reply. ${tail}`;
}

/** Stack line reused by \`buildProdQueue\` and \`--skill\` phased runs. */
export function getProdStackContextInstruction(): string {
  const u = brainPromptRel('understand.md');
  return `Re-read ${u} now (do not use any cached reading from earlier in this queue — understand.md may have been updated by a prior skill). Use lines starting with HAS_, DATABASE, ORM, AUTH, TEST_, MIGRATION_, PACKAGE_ as the stack summary for this workspace.`;
}

export function buildSkillMiniLoop(
  skillName: string,
  skillContent: string,
  stackInstruction: string,
  date: string,
  root?: string,
  previousSkillName?: string,
  mode: 'smart' | 'prod' = 'prod',
): string[] {
  const bd = getProjectBrainDirName();
  const brain = brainPromptRel(`${skillName}.md`);
  const brainReport = brainPromptRel(`${skillName}-report.md`);
  const fix1File = brainPromptRel(`${skillName}-fix1.md`);
  const handoffFile = brainPromptRel(`${skillName}-handoff.md`);

  // Context recap block (empty string when root not provided or no brain files yet)
  const recap = root ? buildContextRecap(root) : '';
  const recapBlock = recap ? `\n${recap}\n` : '';

  // Handoff note from the previous skill (smart mode only)
  const handoffNote =
    mode === 'smart' && root && previousSkillName
      ? readHandoffNote(root, previousSkillName)
      : '';
  const handoffBlock = handoffNote
    ? `\nHANDOFF FROM PREVIOUS SKILL (${previousSkillName}):\n${handoffNote}\n`
    : '';

  const personaPhase1Note = skillName.startsWith('review-as-')
    ? `

PLAYBOOK + BRAIN FILE (persona / lens skill):
- Follow your playbook's headings (e.g. Themes, Flows) **and** add a mandatory **Issues** section: numbered rows with **severity** (critical|high|medium), **file path or route** (or \`docs\` / \`README\` if no code anchor), and **one-line fix**. Without anchors, later automated fix phases cannot edit the repo.
`
    : '';

  const personaFixBlock = skillName.startsWith('review-as-')
    ? `

PERSONA / PM / LENS — THIS PHASE MUST PRODUCE REPO CHANGES WHEN POSSIBLE:
- Read ${brain} and ${brainReport}. If either is missing, recreate them (full audit + report), then continue.
- For **every** Critical/High item that names a file, URL path, component, API, schema, env key, or stub: apply a **minimal real patch** now (match existing project patterns). Do **not** reply that the skill is "complete" with only analysis if VERDICT was NEEDS_WORK or NOT_READY and anchors exist.
- If themes are **strategic only** (no code hook): add a concise **Product / PM note** to README.md or \`docs/product-notes.md\` (create if needed), then list that under **High fixed** or **Manual needed** — do not use "no action" as the only outcome when NEEDS_WORK.
`
    : '';

  const mobileFixBlock =
    skillName === 'review-as-mobile'
      ? `

REVIEW-AS-MOBILE — FULL CHECKLIST, NOT A SAMPLE:
- Treat ${brainReport} **Critical** and **High** lists as an **ordered checklist**. You must attempt **every** item in this phase (and the next fix phase if any remain) — **not** one or two "example" files then stop.
- For each issue: either **patch** the named file(s), print ⚠️ **MANUAL** with a concrete step, or move to **Could not fix** with one line per row. **No orphaned issues** left unmentioned in the FIX SUMMARY.
- Prefer **small, correct** edits per file over skipping; if many files need the same token tweak, apply the pattern across **all** listed files before ending this phase.
`
      : '';

  const ctx = `
PROJECT BRAIN:
Read ${bd}/*.md when they exist (earlier steps may have created them).

MISSING BRAIN FILES — REQUIRED (applies to every phase of this skill):
- Never skip or print "SKIPPED" because ${brain} or ${brainReport} is missing.
- If either file is missing, create it by executing the ${skillName} playbook: read the codebase and docs as needed, write the file(s), then finish the current phase.
- Forbidden: "no audit report found" / "SKIPPED — file not found" as an excuse to stop.

STACK CONTEXT:
${stackInstruction}
${recapBlock}`.trim();

  const failStopCheck = `
QUEUE FAIL CHECK (do this first, before any other work):
Scan ${bd}/ for any brain file containing the line \`VERDICT: FAIL\`.
- If found → print ⛔ QUEUE STOPPED: <filename> reported VERDICT: FAIL — halting queue to avoid running on broken state. Do no further work.
- If not found → continue normally.
`;

  return [
    `${ctx}

${skillPhaseIntro(skillName, 1, `WRITE BRAIN (${bd} primary output)`)}
${failStopCheck}${handoffBlock}
━━━ SKILL: ${skillName.toUpperCase()} ━━━

${skillContent}
${personaPhase1Note}
You MUST write ${brain} (create or overwrite). If the file already exists from an earlier run, update it for this pass.

REPORT FORMAT — mandatory for ${brain} (reject and rewrite if any section is missing or out of order):

\`\`\`
SUMMARY:
<one line — what was scanned>
<one line — key finding>
<one line — verdict: PROD_READY | NOT_READY | NEEDS_WORK — N issues> (3 lines max)

FINDINGS:
- <file:line> — <what> — <why>
(references only — never embed raw code blocks; next skill reads files fresh)

STATE:
<1–3 sentences: what the next skill needs to know about current codebase state>

NEXT_SKILLS: <comma-separated skill names> | none
\`\`\`

Rules:
- Never embed raw code blocks. Use file:line references only.
- VERDICT: FAIL (not NOT_READY) only for unrecoverable errors.
- All four sections must be present in the order above or the report is INVALID.

Print: ✅ AUDIT DONE: ${skillName} — <N> issues found`,

    `${ctx}

${skillPhaseIntro(skillName, 2, `WRITE REPORT (${bd}/*-report.md)`)}

If ${brain} exists: read it and use it as the audit source.
If ${brain} does NOT exist: run the full ${skillName} playbook from phase 1 (read the project), write ${brain} in the format above, then continue below.

Generate a focused report for this skill only:

─── ${skillName.toUpperCase()} REPORT ─── ${date} ───

VERDICT: PROD_READY / NOT_READY

Issues found:
 1. <issue> — <file:line> — <severity: critical|high|medium>
 2. ...

Critical (fix now):
 - <item>

High priority (fix soon):
 - <item>

─────────────────────────────────

You MUST write ${brainReport} (create or overwrite).

Print: ✅ REPORT: ${skillName}`,

    `${ctx}

${skillPhaseIntro(skillName, 3, 'FIX — CRITICAL + HIGH')}

If ${brainReport} or ${brain} is missing: create the missing file(s) by running the ${skillName} audit + report steps (read the codebase as needed), then continue.

If both exist: read ${brainReport} and ${brain}.
${personaFixBlock}${mobileFixBlock}
Fix every Critical issue now. Then fix High Priority issues.

RULES:
- Use brain files as the issue list when they are substantive; if they are empty or missing, derive issues from the codebase.
- Find ONE working example of each fix type in the existing codebase
- Every fix must follow the same patterns already in this project
- Actual code changes only — no plans, no descriptions

Fix in order: Security → Broken code → Missing functionality → Config gaps

For each fix:
Print: ✅ FIXED [${skillName}]: <file> — <one line what changed>

If migration needed: print ⚠️ MANUAL: <migration command>

End with this summary AND write it to ${fix1File}:
── ${skillName} FIX SUMMARY ──
Critical fixed: <N>
High fixed:     <N>
Manual needed:  <list>
Could not fix:  <list + reason>

(Write the above summary block verbatim to ${fix1File} so the next fix phase can read it.)`,

    `${ctx}

${skillPhaseIntro(skillName, 4, 'FIX — REMAINING ITEMS')}

Read ${fix1File} first (written by the previous fix phase) to see what was already done.

Ensure ${brain} and ${brainReport} exist; if not, create them (full ${skillName} audit + report) before fixing.
${skillName.startsWith('review-as-') ? '\nPersona skill: finish every remaining Critical/High item with a code, config, or doc-file edit — not summary text only.\n' : ''}${skillName === 'review-as-mobile' ? '\nMobile: if any Critical/High row from the report is still open, continue fixing until each row is resolved or explicitly listed under Could not fix.\n' : ''}
Continue with any remaining fixes from the ${skillName} skill that were not completed in phase 3.
Same rules: actual changes, follow existing patterns.
Print after each: ✅ done [${skillName}]: <one line>

If all done: print ✅ ${skillName.toUpperCase()} FIXES COMPLETE`,

    `${ctx}

${skillPhaseIntro(skillName, 5, 'VERIFY — CONFIRM FIXES IN FILES')}

Ensure ${brain} exists (create via full ${skillName} run if missing).

Verify that all ${skillName} fixes were actually applied.
${skillName === 'review-as-mobile' ? `\nMobile: re-read ${brainReport} and treat **every** Critical/High row as a gate — open each cited file; do not print VERIFIED if any row is still broken or unaddressed.\n` : ''}
Open each source file mentioned in ${brain}
and confirm the fix is in place by reading the file.

If any issue is still present:
Print: ❌ STILL BROKEN [${skillName}]: <file> — <exact issue>

If all clear:
Print: ✅ VERIFIED [${skillName}]: all fixes confirmed

${
  mode === 'smart'
    ? `After verifying, write a one-paragraph handoff note to ${handoffFile}:
- What was audited and fixed
- What issues remain (if any)
- What the NEXT skill should focus on or be aware of
(This note will be injected into the next skill's phase 1 prompt.)`
    : ''
}`,

    `${ctx}

${skillPhaseIntro(skillName, 6, 'FINAL PASS — CLOSE SKILL')}

Ensure ${brain} and ${brainReport} exist before closing this skill (create them if still missing).

If the previous check found remaining ${skillName} issues — fix them now.
Same rules. Actual changes only.
Print after each: ✅ done [${skillName}]: <one line>

If nothing remaining: print ✅ ${skillName.toUpperCase()} COMPLETE — moving to next skill`,
  ];
}

function readSkillReportMarkdown(root: string, skillName: string): string {
  const p = join(projectBrainRoot(root), `${skillName}-report.md`);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
}

/** True when brain/report text still calls for follow-up work. */
function combinedSkillTextHasOpenIssues(combined: string): boolean {
  if (!combined.trim()) {
    return false;
  }
  return (
    /\bNEEDS_WORK\b/i.test(combined) ||
    /\bNOT_READY\b/i.test(combined) ||
    /\bNOT READY\b/i.test(combined) ||
    /VERDICT:\s*(NOT_READY|NOT READY|NEEDS_WORK)/i.test(combined)
  );
}

/** Phases 3–6 only: fix / continue / verify / complete — no full re-audit. */
export function buildSkillMiniLoopFixOnly(
  skillName: string,
  skillContent: string,
  stackInstruction: string,
  date: string,
  root?: string,
  previousSkillName?: string,
  mode: 'smart' | 'prod' = 'prod',
): string[] {
  const brain = brainPromptRel(`${skillName}.md`);
  const report = brainPromptRel(`${skillName}-report.md`);
  const full = buildSkillMiniLoop(
    skillName,
    skillContent,
    stackInstruction,
    date,
    root,
    previousSkillName,
    mode,
  );
  const tail = full.slice(2);
  if (tail.length === 0) {
    return full;
  }
  const note = `RERUN POLICY — FIX PATH (keep phases 3→6 only):
- ${brain} already exists and still shows **open issues** (NOT_READY / NEEDS_WORK / etc.).
- **Do not** redo a full phase 1–2 re-scan; use the existing ${brain} and ${report} as the issue list. If either file is missing, recreate from the repo, then continue with fixes.
- Complete this skill through fix → verify → complete only.\n\n`;
  return [`${note}${tail[0]!}`, ...tail.slice(1)];
}

/**
 * Per-skill queue: missing brain → full 6 phases (scan/write then fix); open
 * issues in saved brain/report → fix-only (phases 3–6) unless mentioned files
 * have changed (in which case full re-audit); clean → full 6 phases again
 * (re-scan).
 */
export function resolveSkillPhaseMessages(
  root: string,
  skillName: string,
  skillContent: string,
  stackInstruction: string,
  date: string,
  previousSkillName?: string,
  mode: 'smart' | 'prod' = 'prod',
): string[] {
  const brainText = readBrainFile(skillName, root);
  if (!brainText.trim()) {
    return buildSkillMiniLoop(
      skillName,
      skillContent,
      stackInstruction,
      date,
      root,
      previousSkillName,
      mode,
    );
  }

  // Smart mode only: if brain file doesn't match the new report format, treat as stale → full run
  if (mode === 'smart' && !isValidReportFormat(brainText)) {
    return buildSkillMiniLoop(
      skillName,
      skillContent,
      stackInstruction,
      date,
      root,
      previousSkillName,
      mode,
    );
  }

  const reportText = readSkillReportMarkdown(root, skillName);
  const combined = `${brainText}\n${reportText}`;

  if (combinedSkillTextHasOpenIssues(combined)) {
    // Smart mode only: if any file mentioned in the old report has changed since
    // it was written, run a full re-audit instead of fix-only.
    if (mode === 'smart' && mentionedFilesChanged(root, skillName, combined)) {
      return buildSkillMiniLoop(
        skillName,
        skillContent,
        stackInstruction,
        date,
        root,
        previousSkillName,
        mode,
      );
    }
    // Smart mode only: snapshot current file hashes so the next run can detect drift
    if (mode === 'smart') {
      storeFileHashes(root, skillName, combined);
    }
    return buildSkillMiniLoopFixOnly(
      skillName,
      skillContent,
      stackInstruction,
      date,
      root,
      previousSkillName,
      mode,
    );
  }

  return buildSkillMiniLoop(
    skillName,
    skillContent,
    stackInstruction,
    date,
    root,
    previousSkillName,
    mode,
  );
}

// ─── PRODUCT LIFECYCLE (OPTIONAL PREFIX, MERGED WITH STANDARD /PROD) ─────────

/** Number of main lifecycle phases prepended when `includeProductLifecycle` or `QWEN_PROD_PRODUCT_LIFECYCLE` is set. */
export const PRODUCT_LIFECYCLE_PHASE_COUNT = 16;

type ProductLifecycleMainPhase = {
  readonly title: string;
  readonly focus: string;
  readonly suggestedSkills: readonly string[];
};

/**
 * Main product phases (1..16). Each phase queues a guidance block plus a
 * filtered subset of pipeline skills; the standard `/prod` tail still runs
 * afterward unchanged.
 */
const PRODUCT_LIFECYCLE_MAIN_PHASES: readonly ProductLifecycleMainPhase[] = [
  {
    title: 'Discovery & problem framing',
    focus:
      'Problem statement, stakeholders, success criteria, and explicit in/out of scope.',
    suggestedSkills: ['plan', 'user-stories'],
  },
  {
    title: 'Requirements & acceptance',
    focus:
      'User-visible behavior, acceptance signals, and traceability from stories to code.',
    suggestedSkills: ['user-stories', 'plan'],
  },
  {
    title: 'Architecture & boundaries',
    focus:
      'Modules, boundaries, dependency direction, and where cross-cutting concerns live.',
    suggestedSkills: ['plan', 'audit-backend'],
  },
  {
    title: 'Data model & persistence',
    focus:
      'Schema, migrations, integrity, queries, and data lifecycle (PII, retention).',
    suggestedSkills: ['audit-database', 'plan'],
  },
  {
    title: 'Backend services & APIs',
    focus:
      'Endpoints, validation, errors, idempotency, and service-level contracts.',
    suggestedSkills: ['audit-backend', 'build'],
  },
  {
    title: 'Identity, authorization & roles',
    focus:
      'Auth flows, session/JWT, role matrices, and enforcement points in code.',
    suggestedSkills: ['audit-roles', 'audit-backend'],
  },
  {
    title: 'Frontend UX & UI',
    focus: 'Screens, states, navigation, forms, and client-side data fetching.',
    suggestedSkills: ['audit-frontend', 'build'],
  },
  {
    title: 'Integrations & external dependencies',
    focus:
      'Third-party APIs, webhooks, SDKs, config, and failure modes when deps fail.',
    suggestedSkills: ['audit-backend', 'harden'],
  },
  {
    title: 'Unit & narrow tests',
    focus:
      'Fast tests, fixtures, mocks, and coverage of critical paths and edge cases.',
    suggestedSkills: ['test-unit', 'test-fix'],
  },
  {
    title: 'Integration tests',
    focus: 'Service boundaries, DB, queues, and multi-component scenarios.',
    suggestedSkills: ['test-integration', 'test-fix'],
  },
  {
    title: 'Performance & scalability',
    focus:
      'Hot paths, N+1 queries, payloads, caching, and load-sensitive design.',
    suggestedSkills: ['review-as-performance', 'harden'],
  },
  {
    title: 'Security',
    focus:
      'Threats, authZ bugs, injection, secrets, headers, and dependency risk.',
    suggestedSkills: ['review-as-security', 'audit-backend'],
  },
  {
    title: 'Accessibility & inclusive UX',
    focus: 'Keyboard, semantics, contrast, motion, and assistive-tech flows.',
    suggestedSkills: ['review-as-a11y', 'audit-frontend'],
  },
  {
    title: 'Resilience & degraded behavior',
    focus:
      'Timeouts, retries, partial outages, and user-visible failure handling.',
    suggestedSkills: ['review-as-slow-network', 'harden'],
  },
  {
    title: 'Cross-functional quality',
    focus: 'Consistency, maintainability, logging, and engineering hygiene.',
    suggestedSkills: ['review-as-qa', 'review-as-developer'],
  },
  {
    title: 'Release readiness & narrative',
    focus:
      'What ships, known gaps, operational handoff, and stakeholder summary.',
    suggestedSkills: ['review-as-pm', 'report', 'harden'],
  },
];

function shouldIncludeProductLifecycle(
  includeProductLifecycleOption?: boolean,
): boolean {
  if (includeProductLifecycleOption !== undefined) {
    return includeProductLifecycleOption;
  }
  const raw = process.env['QWEN_PROD_PRODUCT_LIFECYCLE']?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

function buildMainProductPhaseBlock(
  root: string,
  phaseIndex1Based: number,
  phase: ProductLifecycleMainPhase,
): string {
  const u = brainPromptRel('understand.md');
  return [
    `## MAIN PRODUCT PHASE ${phaseIndex1Based}/${PRODUCT_LIFECYCLE_PHASE_COUNT} — ${phase.title}`,
    '',
    '**Merged `/prod`:** This block is the product-lifecycle spine. After all main phases complete, this run continues with the **standard** queue (global understand → stacked skills → dynamic NEXT_SKILLS → persona reviews → final gate).',
    '',
    `**Focus for this phase:** ${phase.focus}`,
    '',
    '1. **Smart run** — Read the repo and project brain files relevant to this focus (honor governance in `preferences.md` / `decisions.md` when present).',
    `2. **Phase-scoped understand** — Update \`${u}\` only where this focus applies (delta-style). If it does not exist yet, create a minimal baseline.`,
    '3. **Derive sub-phases** — List 2–5 concrete sub-steps compatible with this project’s stack; execute them in order before moving on.',
    `4. **Phase finish** — Print exactly: ✅ MAIN PHASE ${phaseIndex1Based}/${PRODUCT_LIFECYCLE_PHASE_COUNT} COMPLETE — <one-line outcome>`,
    '',
    'Then run each **queued skill playbook** that follows this message for this phase (standard PHASE mini-loops apply). Skip a playbook only if it is truly not applicable.',
  ].join('\n');
}

function pushProductLifecyclePrefix(
  queue: string[],
  root: string,
  preamble: string,
  governanceSep: string,
  stackInstruction: string,
  date: string,
  phaseMode: 'smart',
): { prevSkill: string | undefined } {
  let prevSkill: string | undefined = undefined;
  const lifecycleSkillSeen = new Set<string>();
  for (let i = 0; i < PRODUCT_LIFECYCLE_MAIN_PHASES.length; i++) {
    const phase = PRODUCT_LIFECYCLE_MAIN_PHASES[i]!;
    const idx = i + 1;
    const block = buildMainProductPhaseBlock(root, idx, phase);
    const open =
      i === 0 ? `${preamble}${governanceSep}\n\n---\n\n${block}` : block;
    queue.push(open);
    const filtered = filterSelectedForProjectShape(
      [...phase.suggestedSkills],
      root,
    );
    for (const skillName of filtered) {
      if (lifecycleSkillSeen.has(skillName)) {
        continue;
      }
      const skillContent = readSkillFile(skillName, root);
      if (!skillContent) {
        continue;
      }
      lifecycleSkillSeen.add(skillName);
      queue.push(
        ...resolveSkillPhaseMessages(
          root,
          skillName,
          skillContent,
          stackInstruction,
          date,
          prevSkill,
          phaseMode,
        ),
      );
      prevSkill = skillName;
    }
  }
  return { prevSkill };
}

// ─── UNDERSTAND PROMPT ───────────────────────────────────────────────────────

function buildUnderstandPrompt(
  root: string,
  commit: string,
  hasBrain: boolean,
): string {
  const understandPath = brainPromptRel('understand.md');
  if (hasBrain) {
    return `The project brain exists and is current (commit ${commit.slice(0, 7)}).

Read ${understandPath} now.

Check only files changed since last scan:
git diff --name-only HEAD~1 HEAD

Update only the sections in understand.md that changed.
Add at top: Last commit: ${commit}

Then print your understanding in this format:
---UNDERSTAND SUMMARY---
APP: <name — one sentence>
TYPE: <ERP|CRM|SaaS|API|CLI|Web app|Mobile backend|other>
HAS_FRONTEND: Yes | No — <framework>
HAS_BACKEND: Yes | No — <framework>
DATABASE: <name>
ORM: <name>
AUTH: <method>
ROLES: <list>
KEY FEATURES: <list>
QUEUE/JOBS: Yes | No
STORAGE: Yes | No
PAYMENTS: Yes | No
NOTIFICATIONS: Yes | No
MULTI_TENANT: Yes | No
CACHE: Yes | No
---END SUMMARY---

Print: ✅ BRAIN UPDATED (delta scan)`;
  }

  return `Read the ENTIRE project codebase before doing anything.

Read in this order:
1. All dependency files: package.json, composer.json, requirements.txt, *.csproj, Gemfile, pom.xml, go.mod
2. README.md and any docs/ folder
3. Main entry file
4. All route / controller files
5. All model / schema / migration files
6. All auth / role / permission files
7. All frontend screen / component / view files (if any)
8. Config files and .env.example / appsettings.json

Detect the stack from files (do not assume a single framework — infer from manifests and entrypoints).

Write to ${understandPath}:
# Project Understanding
Last commit: ${commit}
Last scan: ${new Date().toISOString().split('T')[0]}

APP: <name — one sentence>
TYPE: <app type>
HAS_FRONTEND: Yes | No — <framework>
HAS_BACKEND: Yes | No — <framework>
DATABASE: <name> ORM: <name>
AUTH: <method>
TEST_FRAMEWORK: <name> TEST_COMMAND: <command> TEST_FOLDER: <folder>
MIGRATION_COMMAND: <command> MIGRATION_FOLDER: <folder>
PACKAGE_MANAGER: <name>

ROLES: <list each with where defined in code>
KEY FEATURES: <list each as COMPLETE|PARTIAL|STUB — with file>
QUEUE/JOBS: Yes | No
STORAGE: Yes | No
PAYMENTS: Yes | No
NOTIFICATIONS: Yes | No
MULTI_TENANT: Yes | No
CACHE: Yes | No
SEARCH: Yes | No

FOLDER MAP:
<folder>: <what lives here>

SUMMARY:
<app name> — <one-sentence description>
Stack: <frontend> + <backend> + <database>
Layers found: <comma-separated list>

FINDINGS:
- <file:line> — <layer> — <what it is>

STATE:
HAS_FRONTEND: Yes|No | HAS_BACKEND: Yes|No | DATABASE: <name> | AUTH: <method> | ROLES: <list>

NEXT_SKILLS: <comma-separated skills matching layers found>

Print: ✅ UNDERSTOOD: <name> — <backend> — <frontend> — <database>`;
}

// ─── FINAL PROD-GATE ─────────────────────────────────────────────────────────

function buildFinalGate(date: string): string[] {
  const bd = getProjectBrainDirName();
  return [
    `PROJECT BRAIN:
Read the current ${bd}/*.md tree now (all audit and report files).

All skills have been audited and fixed.
Now run a final production readiness check across everything.

Read ALL ${bd}/audit-*.md and ${bd}/*-report.md files.

Check every item:
CODE: no TODOs, no hardcoded secrets, no dead code, proper error handling
FEATURES: all COMPLETE features work end-to-end, all roles have correct access
TESTS: all tests pass, critical paths covered, each role tested
CONFIG: all env vars in .env.example, no hardcoded config
SECURITY: all routes guarded, role checks in backend, no sensitive data in DOM
RELIABILITY: friendly errors, logging in place, 401/404 handled

Generate final report:

─────────────────────────────────────────────────────────────────
FINAL PROD REPORT — ${date}
─────────────────────────────────────────────────────────────────

┌──────────────────────┬──────────────┬───────────────────────────────────────┐
│ Skill                │ Status       │ Summary                               │
├──────────────────────┼──────────────┼───────────────────────────────────────┤
│ <each skill ran>     │ ✅/❌        │ <one line result>                     │
└──────────────────────┴──────────────┴───────────────────────────────────────┘

Overall: <N>% — PROD_READY / NOT READY

Remaining blockers (if any):
 1. <blocker>

─────────────────────────────────────────────────────────────────

Save to: ${bd}/report.md
Append to: ${bd}/work-log.md:
\`[${date}] prod — final gate — <PROD_READY|NOT_READY>\`

If PROD_READY → print: 🎉 PRODUCTION READY
If NOT_READY  → print: ⚠️ REMAINING ISSUES — see blockers above`,
  ];
}

const PROD_GIT_TOOL_SKILL_NAME = 'git-feature-workflow';

function prodGitToolAppendEnabled(): boolean {
  return process.env['QWEN_PROD_SKIP_GIT_TOOL'] !== '1';
}

/**
 * One queued message after the final prod gate: treat Git as shell **tools** to
 * commit, branch, merge, and push — not a six-phase skill mini-loop.
 */
function buildProdGitToolMessage(
  root: string,
  preamble: string,
  governanceBlock: string,
): string | null {
  const toolBody = readSkillFile(PROD_GIT_TOOL_SKILL_NAME, root);
  if (!toolBody) {
    return null;
  }
  const govSep = governanceBlock
    ? `\n\n---\n\n${governanceBlock}\n\n---\n\n`
    : '';
  const header = [
    '## GIT TOOL — persist `/prod` work',
    '',
    '**Not** a PHASE 1/6 skill loop. Use **shell / Git as tools** (`git status`, `git add`, `git commit`, `git push`, branch/merge when appropriate).',
    '',
    'Earlier prompts implemented fixes and features. **Commit** any remaining changes with Conventional Commits, then integrate/push/cleanup per the checklist below and your team’s policy.',
    '',
  ].join('\n');
  return `${preamble}${govSep}${header}\n${toolBody}`;
}

// ─── MAIN BUILDER ────────────────────────────────────────────────────────────

export type BuildProdQueueOptions = {
  /**
   * When `true` (default), a workspace `.qwen/skills/smart-orchestrator/SKILL.md`
   * replaces the phased queue with **one** user message (model must run all phases
   * in that turn — often stops early with a chatty reply). When `false`, always
   * build the phased queue (understand → skills → …) for reliable multi-turn
   * drains (e.g. interactive `/prod`).
   */
  useWorkspaceOrchestrator?: boolean;
  /**
   * When `true`, prepend 16 main product-lifecycle phases (each: guidance + related
   * skill mini-loops) **before** the standard prod tail. When omitted, the env
   * `QWEN_PROD_PRODUCT_LIFECYCLE` (`1` / `true` / `yes`) enables the same. Ignored
   * when the workspace orchestrator shortcut is used (single-message prod).
   */
  includeProductLifecycle?: boolean;
};

export function buildProdQueue(
  workspaceRoot?: string,
  options?: BuildProdQueueOptions,
): string[] {
  const root = workspaceRoot ?? process.cwd();
  const useOrchestrator = options?.useWorkspaceOrchestrator !== false;

  const orchestrator = readWorkspaceSkillFile('smart-orchestrator', root);
  if (orchestrator && useOrchestrator) {
    const pre = buildSkillPathsPreamble(root);
    const gov = buildGovernanceBlock(root);
    const govSep = gov ? `\n\n---\n\n${gov}` : '';
    const out = [`${pre}${govSep}\n\n---\n\n${orchestrator}`];
    if (prodGitToolAppendEnabled()) {
      const gitMsg = buildProdGitToolMessage(root, pre, gov);
      if (gitMsg) {
        out.push(gitMsg);
      }
    }
    return out;
  }

  const preamble = buildSkillPathsPreamble(root);
  const governance = buildGovernanceBlock(root);
  const commit = getGitCommit(root);
  const hasBrain = brainIsCurrent(root);
  const understand = readBrainFile('understand', root);
  const date = new Date().toISOString().split('T')[0] ?? '';

  const queue: string[] = [];

  const govSep = governance ? `\n\n---\n\n${governance}` : '';
  const stackInstruction = getProdStackContextInstruction();
  const phaseMode = 'smart' as const;

  let prevSkill: string | undefined = undefined;

  if (shouldIncludeProductLifecycle(options?.includeProductLifecycle)) {
    const life = pushProductLifecyclePrefix(
      queue,
      root,
      preamble,
      govSep,
      stackInstruction,
      date,
      phaseMode,
    );
    prevSkill = life.prevSkill;
    queue.push(
      [
        '## /PROD — GLOBAL PROJECT BRAIN REFRESH',
        '',
        'Governance and **RESOLVED SKILL PATHS** from the opening message of this run still apply.',
        '',
        '---',
        '',
        buildUnderstandPrompt(root, commit, hasBrain),
      ].join('\n'),
    );
  } else {
    queue.push(
      `${preamble}${govSep}\n\n---\n\n${buildUnderstandPrompt(root, commit, hasBrain)}`,
    );
  }

  const available = getAvailableSkills(root);
  const selectedRaw = understand.trim()
    ? selectSkills(understand, available)
    : selectAllAvailableOrdered(available);
  const selected = filterSelectedForProjectShape(selectedRaw, root);

  for (const skillName of selected) {
    const skillContent = readSkillFile(skillName, root);
    if (!skillContent) {
      continue;
    }

    queue.push(
      ...resolveSkillPhaseMessages(
        root,
        skillName,
        skillContent,
        stackInstruction,
        date,
        prevSkill,
        phaseMode,
      ),
    );
    prevSkill = skillName;
  }

  const customSkills = findCustomSkills(root);
  for (const name of customSkills) {
    const skillContent = readSkillFile(name, root);
    if (!skillContent) {
      continue;
    }
    queue.push(
      ...resolveSkillPhaseMessages(
        root,
        name,
        skillContent,
        stackInstruction,
        date,
        prevSkill,
        phaseMode,
      ),
    );
    prevSkill = name;
  }

  const skillsSeenBeforeDynamic = new Set<string>([
    'understand',
    ...selected,
    ...customSkills,
    ...PROD_FIXED_REVIEW_SKILL_ORDER,
  ]);
  const nextExpanded = collectNextSkillsDynamic(
    root,
    skillsSeenBeforeDynamic,
    3,
  ).filter((n) => n !== 'prod-gate');

  for (const name of nextExpanded) {
    const skillContent = readSkillFile(name, root);
    if (!skillContent) {
      continue;
    }
    queue.push(
      ...resolveSkillPhaseMessages(
        root,
        name,
        skillContent,
        stackInstruction,
        date,
        prevSkill,
        phaseMode,
      ),
    );
    prevSkill = name;
  }

  for (const skillName of PROD_FIXED_REVIEW_SKILL_ORDER) {
    const skillContent = readSkillFile(skillName, root);
    if (!skillContent) {
      continue;
    }
    queue.push(
      ...resolveSkillPhaseMessages(
        root,
        skillName,
        skillContent,
        stackInstruction,
        date,
        prevSkill,
        phaseMode,
      ),
    );
    prevSkill = skillName;
  }

  queue.push(...buildFinalGate(date));

  if (prodGitToolAppendEnabled()) {
    const gitMsg = buildProdGitToolMessage(root, preamble, governance);
    if (gitMsg) {
      queue.push(gitMsg);
    }
  }

  return queue;
}

/** Pre-flight stats for UI copy (not a token or wall-clock estimate). */
export interface AutopilotQueueSummary {
  messageCount: number;
  labeledPhaseMarkers: number;
}

export function summarizeAutopilotQueue(
  messages: string[],
): AutopilotQueueSummary {
  return {
    messageCount: messages.length,
    labeledPhaseMarkers: messages.filter((m) => /\bPHASE \d+\/\d+/i.test(m))
      .length,
  };
}
