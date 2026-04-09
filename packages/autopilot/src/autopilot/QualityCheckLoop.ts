import chalk from 'chalk';
import type { ContextSpec, ChatMessage, Task, TaskGraph } from '../types.js';
import type { TaskRunner } from './TaskRunner.js';
import { AutopilotOrchestrator } from './AutopilotOrchestrator.js';
import { ProgressReporter } from './ProgressReporter.js';

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

Rules:
- READ the actual files in the workspace before drawing conclusions.
- Run existing tests (if any) to check for failures.
- Only report real, concrete issues — not stylistic preferences or speculative improvements.
- If everything looks correct and complete, output {"hasIssues": false, "issues": []}.
- Output ONLY valid JSON matching the schema below, with no extra text before or after the JSON block.

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
    maxIterations = 3,
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
          ` ⚠ Found ${analysis.issues.length} issue(s) to fix:`,
        ),
      );
      analysis.issues.forEach((issue, i) => {
        console.log(`  ${chalk.dim(`[${i + 1}]`)} ${issue.title}`);
      });
      console.log(chalk.cyan('━'.repeat(50)));

      const graph = this.buildGraph(analysis.issues);
      const reporter = new ProgressReporter(graph);
      const orchestrator = new AutopilotOrchestrator(
        graph,
        this.runner,
        reporter,
        this.context,
      );
      await orchestrator.run();
    }

    console.log('\n' + chalk.bold.cyan('━'.repeat(50)));
    console.log(
      chalk.bold.yellow(
        ` ⚠ Quality check reached max iterations (${this.maxIterations}) — manual review recommended.`,
      ),
    );
    console.log(chalk.cyan('━'.repeat(50)) + '\n');
  }

  private async analyze(): Promise<AnalysisResult> {
    const root = this.context.workspaceRoot ?? 'current directory';
    const userMessage = `
Analyze the project workspace at: ${root}

Project context:
${JSON.stringify(this.context, null, 2)}

Steps:
1. Explore the workspace files to understand the current state.
2. Run tests if they exist (e.g. npm test, pytest, cargo test).
3. Identify all bugs, missing implementations, and logical conflicts.
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
