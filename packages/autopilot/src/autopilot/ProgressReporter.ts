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
    if (task.description) {
      task.description.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed) {
          console.log(chalk.dim(`    ${trimmed}`));
        }
      });
    }
  }

  reportActivity(msg: string): void {
    console.log(chalk.dim('    → ') + chalk.white(msg));
  }

  completeTask(task: Task, summary?: string): void {
    if (summary) {
      const firstLine = summary.split('\n')[0]!.trim();
      const display =
        firstLine.length > 120 ? firstLine.slice(0, 117) + '…' : firstLine;
      console.log(chalk.green('    ✓ ') + chalk.dim(display));
    } else {
      console.log(chalk.green('    ✓ Done'));
    }
    task.status = 'done';
  }

  failTask(task: Task, error: Error): void {
    console.log(chalk.red('    ✗ ') + chalk.dim(error.message));
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
