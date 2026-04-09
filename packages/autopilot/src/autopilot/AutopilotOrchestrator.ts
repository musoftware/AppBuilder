import type { ContextSpec, Task, TaskGraph } from '../types.js';
import type { ProgressReporter } from './ProgressReporter.js';
import type { TaskRunner } from './TaskRunner.js';

export class AutopilotOrchestrator {
  constructor(
    private graph: TaskGraph,
    private runner: TaskRunner,
    private reporter: ProgressReporter,
    private context: ContextSpec,
  ) {}

  async run(): Promise<void> {
    try {
      const failed = new Set<string>();

      let ordered: Task[];
      try {
        ordered = this.topologicalSort(this.graph.tasks);
      } catch {
        ordered = [...this.graph.tasks];
      }

      for (const task of ordered) {
        try {
          if (task.dependsOn.some((dep) => failed.has(dep))) {
            task.status = 'failed';
            failed.add(task.id);
            this.reporter.failTask(task, new Error('Dependency failed'));
            continue;
          }

          this.reporter.startTask(task);
          task.status = 'running';

          try {
            await this.runner.execute(task, this.context);
            task.status = 'done';
            this.reporter.completeTask(task);
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            task.status = 'failed';
            this.reporter.failTask(task, error);
            failed.add(task.id);
          }
        } catch (loopErr) {
          const error =
            loopErr instanceof Error ? loopErr : new Error(String(loopErr));
          task.status = 'failed';
          this.reporter.failTask(task, error);
          failed.add(task.id);
        }
      }

      this.reporter.done();
    } catch (e) {
      console.error(e instanceof Error ? e.message : String(e));
      this.reporter.done();
    }
  }

  private topologicalSort(tasks: Task[]): Task[] {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const visited = new Set<string>();
    const sorted: Task[] = [];

    const visit = (task: Task) => {
      if (visited.has(task.id)) {
        return;
      }
      visited.add(task.id);
      for (const depId of task.dependsOn) {
        const dep = taskMap.get(depId);
        if (dep) {
          visit(dep);
        }
      }
      sorted.push(task);
    };

    for (const task of tasks) {
      visit(task);
    }
    return sorted;
  }
}
