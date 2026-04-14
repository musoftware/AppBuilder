import type {
  ContextSpec,
  Skill,
  Task,
  TaskGraph,
  ChatMessage,
} from '../types.js';

const GREENFIELD_PLANNER_PROMPT = (context: ContextSpec, skills: Skill[]) =>
  `
You are a senior software architect creating an execution plan for an AI autopilot agent.

Project context:
${JSON.stringify(context, null, 2)}

Available skills to use:
${skills.map((s) => `- ${s.name}: ${s.description}`).join('\n')}

Create a step-by-step task graph to fully implement this project from scratch.
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
- Recommended task progression for greenfield projects:
  1. Use "scaffold" skill to create initial project structure
  2. Use "database-design" skill if project needs data persistence
  3. Use "api-design" skill if project exposes data/functionality via HTTP
  4. Use "auth-setup" skill if project requires user accounts/login
  5. Use "build" or implementation skills for core business logic
  6. Use test skills (test-unit, test-integration, test-e2e) to verify functionality
  7. End with "ship" type task (docs + final output + deployment-config if needed)
- Every project must end with a "ship" type task (docs + final output).
- Tasks with no dependsOn run first; others wait for their deps.
- "description" must be specific enough for an AI to execute without any extra context.
- If you assign a skillName, it must exactly match one of the available skills listed above.
- The repo root should already have (or will have) PRD.md, ARCHITECTURE.md, RULES.md, .cursorrules,
  TASKS.md, CONTEXT.md, PROJECT.md, ENV.md, and CHANGELOG.md — the first implementation tasks should read them,
  flesh them out from the JSON context, and keep them accurate as the build progresses.
`.trim();

const BROWNFIELD_PLANNER_PROMPT = (context: ContextSpec, skills: Skill[]) =>
  `
You are a senior software engineer creating a targeted change plan for an AI autopilot agent.
This is an EXISTING codebase — do not scaffold, do not reinitialise, do not overwrite existing files unnecessarily.

Project context:
${JSON.stringify(context, null, 2)}

Available skills to use:
${skills.map((s) => `- ${s.name}: ${s.description}`).join('\n')}

Create a focused task graph to implement the requested change in the existing codebase.
Each task must be self-contained and executable by an AI coding agent.

Return ONLY a JSON array of tasks with this exact shape:
[
  {
    "id": "task_1",
    "title": "Short task title",
    "description": "Detailed description of what to read/change and why",
    "skillName": null,
    "dependsOn": [],
    "type": "implement"
  }
]

Rules:
- 3 to 6 tasks maximum. Keep changes targeted — do not rebuild things that already work.
- Task types for brownfield: "implement" (code changes), "test" (add/update tests), "ship" (verify + update docs).
- Do NOT use "scaffold" type — the project already exists.
- First task should explore key existing files relevant to the change before modifying anything.
- Always include a "ship" task at the end: run tests, update CONTEXT.md and CHANGELOG.md with what changed.
- Tasks with no dependsOn run first; others wait for their deps.
- "description" must be specific enough for an AI to execute without extra context.
- If you assign a skillName, it must exactly match one of the available skills listed above.
`.trim();

const PLANNER_PROMPT = (context: ContextSpec, skills: Skill[]) =>
  context.projectMode === 'brownfield'
    ? BROWNFIELD_PLANNER_PROMPT(context, skills)
    : GREENFIELD_PLANNER_PROMPT(context, skills);

function fallbackGraph(context: ContextSpec): TaskGraph {
  const isBrownfield = context.projectMode === 'brownfield';
  const tasks: Task[] = [
    {
      id: 'task_1',
      title: isBrownfield ? 'Implement changes' : 'Implement project',
      description: isBrownfield
        ? `Read relevant existing files first, then implement the following change:\n${context.idea}\n\n${context.goal}`
        : `Implement the following based on context:\n${context.idea}\n\n${context.goal}`,
      dependsOn: [],
      type: 'implement',
      status: 'pending',
    },
    {
      id: 'task_ship',
      title: isBrownfield ? 'Verify and document changes' : 'Ship and document',
      description: isBrownfield
        ? 'Run existing tests to confirm nothing is broken. Update CONTEXT.md with what changed and CHANGELOG.md with a new entry.'
        : 'Finalize documentation, verify build/tests if applicable, and summarize deliverables.',
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
