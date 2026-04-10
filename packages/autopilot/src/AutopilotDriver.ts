import fs from 'node:fs/promises';
import path from 'node:path';
import { BrainstormAgent } from './brainstorm/BrainstormAgent.js';
import { SkillLoader } from './planning/SkillLoader.js';
import { SkillMatcher } from './planning/SkillMatcher.js';
import { TaskPlanner } from './planning/TaskPlanner.js';
import { writeCoreProjectDocs } from './project/coreProjectDocs.js';
import { ProjectDocsGenerator } from './project/ProjectDocsGenerator.js';
import type {
  AutopilotSettings,
  ChatMessage,
  ContextSpec,
  Task,
  TaskGraph,
} from './types.js';
import { mergeAutopilotPartialSettings } from './types.js';
import { findDesignSystem } from './designSystemsData.js';

// ─── Task system instructions (embedded in user message, no separate system prompt) ───

const SHARED_RULES = `
- If something fails, diagnose and fix it before moving on.
- Stay within the project workspace root (no writes or destructive shell actions outside that directory unless explicitly required).
- Update CONTEXT.md with decisions and progress; keep TASKS.md checkboxes aligned with what you actually did; extend CHANGELOG.md when behaviour changes.
`.trim();

const GREENFIELD_TASK_INSTRUCTIONS = (skillContent?: string): string =>
  [
    'You are executing this task in fully autonomous AI coding agent mode.',
    '',
    skillContent ? `## Active skill\n\n${skillContent}\n\n---` : '',
    'Rules:',
    '- Execute the task completely. Do not ask for clarification.',
    '- Write all necessary files, create directories, install dependencies.',
    '- Run commands to verify your work (tests, linting, etc.).',
    '- Output a concise summary of what you produced when done.',
    '- Read PRD.md and ARCHITECTURE.md before large changes.',
    SHARED_RULES,
  ]
    .filter(Boolean)
    .join('\n')
    .trim();

const BROWNFIELD_TASK_INSTRUCTIONS = (skillContent?: string): string =>
  [
    'You are executing this task in fully autonomous AI coding agent mode on an EXISTING codebase.',
    '',
    skillContent ? `## Active skill\n\n${skillContent}\n\n---` : '',
    'Rules:',
    '- READ before you WRITE. Explore relevant existing files before making any changes.',
    '- Respect the existing code style, patterns, and conventions.',
    '- Make targeted, minimal changes to achieve the task. Do not refactor unrelated areas.',
    '- Do not reinitialise, scaffold, or overwrite existing config files unless the task explicitly requires it.',
    '- Run existing tests after your changes to confirm nothing is broken. Fix regressions before moving on.',
    '- Output a concise summary of what you changed and why when done.',
    SHARED_RULES,
  ]
    .filter(Boolean)
    .join('\n')
    .trim();

function formatTaskMessage(
  task: Task,
  index: number,
  total: number,
  context: ContextSpec,
): string {
  const mode = context.projectMode ?? 'greenfield';
  const instructions =
    mode === 'brownfield'
      ? BROWNFIELD_TASK_INSTRUCTIONS(task.skill?.content)
      : GREENFIELD_TASK_INSTRUCTIONS(task.skill?.content);

  const workspaceNote = context.workspaceRoot
    ? `\n## Workspace root (stay inside this path)\n${context.workspaceRoot}\n`
    : '';

  return [
    `[AUTOPILOT TASK ${index + 1}/${total}] ${task.title}`,
    '',
    instructions,
    '',
    `## Task: ${task.title}`,
    '',
    task.description,
    workspaceNote,
    '## Project context',
    JSON.stringify(context, null, 2),
    '',
    'Execute this task completely. When done, summarize what you produced.',
  ]
    .join('\n')
    .trim();
}

const QC_ANALYSIS_RULES = `
You are running in fully autonomous AI coding agent mode.

Rules:
- READ the actual files in the workspace before drawing conclusions.
- Run existing tests (if any) to check for failures.
- Only report and fix real, concrete issues — not stylistic preferences.
- After fixing issues, run tests again to confirm everything passes.
`.trim();

