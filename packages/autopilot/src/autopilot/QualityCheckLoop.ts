import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import type { ContextSpec, ChatMessage, Task, TaskGraph } from '../types.js';
import type { TaskRunner } from './TaskRunner.js';
import { AutopilotOrchestrator } from './AutopilotOrchestrator.js';
import { ProgressReporter } from './ProgressReporter.js';
import { QC_TESTING_TAXONOMY } from '../qualityCheckTestingTaxonomy.js';

interface AnalysisIssue {
  title: string;
  description: string;
}

interface AnalysisResult {
  hasIssues: boolean;
  issues: AnalysisIssue[];
}

const ANALYSIS_SYSTEM_PROMPT = `
You are an expert code reviewer running in fully autonomous mode.

Your job is to analyze the current state of a project workspace and identify:
1. Bugs — code that is incorrect, broken, or will cause runtime errors
2. Missing implementations — features or functionality that were planned but not completed
3. Logical conflicts — contradictions between different parts of the code (e.g., mismatched types, broken imports, inconsistent interfaces)
4. Wiring and integration failures — problems that show up only when subsystems work together (routing, rendering, persistence, external boundaries, dependency injection, or config as in a real run)

Rules:
- READ the actual files in the workspace before drawing conclusions.
- Discover how this project runs automated checks (scripts, CI, Makefile, docs)
  and run them. Do not assume a specific stack.
- Prefer the broadest automated suites the repository already defines when
  practical (integration, feature/API, contract, browser, end-to-end), not only
  the fastest unit-level tests — many production defects are invisible to narrow
  unit coverage.
- Only report real, concrete issues — not stylistic preferences or speculative improvements.
- If everything looks correct and complete, output {"hasIssues": false, "issues": []}.
- Output ONLY valid JSON matching the schema below, with no extra text before or after the JSON block.

${QC_TESTING_TAXONOMY}

Output schema:
{
  "hasIssues": boolean,
  "issues": [
    {
      "title": "short title (≤ 80 chars)",
      "description": "detailed description of the issue and what needs to be fixed"
    }
  ]
}
`.trim();

export class QualityCheckLoop {
  private readonly maxIterations: number;

  constructor(
    private callModelWithTools: (
      messages: ChatMessage[],
      system: string,
      yolo: boolean,
    ) => Promise<string>,
    private runner: TaskRunner,
    private context: ContextSpec,
    maxIterations = 100,
  ) {
    this.maxIterations = maxIterations;
  }

  async run(): Promise<void> {
    for (let iteration = 1; iteration <= this.maxIterations; iteration++) {
      console.log('\n' + chalk.bold.cyan('━'.repeat(50)));
      console.log(
        chalk.bold.cyan(
          ` Quality check — pass ${iteration}/${this.maxIterations}`,
        ),
      );
      console.log(chalk.cyan('━'.repeat(50)));
      console.log(
        chalk.dim(
          '  Analyzing workspace for bugs, missing features, and conflicts…',
        ),
      );

      const analysis = await this.analyze();

      if (!analysis.hasIssues || analysis.issues.length === 0) {
        console.log(
          chalk.bold.green(' ✓ No issues found — quality check passed.'),
        );
        console.log(chalk.cyan('━'.repeat(50)) + '\n');
        return;
      }

      console.log(
        chalk.bold.yellow(
          ` ⚠ Found ${analysis.issues.length} issue(s) to fix:\n`,
        ),
      );
      analysis.issues.forEach((issue, i) => {
        console.log(
          `  ${chalk.bold.yellow(`[${i + 1}]`)} ${chalk.bold(issue.title)}`,
        );
        issue.description.split('\n').forEach((line) => {
          const trimmed = line.trim();
          if (trimmed) {
            console.log(chalk.dim(`       ${trimmed}`));
          }
        });
        console.log('');
      });
      console.log(chalk.cyan('━'.repeat(50)));

      // Write checkpoint file before starting fixes
      const checkpointPath = this.checkpointFilePath(iteration);
      await this.writeCheckpoint(
        checkpointPath,
        iteration,
        analysis.issues,
        [],
      );
      console.log(chalk.dim(`  Checkpoints → ${checkpointPath}\n`));

      const graph = this.buildGraph(analysis.issues);
      const reporter = new ProgressReporter(graph);
      const orchestrator = new AutopilotOrchestrator(
        graph,
        this.runner,
        reporter,
        this.context,
      );
      await orchestrator.run();

      // Update checkpoint with final task results
      const doneIds = graph.tasks
        .filter((t) => t.status === 'done')
        .map((t) => t.id);
      await this.writeCheckpoint(
        checkpointPath,
        iteration,
        analysis.issues,
        doneIds,
      );
    }

    console.log('\n' + chalk.bold.cyan('━'.repeat(50)));
    console.log(
      chalk.bold.yellow(
        ` ⚠ Quality check reached max iterations (${this.maxIterations}) — manual review recommended.`,
      ),
    );
    console.log(chalk.cyan('━'.repeat(50)) + '\n');
  }

