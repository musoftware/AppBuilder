import type { Task, ChatMessage } from '../types.js';

const TASK_SYSTEM_PROMPT = (skillContent?: string) =>
  `
You are an expert AI coding agent running in fully autonomous mode.

${skillContent ? `## Active skill\n\n${skillContent}\n\n---\n` : ''}

Rules:
- Execute the task completely. Do not ask for clarification.
- Write all necessary files, create directories, install dependencies.
- Run commands to verify your work (tests, linting, etc.).
- If something fails, diagnose and fix it before moving on.
- Output a concise summary of what you produced when done.
`.trim();

export class TaskRunner {
  constructor(
    private callModelWithTools: (
      messages: ChatMessage[],
      system: string,
      yolo: boolean,
    ) => Promise<string>,
    private maxRetries: number,
  ) {}

  async execute(task: Task, contextSpec: object): Promise<void> {
    const system = TASK_SYSTEM_PROMPT(task.skill?.content);

    const userMessage = `
## Task: ${task.title}

${task.description}

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

        await this.callModelWithTools(messages, system, true);
        return;
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