function formatQualityCheckMessage(context: ContextSpec): string {
  const root = context.workspaceRoot ?? process.cwd();
  return [
    '[AUTOPILOT QUALITY CHECK]',
    '',
    QC_ANALYSIS_RULES,
    '',
    `Analyze and fix the project workspace at: ${root}`,
    '',
    'Project context:',
    JSON.stringify(context, null, 2),
    '',
    'Steps:',
    '1. Explore the workspace files to understand the current state.',
    '2. Run tests if they exist (e.g. npm test, pytest, cargo test).',
    '3. Identify all bugs, missing implementations, and logical conflicts.',
    '4. Fix any issues you find.',
    '5. When done, report what you checked and what (if anything) you fixed.',
  ]
    .join('\n')
    .trim();
}

// ─── Workspace scanner (same logic as AutopilotSession) ───────────────────────

interface WorkspaceScan {
  mode: 'greenfield' | 'brownfield';
  summary: string;
}

async function scanWorkspace(workspaceRoot: string): Promise<WorkspaceScan> {
  const read = async (rel: string): Promise<string | null> => {
    try {
      return await fs.readFile(path.join(workspaceRoot, rel), 'utf8');
    } catch {
      return null;
    }
  };

  const [
    pkgRaw,
    pyproject,
    requirements,
    setupPy,
    goMod,
    cargoToml,
    contextMd,
    dirEntries,
  ] = await Promise.all([
    read('package.json'),
    read('pyproject.toml'),
    read('requirements.txt'),
    read('setup.py'),
    read('go.mod'),
    read('Cargo.toml'),
    read('CONTEXT.md'),
    fs.readdir(workspaceRoot, { withFileTypes: true }).catch(() => null),
  ]);

  const lines: string[] = [];

  if (pkgRaw) {
    try {
      const pkg = JSON.parse(pkgRaw) as Record<string, unknown>;
      const deps = {
        ...((pkg['dependencies'] as Record<string, string> | undefined) ?? {}),
        ...((pkg['devDependencies'] as Record<string, string> | undefined) ??
          {}),
      };
      const depCount = Object.keys(deps).length;
      if (depCount > 0) {
        lines.push(
          `Node.js project: ${String(pkg['name'] ?? 'unnamed')} (${depCount} dependencies)`,
        );
        lines.push(`Key deps: ${Object.keys(deps).slice(0, 6).join(', ')}`);
        if (pkg['description'])
          lines.push(`Description: ${String(pkg['description'])}`);
      }
    } catch {
      /* ignore parse errors */
    }
  }

  if (pyproject ?? requirements ?? setupPy) {
    lines.push(
      'Python project (pyproject.toml / requirements.txt / setup.py detected)',
    );
  }

  if (goMod) {
    lines.push(`Go module: ${goMod.split('\n')[0] ?? ''}`);
  }

  if (cargoToml) {
    const nameLine = cargoToml.split('\n').find((l) => l.startsWith('name'));
    lines.push(
      `Rust project${nameLine ? ': ' + (nameLine.split('=')[1]?.trim() ?? '') : ''}`,
    );
  }

  if (contextMd) {
    const preview = contextMd.split('\n').slice(0, 6).join(' ').trim();
    lines.push(`Existing CONTEXT.md: ${preview.slice(0, 120)}`);
  }

  if (dirEntries) {
    const dirs = dirEntries
      .filter(
        (e) =>
          e.isDirectory() &&
          !e.name.startsWith('.') &&
          e.name !== 'node_modules',
      )
      .map((e) => e.name)
      .slice(0, 8);
    if (dirs.length > 0) {
      lines.push(`Top-level folders: ${dirs.join(', ')}`);
    }
  }

  return {
    mode: lines.length > 0 ? 'brownfield' : 'greenfield',
    summary: lines.join('\n'),
  };
}

// ─── Topological sort (task dependency ordering) ─────────────────────────────

function topologicalSort(tasks: Task[]): Task[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const visited = new Set<string>();
  const sorted: Task[] = [];
  const visit = (task: Task) => {
    if (visited.has(task.id)) return;
    visited.add(task.id);
    for (const depId of task.dependsOn) {
      const dep = taskMap.get(depId);
      if (dep) visit(dep);
    }
    sorted.push(task);
  };
  for (const task of tasks) visit(task);
  return sorted;
}

