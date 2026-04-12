/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  const p = join(root, '.project-brain', `${name}.md`);
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

/**
 * Persona / lens reviews — always appended in `buildProdQueue` after stack-selected
 * skills. Excluded from `getAvailableSkills` so empty-understand “run all” does not
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

/** Meta / orchestration playbooks — not run as per-skill mini-loops (prod-gate is the final prompt). */
const SKILL_EXCLUDE = new Set([
  'smart-orchestrator',
  'understand',
  'plan',
  'build',
  'harden',
  'prod-gate',
  'report',
  /** Large meta-playbook: run via `--skill user-stories` or smart list, not auto “run all” prod. */
  'user-stories',
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

function selectSkills(understand: string, availableSkills: string[]): string[] {
  const has = (keyword: string) =>
    understand.toLowerCase().includes(keyword.toLowerCase());

  const selected: string[] = [];

  if (availableSkills.includes('audit-security')) {
    selected.push('audit-security');
  }
  if (availableSkills.includes('audit-auth')) {
    selected.push('audit-auth');
  }
  if (availableSkills.includes('audit-env')) {
    selected.push('audit-env');
  }

  if (has('has_backend: yes')) {
    if (availableSkills.includes('audit-backend')) {
      selected.push('audit-backend');
    }
    if (availableSkills.includes('audit-database')) {
      selected.push('audit-database');
    }
    if (availableSkills.includes('audit-performance')) {
      selected.push('audit-performance');
    }
    if (availableSkills.includes('audit-logging')) {
      selected.push('audit-logging');
    }
  }

  if (has('rest') || has('api') || has('graphql') || has('grpc')) {
    if (availableSkills.includes('audit-api')) {
      selected.push('audit-api');
    }
    if (availableSkills.includes('audit-graphql') && has('graphql')) {
      selected.push('audit-graphql');
    }
    if (availableSkills.includes('audit-webhooks')) {
      selected.push('audit-webhooks');
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

  if (has('queue') || has('job') || has('worker') || has('schedule')) {
    if (availableSkills.includes('audit-queue')) {
      selected.push('audit-queue');
    }
  }

  if (has('storage') || has('upload') || has('s3') || has('disk')) {
    if (availableSkills.includes('audit-storage')) {
      selected.push('audit-storage');
    }
  }

  if (
    has('mail') ||
    has('notification') ||
    has('email') ||
    has('sms') ||
    has('push')
  ) {
    if (availableSkills.includes('audit-notifications')) {
      selected.push('audit-notifications');
    }
  }

  if (has('payment') || has('stripe') || has('paypal') || has('billing')) {
    if (availableSkills.includes('audit-payments')) {
      selected.push('audit-payments');
    }
    if (availableSkills.includes('audit-billing')) {
      selected.push('audit-billing');
    }
  }

  if (has('tenant') || has('saas') || has('subscription') || has('plan')) {
    if (availableSkills.includes('audit-multi-tenant')) {
      selected.push('audit-multi-tenant');
    }
  }

  if (has('cache') || has('redis') || has('memcached')) {
    if (availableSkills.includes('audit-cache')) {
      selected.push('audit-cache');
    }
  }

  if (has('search') || has('filter') || has('elasticsearch')) {
    if (availableSkills.includes('audit-search')) {
      selected.push('audit-search');
    }
  }

  if (availableSkills.includes('audit-dependencies')) {
    selected.push('audit-dependencies');
  }
  if (availableSkills.includes('audit-docs')) {
    selected.push('audit-docs');
  }
  if (availableSkills.includes('refactor')) {
    selected.push('refactor');
  }

  if (availableSkills.includes('audit-devops')) {
    selected.push('audit-devops');
  }

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

/** Stack line reused by \`buildProdQueue\`, \`--smart\`, and \`--skill\` phased runs. */
export function getProdStackContextInstruction(): string {
  return `Read .project-brain/understand.md and use lines starting with HAS_, DATABASE, ORM, AUTH, TEST_, MIGRATION_, PACKAGE_ as the stack summary for this workspace.`;
}

export function buildSkillMiniLoop(
  skillName: string,
  skillContent: string,
  stackInstruction: string,
  date: string,
): string[] {
  const brain = `.project-brain/${skillName}.md`;
  const brainReport = `.project-brain/${skillName}-report.md`;

  const personaPhase1Note = skillName.startsWith('review-as-')
    ? `

PLAYBOOK + BRAIN FILE (persona / lens skill):
- Follow your playbook’s headings (e.g. Themes, Flows) **and** add a mandatory **Issues** section: numbered rows with **severity** (critical|high|medium), **file path or route** (or \`docs\` / \`README\` if no code anchor), and **one-line fix**. Without anchors, later automated fix phases cannot edit the repo.
`
    : '';

  const personaFixBlock = skillName.startsWith('review-as-')
    ? `

PERSONA / PM / LENS — THIS PHASE MUST PRODUCE REPO CHANGES WHEN POSSIBLE:
- Read ${brain} and ${brainReport}. If either is missing, recreate them (full audit + report), then continue.
- For **every** Critical/High item that names a file, URL path, component, API, schema, env key, or stub: apply a **minimal real patch** now (match existing project patterns). Do **not** reply that the skill is “complete” with only analysis if VERDICT was NEEDS_WORK or NOT_READY and anchors exist.
- If themes are **strategic only** (no code hook): add a concise **Product / PM note** to README.md or \`docs/product-notes.md\` (create if needed), then list that under **High fixed** or **Manual needed** — do not use “no action” as the only outcome when NEEDS_WORK.
`
    : '';

  const mobileFixBlock =
    skillName === 'review-as-mobile'
      ? `

REVIEW-AS-MOBILE — FULL CHECKLIST, NOT A SAMPLE:
- Treat ${brainReport} **Critical** and **High** lists as an **ordered checklist**. You must attempt **every** item in this phase (and the next fix phase if any remain) — **not** one or two “example” files then stop.
- For each issue: either **patch** the named file(s), print ⚠️ **MANUAL** with a concrete step, or move to **Could not fix** with one line per row. **No orphaned issues** left unmentioned in the FIX SUMMARY.
- Prefer **small, correct** edits per file over skipping; if many files need the same token tweak, apply the pattern across **all** listed files before ending this phase.
`
      : '';

  const ctx = `
PROJECT BRAIN:
Read .project-brain/*.md when they exist (earlier steps may have created them).

MISSING BRAIN FILES — REQUIRED (applies to every phase of this skill):
- Never skip or print "SKIPPED" because ${brain} or ${brainReport} is missing.
- If either file is missing, create it by executing the ${skillName} playbook: read the codebase and docs as needed, write the file(s), then finish the current phase.
- Forbidden: "no audit report found" / "SKIPPED — file not found" as an excuse to stop.

STACK CONTEXT:
${stackInstruction}
`.trim();

  return [
    `${ctx}

${skillPhaseIntro(skillName, 1, 'WRITE BRAIN (.project-brain primary output)')}

━━━ SKILL: ${skillName.toUpperCase()} ━━━

${skillContent}
${personaPhase1Note}
You MUST write ${brain} (create or overwrite). If the file already exists from an earlier run, update it for this pass.

Format:
# ${skillName} Audit
Date: ${date}
VERDICT: PROD_READY | NOT_READY — <N> issues

Print: ✅ AUDIT DONE: ${skillName} — <N> issues found`,

    `${ctx}

${skillPhaseIntro(skillName, 2, 'WRITE REPORT (.project-brain/*-report.md)')}

If ${brain} exists: read it and use it as the audit source.
If ${brain} does NOT exist: run the full ${skillName} playbook from phase 1 (read the project), write ${brain}, then continue below.

Generate a focused report for this skill only:

─── ${skillName.toUpperCase()} REPORT ─── ${date} ───

VERDICT: PROD_READY / NOT_READY

Issues found:
 1. <issue> — <file> — <severity: critical|high|medium>
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

End with:
── ${skillName} FIX SUMMARY ──
Critical fixed: <N>
High fixed:     <N>
Manual needed:  <list>
Could not fix:  <list + reason>`,

    `${ctx}

${skillPhaseIntro(skillName, 4, 'FIX — REMAINING ITEMS')}

Ensure ${brain} and ${brainReport} exist; if not, create them (full ${skillName} audit + report) before fixing.
${skillName.startsWith('review-as-') ? '\nPersona skill: finish every remaining Critical/High item with a code, config, or doc-file edit — not summary text only.\n' : ''}${skillName === 'review-as-mobile' ? '\nMobile: if any Critical/High row from the report is still open, continue fixing until each row is resolved or explicitly listed under Could not fix.\n' : ''}
Continue with any remaining fixes from the ${skillName} skill that were not completed.
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
Print: ✅ VERIFIED [${skillName}]: all fixes confirmed`,

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
  const p = join(root, '.project-brain', `${skillName}-report.md`);
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
): string[] {
  const brain = `.project-brain/${skillName}.md`;
  const report = `.project-brain/${skillName}-report.md`;
  const full = buildSkillMiniLoop(
    skillName,
    skillContent,
    stackInstruction,
    date,
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
 * issues in saved brain/report → fix-only (phases 3–6); clean → full 6 phases
 * again (re-scan).
 */
export function resolveSkillPhaseMessages(
  root: string,
  skillName: string,
  skillContent: string,
  stackInstruction: string,
  date: string,
): string[] {
  const brainText = readBrainFile(skillName, root);
  if (!brainText.trim()) {
    return buildSkillMiniLoop(skillName, skillContent, stackInstruction, date);
  }
  const combined = `${brainText}\n${readSkillReportMarkdown(root, skillName)}`;
  if (combinedSkillTextHasOpenIssues(combined)) {
    return buildSkillMiniLoopFixOnly(
      skillName,
      skillContent,
      stackInstruction,
      date,
    );
  }
  return buildSkillMiniLoop(skillName, skillContent, stackInstruction, date);
}

// ─── UNDERSTAND PROMPT ───────────────────────────────────────────────────────

function buildUnderstandPrompt(
  root: string,
  commit: string,
  hasBrain: boolean,
): string {
  if (hasBrain) {
    return `The project brain exists and is current (commit ${commit.slice(0, 7)}).

Read .project-brain/understand.md now.

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

Write to .project-brain/understand.md:
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

Print: ✅ UNDERSTOOD: <name> — <backend> — <frontend> — <database>`;
}

// ─── FINAL PROD-GATE ─────────────────────────────────────────────────────────

function buildFinalGate(date: string): string[] {
  return [
    `PROJECT BRAIN:
Read the current .project-brain/*.md tree now (all audit and report files).

All skills have been audited and fixed.
Now run a final production readiness check across everything.

Read ALL .project-brain/audit-*.md and .project-brain/*-report.md files.

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

Save to: .project-brain/report.md
Append to .project-brain/work-log.md:
\`[${date}] prod — final gate — <PROD_READY|NOT_READY>\`

If PROD_READY → print: 🎉 PRODUCTION READY
If NOT_READY  → print: ⚠️ REMAINING ISSUES — see blockers above`,
  ];
}

// ─── MAIN BUILDER ────────────────────────────────────────────────────────────

export function buildProdQueue(workspaceRoot?: string): string[] {
  const root = workspaceRoot ?? process.cwd();
  const commit = getGitCommit(root);
  const hasBrain = brainIsCurrent(root);
  const understand = readBrainFile('understand', root);
  const date = new Date().toISOString().split('T')[0] ?? '';

  const queue: string[] = [];

  queue.push(buildUnderstandPrompt(root, commit, hasBrain));

  const available = getAvailableSkills(root);
  const selected = understand.trim()
    ? selectSkills(understand, available)
    : selectAllAvailableOrdered(available);

  const stackInstruction = getProdStackContextInstruction();

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
      ),
    );
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
      ),
    );
  }

  queue.push(...buildFinalGate(date));

  return queue;
}