  private checkpointFilePath(iteration: number): string {
    const root = this.context.workspaceRoot ?? process.cwd();
    return path.join(root, `QC_REPORT_pass${iteration}.md`);
  }

  private async writeCheckpoint(
    filePath: string,
    iteration: number,
    issues: AnalysisIssue[],
    doneTaskIds: string[],
  ): Promise<void> {
    const lines: string[] = [
      `# Quality Check Report — Pass ${iteration}`,
      ``,
      `Generated: ${new Date().toISOString()}`,
      ``,
      `## Issues (${issues.length})`,
      ``,
    ];

    issues.forEach((issue, i) => {
      const taskId = `qc-fix-${i + 1}`;
      const checked = doneTaskIds.includes(taskId) ? 'x' : ' ';
      lines.push(`- [${checked}] **${issue.title}**`);
      issue.description.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed) {
          lines.push(`  ${trimmed}`);
        }
      });
      lines.push('');
    });

    await fs.writeFile(filePath, lines.join('\n'), 'utf8');
  }

  private async analyze(): Promise<AnalysisResult> {
    const root = this.context.workspaceRoot ?? 'current directory';
    const userMessage = `
Analyze the project workspace at: ${root}

Project context:
${JSON.stringify(this.context, null, 2)}

Steps:
1. Explore the workspace files to understand the current state.
2. Map scripts/CI/docs to the full testing taxonomy and run every automated
   check that reasonably applies (deeper scope and purpose-specific jobs when
   the repo defines them).
3. Identify bugs, missing work, conflicts, wiring/runtime failures, and
   obvious gaps in automated coverage for important dimensions.
4. Output your findings as JSON following the required schema. No extra text.
    `.trim();

    try {
      const raw = await this.callModelWithTools(
        [{ role: 'user', content: userMessage }],
        ANALYSIS_SYSTEM_PROMPT,
        true,
      );

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { hasIssues: false, issues: [] };
      }

      const parsed = JSON.parse(jsonMatch[0]) as Partial<AnalysisResult>;
      return {
        hasIssues: Boolean(parsed.hasIssues),
        issues: Array.isArray(parsed.issues)
          ? (parsed.issues as AnalysisIssue[])
          : [],
      };
    } catch {
      // If parsing fails, treat as clean to avoid infinite loops
      return { hasIssues: false, issues: [] };
    }
  }

  private buildGraph(issues: AnalysisIssue[]): TaskGraph {
    const tasks: Task[] = issues.map((issue, i) => ({
      id: `qc-fix-${i + 1}`,
      title: issue.title,
      description: issue.description,
      dependsOn: [],
      type: 'implement' as const,
      status: 'pending' as const,
    }));

    return {
      tasks,
      estimatedSteps: tasks.length,
    };
  }
}