// ─── Plan result ──────────────────────────────────────────────────────────────

export interface AutopilotPlan {
  /** Formatted messages to submit to the normal chat pipeline one by one. */
  taskMessages: string[];
  graph: TaskGraph;
  /** Human-readable plan summary for display in chat history. */
  planSummary: string;
}

// ─── AutopilotDriver ─────────────────────────────────────────────────────────

/**
 * Runs the full autopilot planning phase (brainstorm → skill matching →
 * task planning → doc generation) internally and produces a list of
 * formatted task messages ready to be submitted to the normal chat pipeline.
 *
 * This is the UI-integrated replacement for AutopilotSession: instead of
 * exiting the Ink UI and printing to stdout, the driver stays invisible and
 * returns messages that AppContainer submits like a user would type them.
 */
export class AutopilotDriver {
  private settings: AutopilotSettings;

  constructor(settings: Partial<AutopilotSettings> = {}) {
    this.settings = mergeAutopilotPartialSettings(settings);
  }

  /**
   * Run a standalone quality check and return a single QC message.
   * Skips brainstorm and task planning — just scans the workspace and
   * produces the quality-check prompt to submit to the chat pipeline.
   */
  async qualityCheck(): Promise<string> {
    const workspaceRoot = process.cwd();
    const scan = await scanWorkspace(workspaceRoot);

    const context: ContextSpec = {
      idea: 'Quality check existing project',
      goal: 'Find and fix bugs, missing implementations, and logical conflicts',
      techStack: [],
      constraints: [],
      outputFormat: 'other',
      clarifications: {},
      workspaceRoot,
      projectMode: scan.mode === 'brownfield' ? 'brownfield' : 'greenfield',
      existingProjectSummary:
        scan.mode === 'brownfield' ? scan.summary : undefined,
    };

    return formatQualityCheckMessage(context);
  }

  /**
   * Run the full planning phase and return formatted task messages.
   *
   * @param callModel   Model call adapter (no tools — for planning only).
   * @param initialIdea The user's idea / request.
   * @param forceMode   Override workspace mode detection.
   * @param skillsPath  Custom skills directory path.
   */
  async plan(
    callModel: (messages: ChatMessage[], system: string) => Promise<string>,
    initialIdea?: string,
    forceMode?: 'brownfield' | 'greenfield',
    skillsPath?: string,
  ): Promise<AutopilotPlan> {
    const workspaceRoot = process.cwd();
    const scan = await scanWorkspace(workspaceRoot);

    const isBrownfield =
      forceMode === 'brownfield'
        ? true
        : forceMode === 'greenfield'
          ? false
          : scan.mode === 'brownfield';

    // Single-turn brainstorm: use the initial idea as input, extract context.
    const agent = new BrainstormAgent(
      this.settings,
      callModel,
      isBrownfield ? 'brownfield' : 'greenfield',
      scan.summary,
    );

    const idea =
      initialIdea?.trim() ||
      (isBrownfield
        ? 'Improve and fix any issues in the existing project.'
        : 'Build a new project based on my requirements.');

    // One chat turn to capture the idea, then extract structured context.
    await agent.chat(idea);
    const contextSpec = await agent.extractContextSpec();

    const context: ContextSpec = {
      ...contextSpec,
      workspaceRoot,
      projectMode: isBrownfield ? 'brownfield' : 'greenfield',
    };

    // Load + match skills.
    const loader = new SkillLoader(skillsPath ?? this.settings.skillsPath);
    const allSkills = await loader.loadAll();
    const matcher = new SkillMatcher(callModel);
    const selectedSkills = await matcher.match(context, allSkills);

    // Plan tasks.
    const planner = new TaskPlanner(callModel);
    const graph = await planner.plan(context, selectedSkills);

    // Generate/update project docs.
    if (!isBrownfield) {
      const docsGenerator = new ProjectDocsGenerator(callModel);
      const generatedDocs = await docsGenerator.generate(
        context,
        graph,
        () => {},
      );
      await writeCoreProjectDocs(workspaceRoot, context, graph, generatedDocs);
    } else {
      await writeCoreProjectDocs(workspaceRoot, context, graph);
    }

    // Build task message queue (topological order + quality check at end).
    const ordered = topologicalSort(graph.tasks);
    const taskMessages = ordered.map((task, i) =>
      formatTaskMessage(task, i, ordered.length, context),
    );
    taskMessages.push(formatQualityCheckMessage(context));

    const planSummary = [
      `**Autopilot plan ready** — ${graph.tasks.length} task(s) queued`,
      ...ordered.map((t, i) => `  ${i + 1}. ${t.title}`),
      '',
      'Tasks will be executed automatically. You can continue chatting normally.',
    ].join('\n');

    return { taskMessages, graph, planSummary };
  }

