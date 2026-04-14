import type { Task, ChatMessage, ContextSpec } from '../types.js';

const SKILL_BLOCK = (skillContent?: string) =>
  skillContent ? `## Active skill\n\n${skillContent}\n\n---\n` : '';

const SHARED_RULES = `
- If something fails, diagnose and fix it before moving on.
- Stay within the project workspace root from context (no writes or destructive
  shell actions outside that directory unless the user explicitly required it).
- Update CONTEXT.md with decisions and progress; keep TASKS.md checkboxes aligned
  with what you actually did; extend CHANGELOG.md when behaviour changes.
`.trim();

const GREENFIELD_SYSTEM_PROMPT = (skillContent?: string) =>
  `
You are an expert AI coding agent running in fully autonomous mode.

${SKILL_BLOCK(skillContent)}

Rules:
- Execute the task completely. Do not ask for clarification.
- Write all necessary files, create directories, install dependencies.
- Run commands to verify your work (tests, linting, etc.).
- Output a concise summary of what you produced when done.
${SHARED_RULES}
- Read PRD.md and ARCHITECTURE.md before large changes; prefer editing real files
  over leaving decisions in chat-only reasoning.
`.trim();

const BROWNFIELD_SYSTEM_PROMPT = (skillContent?: string) =>
  `
You are an expert AI coding agent running in fully autonomous mode on an EXISTING codebase.

${SKILL_BLOCK(skillContent)}

Rules:
- READ before you WRITE. Explore relevant existing files before making any changes.
- Respect the existing code style, patterns, and conventions — do not reformat unrelated code.
- Make targeted, minimal changes to achieve the task. Do not refactor or clean up unrelated areas.
- Do not reinitialise, scaffold, or overwrite existing configuration files (package.json, tsconfig, etc.)
  unless the task explicitly requires it.
- Run existing tests after your changes to confirm nothing is broken. Fix any regressions before moving on.
- Output a concise summary of what you changed and why when done.
${SHARED_RULES}
`.trim();

const TASK_SYSTEM_PROMPT = (
  skillContent?: string,
  projectMode?: 'greenfield' | 'brownfield',
) =>
  projectMode === 'brownfield'
    ? BROWNFIELD_SYSTEM_PROMPT(skillContent)
    : GREENFIELD_SYSTEM_PROMPT(skillContent);

export class TaskRunner {
  constructor(
    private callModelWithTools: (
      messages: ChatMessage[],
      system: string,
      yolo: boolean,
    ) => Promise<string>,
    private maxRetries: number,
  ) {}

  async execute(task: Task, contextSpec: ContextSpec): Promise<string> {
    const system = TASK_SYSTEM_PROMPT(
      task.skill?.content,
      contextSpec.projectMode,
    );

    const root = contextSpec.workspaceRoot;
    const workspaceNote = root
      ? `\n## Workspace root (stay inside this path)\n${root}\n`
      : '';

    const userMessage = `
## Task: ${task.title}

${task.description}
${workspaceNote}
## Project context
${JSON.stringify(contextSpec, null, 2)}

Execute this task completely. When done, summarize what you produced.
    `.trim();

    let attempt = 0;
    let lastError: Error | undefined;

    while (attempt <= this.maxRetries) {
      try {
        const messages: ChatMessage[] = [
          { role: 'user', content: userMessage },
        ];

        if (attempt > 0 && lastError) {
          messages.push({
            role: 'assistant',
            content: `Previous attempt failed: ${lastError.message}. Retrying with a different approach.`,
          });
        }

        const summary = await this.callModelWithTools(messages, system, true);
        return summary;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        attempt++;
        if (attempt <= this.maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }

    throw lastError ?? new Error('Task failed after retries');
  }
}
