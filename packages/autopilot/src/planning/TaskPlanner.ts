import type {
  ContextSpec,
  Skill,
  Task,
  TaskGraph,
  ChatMessage,
} from '../types.js';

const PLANNER_PROMPT = (context: ContextSpec, skills: Skill[]) =>
  `
You are a senior software architect creating an execution plan for an AI autopilot agent.

Project context:
${JSON.stringify(context, null, 2)}

Available skills to use:
${skills.map((s) => `- ${s.name}: ${s.description}`).join('\n')}

Create a step-by-step task graph to fully implement this project.
Each task must be self-contained and executable by an AI coding agent.

Return ONLY a JSON array of tasks with this exact shape:
[
  {
    "id": "task_1",
    "title": "Short task title",
    "description": "Detailed description of what to do and what files/code to produce",
    "skillName": "brainstorming",
    "dependsOn": [],
    "type": "scaffold"
  }
]

Rules:
- 4 to 8 tasks maximum. Keep it focused.
- Every project must end with a "ship" type task (docs + final output).
- Tasks with no dependsOn run first; others wait for their deps.
- "description" must be specific enough for an AI to execute without any extra context.
- If you assign a skillName, it must exactly match one of the available skills listed above.
`.trim();

function fallbackGraph(context: ContextSpec): TaskGraph {
  const tasks: Task[] = [
    {
      id: 'task_1',
      title: 'Implement project',
      description: `Implement the following based on context:\n${context.idea}\n\n${context.goal}`,
      dependsOn: [],
      type: 'implement',
      status: 'pending',
    },
    {
      id: 'task_ship',
      title: 'Ship and document',
      description:
        'Finalize documentation, verify build/tests if applicable, and summarize deliverables.',
      dependsOn: ['task_1'],
      type: 'ship',
      status: 'pending',
    },
  ];
  return { tasks, estimatedSteps: tasks.length };
}

export class TaskPlanner {
  constructor(
    private callModel: (
      messages: ChatMessage[],
      system: string,
    ) => Promise<string>,
  ) {}

  async plan(context: ContextSpec, skills: Skill[]): Promise<TaskGraph> {
    const skillMap = new Map(skills.map((s) => [s.name, s]));

    let rawTasks: Array<{
      id: string;
      title: string;
      description: string;
      skillName?: string;
      dependsOn: string[];
      type: Task['type'];
    }>;

    try {
      const prompt = PLANNER_PROMPT(context, skills);
      const response = await this.callModel(
        [{ role: 'user', content: prompt }],
        'You are a precise JSON-outputting assistant. Return only valid JSON arrays.',
      );

      const cleaned = response.replace(/```json|```/g, '').trim();
      rawTasks = JSON.parse(cleaned) as typeof rawTasks;
      if (!Array.isArray(rawTasks) || rawTasks.length === 0) {
        return fallbackGraph(context);
      }
    } catch {
      return fallbackGraph(context);
    }

    const tasks: Task[] = rawTasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      skill: t.skillName ? skillMap.get(t.skillName) : undefined,
      dependsOn: t.dependsOn ?? [],
      type: t.type,
      status: 'pending',
    }));

    const hasShip = tasks.some((t) => t.type === 'ship');
    if (!hasShip) {
      tasks.push({
        id: 'task_ship',
        title: 'Ship and document',
        description:
          'Finalize documentation, verify build/tests if applicable, and summarize deliverables.',
        dependsOn: tasks.length > 0 ? [tasks[tasks.length - 1]!.id] : [],
        type: 'ship',
        status: 'pending',
      });
    }

    return { tasks, estimatedSteps: tasks.length };
  }
}