  /**
   * Download a DESIGN.md from getdesign.md into the current project, then
   * plan and queue tasks to apply that design system to the codebase.
   *
   * For brownfield projects: redesigns existing UI to match the design spec.
   * For greenfield projects: scaffolds the project using the design spec.
   */
  async designPlan(
    callModel: (messages: ChatMessage[], system: string) => Promise<string>,
    designSystemName: string,
    forceMode?: 'brownfield' | 'greenfield',
  ): Promise<AutopilotPlan & { designFilePath: string }> {
    const workspaceRoot = process.cwd();

    // 1. Look up design system from bundled local data
    const designSystem = findDesignSystem(designSystemName);
    if (!designSystem) {
      throw new Error(
        `Design system "${designSystemName}" not found. Run \`node scripts/download-design-systems.mjs\` to refresh the local catalog.`,
      );
    }

    const designContent = designSystem.content;

    // 2. Write DESIGN.md to project root for reference
    const designFilePath = path.join(workspaceRoot, 'DESIGN.md');
    await fs.writeFile(designFilePath, designContent, 'utf8');

    // 3. Scan workspace for mode detection
    const scan = await scanWorkspace(workspaceRoot);
    const isBrownfield =
      forceMode === 'brownfield'
        ? true
        : forceMode === 'greenfield'
          ? false
          : scan.mode === 'brownfield';

    // 4. Build context focused on design application
    const context: ContextSpec = {
      idea: isBrownfield
        ? `Apply the ${designSystemName} design system to the existing project`
        : `Build a new project using the ${designSystemName} design system`,
      goal: isBrownfield
        ? `Redesign the existing project's UI — colors, typography, spacing, components, and layout — to exactly match the ${designSystemName} DESIGN.md specification`
        : `Scaffold and build a new project that fully follows the ${designSystemName} DESIGN.md design system`,
      techStack: [],
      constraints: [
        'DESIGN.md is the single source of truth — follow it exactly',
        'Use color tokens, typography, spacing, and border-radius values from DESIGN.md',
        'Do not invent values that are not in DESIGN.md',
      ],
      outputFormat: 'other',
      clarifications: { designSystem: designSystemName },
      workspaceRoot,
      projectMode: isBrownfield ? 'brownfield' : 'greenfield',
      existingProjectSummary: isBrownfield ? scan.summary : undefined,
    };

    // 5. Use the model to plan design-specific tasks, with DESIGN.md as the skill
    const designSkill: import('./types.js').Skill = {
      name: designSystem.name,
      path: designFilePath,
      content: designContent,
      tags: ['design', 'ui', 'layout', 'css', 'theme', ...designSystem.tags],
      description: `Design system specification for ${designSystem.name}`,
    };

    const planner = new TaskPlanner(callModel);
    const graph = await planner.plan(context, [designSkill]);

    // Write project docs
    await writeCoreProjectDocs(workspaceRoot, context, graph);

    // 6. Build task messages — embed DESIGN.md content as skill in every task
    const ordered = topologicalSort(graph.tasks);
    const taskMessages = ordered.map((task, i) =>
      formatTaskMessage(
        { ...task, skill: designSkill },
        i,
        ordered.length,
        context,
      ),
    );
    taskMessages.push(formatQualityCheckMessage(context));

    const planSummary = [
      `**Design: ${designSystemName}** applied — ${graph.tasks.length} task(s) queued`,
      `DESIGN.md saved to: \`${designFilePath}\``,
      '',
      ...ordered.map((t, i) => `  ${i + 1}. ${t.title}`),
      '',
      'Tasks execute automatically through the chat pipeline.',
    ].join('\n');

    return { taskMessages, graph, planSummary, designFilePath };
  }
}
