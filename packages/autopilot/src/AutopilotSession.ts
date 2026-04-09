import chalk from 'chalk';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { BrainstormAgent } from './brainstorm/BrainstormAgent.js';
import { SkillLoader } from './planning/SkillLoader.js';
import { SkillMatcher } from './planning/SkillMatcher.js';
import { TaskPlanner } from './planning/TaskPlanner.js';
import { TaskRunner } from './autopilot/TaskRunner.js';
import { AutopilotOrchestrator } from './autopilot/AutopilotOrchestrator.js';
import { ProgressReporter } from './autopilot/ProgressReporter.js';
import type { AutopilotSettings, ChatMessage } from './types.js';
import { mergeAutopilotPartialSettings } from './types.js';

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

  async run(initialIdea?: string): Promise<void> {
    const rl = readline.createInterface({ input, output });

    console.log('\n' + chalk.bold.cyan('━'.repeat(50)));
    console.log(chalk.bold(' MU Code — Autopilot mode'));
    console.log(chalk.dim(' Type your idea. Type "go" when ready to build.'));
    console.log(chalk.cyan('━'.repeat(50)) + '\n');

    const agent = new BrainstormAgent(this.settings, this.callModel);

    let seed = initialIdea;
    while (true) {
      const userInput = seed ?? (await rl.question(chalk.bold.blue('You: ')));
      seed = undefined;

      const { reply, ready } = await agent.chat(userInput);

      if (ready) {
        console.log(chalk.bold.green('\n✓ Got it. Building your plan...\n'));
        break;
      }

      console.log(chalk.bold.cyan('\nMU: ') + reply + '\n');
    }

    rl.close();

    const context = {
      ...agent.getContextSpec(),
      workspaceRoot: process.cwd(),
    };

    console.log(chalk.dim('Loading skills...'));
    const loader = new SkillLoader(this.settings.skillsPath);
    const allSkills = await loader.loadAll();
    console.log(chalk.dim(`Found ${allSkills.length} skills.`));

    console.log('');
    console.log(chalk.bold.dim('Planning (this may take a little while)'));
    console.log(
      chalk.dim('  1/2 ') +
        chalk.white('Choosing skills for your project…') +
        chalk.dim(' (calling model)'),
    );
    const matcher = new SkillMatcher(this.callModel);
    const selectedSkills = await matcher.match(context, allSkills);
    const picked = selectedSkills.map((s) => `@${s.name}`).join(', ');
    console.log(
      chalk.dim('       ✓ ') +
        chalk.dim(`Using ${selectedSkills.length} skill(s): `) +
        chalk.yellow(picked),
    );

    console.log(
      chalk.dim('  2/2 ') +
        chalk.white('Drafting the task plan…') +
        chalk.dim(' (calling model)'),
    );
    const planner = new TaskPlanner(this.callModel);
    const graph = await planner.plan(context, selectedSkills);
    console.log(
      chalk.dim(
        `       ✓ ${graph.tasks.length} task(s) ready — showing plan below.\n`,
      ),
    );

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
  }
}
