import chalk from 'chalk';
import fs from 'node:fs/promises';
import path from 'node:path';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { BrainstormAgent } from './brainstorm/BrainstormAgent.js';
import { SkillLoader } from './planning/SkillLoader.js';
import { SkillMatcher } from './planning/SkillMatcher.js';
import { TaskPlanner } from './planning/TaskPlanner.js';
import { TaskRunner } from './autopilot/TaskRunner.js';
import { AutopilotOrchestrator } from './autopilot/AutopilotOrchestrator.js';
import { ProgressReporter } from './autopilot/ProgressReporter.js';
import { QualityCheckLoop } from './autopilot/QualityCheckLoop.js';
import { writeCoreProjectDocs } from './project/coreProjectDocs.js';
import { ProjectDocsGenerator } from './project/ProjectDocsGenerator.js';
import type { AutopilotSettings, ChatMessage } from './types.js';
import { mergeAutopilotPartialSettings } from './types.js';

interface WorkspaceScan {
  mode: 'greenfield' | 'brownfield';
  summary: string;
}

/**
 * Inspects the workspace directory to decide whether we are starting from scratch
 * (greenfield) or working inside an existing project (brownfield).
 *
 * A workspace is considered brownfield when it has substantive existing code:
 * a manifest file (package.json, pyproject.toml, Cargo.toml, go.mod, etc.) with
 * dependencies declared, or a non-empty source directory.
 */
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

export class AutopilotSession {
  private settings: AutopilotSettings;
  private callModel: (
    messages: ChatMessage[],
    system: string,
  ) => Promise<string>;
  private callModelWithTools: (
    messages: ChatMessage[],
    system: string,
    yolo: boolean,
  ) => Promise<string>;

  constructor(
    callModel: (messages: ChatMessage[], system: string) => Promise<string>,
    callModelWithTools: (
      messages: ChatMessage[],
      system: string,
      yolo: boolean,
    ) => Promise<string>,
    settings: Partial<AutopilotSettings> = {},
  ) {
    this.settings = mergeAutopilotPartialSettings(settings);
    this.callModel = callModel;
    this.callModelWithTools = callModelWithTools;
  }

