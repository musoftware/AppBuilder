/* eslint-disable no-console -- CLI banner output */
import chalk from 'chalk';
import { QualityCheckLoop, TaskRunner } from '@qwen-code/autopilot';
import type { ChatMessage, ContextSpec } from '@qwen-code/autopilot';

interface StandaloneQcOptions {
  maxTaskRetries?: number;
  maxIterations?: number;
}

export async function runStandaloneQualityCheck(
  callModelWithTools: (
    messages: ChatMessage[],
    system: string,
    yolo: boolean,
  ) => Promise<string>,
  options: StandaloneQcOptions = {},
): Promise<void> {
  const workspaceRoot = process.cwd();

  console.log('\n' + chalk.bold.cyan('━'.repeat(50)));
  console.log(chalk.bold(' MU Code — Quality Check mode'));
  console.log(chalk.dim(` Workspace: ${workspaceRoot}`));
  console.log(chalk.cyan('━'.repeat(50)) + '\n');

  // Minimal context — the QC loop reads the workspace itself
  const context: ContextSpec = {
    idea: 'Quality check of existing project',
    goal: 'Identify and fix bugs, missing implementations, and logical conflicts',
    techStack: [],
    constraints: [],
    outputFormat: 'other',
    clarifications: {},
    workspaceRoot,
    projectMode: 'brownfield',
  };

  const runner = new TaskRunner(
    callModelWithTools,
    options.maxTaskRetries ?? 2,
  );
  const loop = new QualityCheckLoop(
    callModelWithTools,
    runner,
    context,
    options.maxIterations ?? 3,
  );

  await loop.run();
}
