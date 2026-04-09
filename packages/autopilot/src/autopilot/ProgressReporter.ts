import chalk from 'chalk';
import type { Task, TaskGraph } from '../types.js';

export class ProgressReporter {
  private graph: TaskGraph;

  constructor(graph: TaskGraph) {
    this.graph = graph;
  }

  printPlan(planPreviewSeconds: number): void {
    const skills = [
      ...new Set(
        this.graph.tasks.filter((t) => t.skill).map((t) => `@${t.skill!.name}`),
      ),
    ];

    console.log('\n' + chalk.bold.cyan('━'.repeat(50)));
    console.log(chalk.bold(' Autopilot plan'));
    console.log(chalk.cyan('━'.repeat(50)));

    if (skills.length > 0) {
      console.log(chalk.dim(' Skills: ') + chalk.yellow(skills.join(', ')));
    }

    console.log(chalk.dim(` Tasks (${this.graph.tasks.length}):`));
    this.graph.tasks.forEach((t, i) => {
      const skillTag = t.skill ? chalk.dim(` [@${t.skill.name}]`) : '';
      console.log(`  ${chalk.dim(`[${i + 1}]`)} ${t.title}${skillTag}`);
    });

    console.log(chalk.cyan('━'.repeat(50)));
    console.log(
      chalk.dim(` Starting autopilot in ${planPreviewSeconds} seconds...`) +
        chalk.dim('  (Ctrl+C to abort)\n'),
    );
  }

  startTask(task: Task): void {
    const idx = this.graph.tasks.findIndex((t) => t.id === task.id) + 1;
    const total = this.graph.tasks.length;
    console.log(
      `\n${chalk.bold.cyan(`[${idx}/${total}]`)} ${chalk.bold(task.title)}`,
    );
    console.log(
      chalk.dim(
        '    Autopilot is running this step with file and shell tools; it may take several minutes with little output.',
      ),
    );
    process.stdout.write(chalk.dim('    Outcome: '));
  }

  completeTask(task: Task): void {
    process.stdout.write(chalk.green('✓') + '\n');
    task.status = 'done';
  }

  failTask(task: Task, error: Error): void {
    process.stdout.write(
      chalk.red('✗') + chalk.dim(` ${error.message}`) + '\n',
    );
    task.status = 'failed';
  }

  done(): void {
    const failed = this.graph.tasks.filter((t) => t.status === 'failed');
    console.log('\n' + chalk.bold.cyan('━'.repeat(50)));
    if (failed.length === 0) {
      console.log(chalk.bold.green(' ✓ Autopilot complete — all tasks done.'));
    } else {
      console.log(
        chalk.bold.yellow(` ⚠ Done with ${failed.length} failed task(s):`),
      );
      failed.forEach((t) => console.log(chalk.red(`   - ${t.title}`)));
    }
    console.log(chalk.cyan('━'.repeat(50)) + '\n');
  }
}