  async run(
    initialIdea?: string,
    forceMode?: 'brownfield' | 'greenfield',
  ): Promise<void> {
    const rl = readline.createInterface({ input, output });

    const workspaceRoot = process.cwd();
    const scan = await scanWorkspace(workspaceRoot);
    const isBrownfield =
      forceMode === 'brownfield'
        ? true
        : forceMode === 'greenfield'
          ? false
          : scan.mode === 'brownfield';

    console.log('\n' + chalk.bold.cyan('━'.repeat(50)));
    console.log(chalk.bold(' MU Code — Autopilot mode'));
    if (isBrownfield) {
      console.log(chalk.dim(' Existing project detected — brownfield mode.'));
      console.log(chalk.dim(' Describe what you want to add or change.'));
    } else {
      console.log(chalk.dim(' Type your idea. Type "go" when ready to build.'));
    }
    console.log(chalk.cyan('━'.repeat(50)) + '\n');

    const agent = new BrainstormAgent(
      this.settings,
      this.callModel,
      scan.mode,
      scan.summary,
    );

    let seed = initialIdea;
    while (true) {
      const userInput = seed ?? (await rl.question(chalk.bold.blue('You: ')));
      seed = undefined;

      const { reply, ready } = await agent.chat(userInput);

      if (ready) {
        console.log(
          chalk.bold.green(
            isBrownfield
              ? '\n✓ Got it. Planning your changes...\n'
              : '\n✓ Got it. Building your plan...\n',
          ),
        );
        break;
      }

      console.log(chalk.bold.cyan('\nMU: ') + reply + '\n');
    }

    rl.close();

    console.log(chalk.dim('  Extracting project context from brainstorm…'));
    const contextSpec = await agent.extractContextSpec();
    const context = {
      ...contextSpec,
      workspaceRoot,
      projectMode: (isBrownfield ? 'brownfield' : 'greenfield') as
        | 'brownfield'
        | 'greenfield',
    };

    console.log(chalk.dim('Loading skills...'));
    const loader = new SkillLoader(
      this.settings.skillsPath,
      this.settings.extraSkillsPaths,
    );
    const summaries = await loader.loadSummaries();
    console.log(chalk.dim(`Found ${summaries.length} skills (indexed).`));

    console.log('');
    console.log(chalk.bold.dim('Planning (this may take a little while)'));
    console.log(
      chalk.dim('  1/2 ') +
        chalk.white(
          isBrownfield
            ? 'Choosing skills for your changes…'
            : 'Choosing skills for your project…',
        ) +
        chalk.dim(' (calling model)'),
    );
    const matcher = new SkillMatcher(this.callModel);
    const matchedSummaries = await matcher.match(context, summaries);
    const selectedSkills = await loader.hydrateSummaries(matchedSummaries);
    const picked = selectedSkills.map((s) => `@${s.name}`).join(', ');
    console.log(
      chalk.dim('       ✓ ') +
        chalk.dim(`Using ${selectedSkills.length} skill(s): `) +
        chalk.yellow(picked),
    );

    console.log(
      chalk.dim('  2/2 ') +
        chalk.white(
          isBrownfield
            ? 'Drafting the change plan…'
            : 'Drafting the task plan…',
        ) +
        chalk.dim(' (calling model)'),
    );
    const planner = new TaskPlanner(this.callModel);
    const graph = await planner.plan(context, selectedSkills);
    console.log(
      chalk.dim(
        `       ✓ ${graph.tasks.length} task(s) ready — showing plan below.`,
      ),
    );

    if (!isBrownfield) {
      console.log(chalk.dim('  • Generating project documents with AI…'));
      const docsGenerator = new ProjectDocsGenerator(this.callModel);
      const generatedDocs = await docsGenerator.generate(
        context,
        graph,
        (label) => {
          console.log(
            chalk.dim('       ↳ Writing ') +
              chalk.white(label) +
              chalk.dim('…'),
          );
        },
      );

      console.log(chalk.dim('  • Writing core project documents…'));
      const docs = await writeCoreProjectDocs(
        context.workspaceRoot,
        context,
        graph,
        generatedDocs,
      );
      const docLine = (label: string, files: string[]) =>
        files.length > 0
          ? chalk.dim(`       ${label}: `) + chalk.white(files.join(', '))
          : '';
      if (docs.created.length > 0) {
        console.log(docLine('Created', docs.created));
      }
      if (docs.updated.length > 0) {
        console.log(docLine('Updated', docs.updated));
      }
      if (docs.created.length === 0 && docs.updated.length === 0) {
        console.log(
          chalk.dim('       (skipped — no workspace root set for file writes)'),
        );
      }
    } else {
      console.log(chalk.dim('  • Updating TASKS.md with change plan…'));
      const docs = await writeCoreProjectDocs(
        context.workspaceRoot,
        context,
        graph,
      );
      if (docs.updated.length > 0 || docs.created.length > 0) {
        const changed = [...docs.created, ...docs.updated];
        console.log(
          chalk.dim(`       Updated: `) + chalk.white(changed.join(', ')),
        );
      }
    }
    console.log('');

    const reporter = new ProgressReporter(graph);
    reporter.printPlan(this.settings.planPreviewSeconds);

    await new Promise<void>((resolve) => {
      let remaining = this.settings.planPreviewSeconds;
      const interval = setInterval(() => {
        process.stdout.write(`\r  Starting in ${remaining}...  `);
        remaining--;
        if (remaining < 0) {
          clearInterval(interval);
          process.stdout.write('\r' + ' '.repeat(30) + '\r');
          resolve();
        }
      }, 1000);
    });

    const runner = new TaskRunner(
      this.callModelWithTools,
      this.settings.maxTaskRetries,
    );
    const orchestrator = new AutopilotOrchestrator(
      graph,
      runner,
      reporter,
      context,
    );
    await orchestrator.run();

    const qcLoop = new QualityCheckLoop(
      this.callModelWithTools,
      runner,
      context,
    );
    await qcLoop.run();
  }
}
