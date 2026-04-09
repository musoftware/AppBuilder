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
import { DEFAULT_SETTINGS } from './types.js';

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
    // Do not use `{ ...DEFAULT_SETTINGS, ...settings }`: callers pass explicit
    // `undefined` for omitted options, which would overwrite defaults.
    this.settings = {
      skillsPath: settings.skillsPath ?? DEFAULT_SETTINGS.skillsPath,
      maxTaskRetries:
        settings.maxTaskRetries ?? DEFAULT_SETTINGS.maxTaskRetries,
      planPreviewSeconds:
        settings.planPreviewSeconds ?? DEFAULT_SETTINGS.planPreviewSeconds,
      goTriggers:
        settings.goTriggers && settings.goTriggers.length > 0
          ? settings.goTriggers
          : DEFAULT_SETTINGS.goTriggers,
    };
    this.callModel = callModel;
    this.callModelWithTools = callModelWithTools;
  }

  async run(initialIdea?: string): Promise<void> {
    const rl = readline.createInterface({ input, output });

    console.log('\n' + chalk.bold.cyan('━'.repeat(50)));
    console.log(chalk.bold(' Qwen Code — Autopilot mode'));
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

      console.log(chalk.bold.cyan('\nQwen: ') + reply + '\n');
    }

    rl.close();

    const context = agent.getContextSpec();

    console.log(chalk.dim('Loading skills...'));
    const loader = new SkillLoader(this.settings.skillsPath);
    const allSkills = await loader.loadAll();
    console.log(chalk.dim(`Found ${allSkills.length} skills.`));

    const matcher = new SkillMatcher(this.callModel);
    const selectedSkills = await matcher.match(context, allSkills);

    const planner = new TaskPlanner(this.callModel);
    const graph = await planner.plan(context, selectedSkills);

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
