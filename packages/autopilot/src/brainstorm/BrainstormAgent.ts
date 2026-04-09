import type { ChatMessage, ContextSpec, AutopilotSettings } from '../types.js';

const BRAINSTORM_SYSTEM_PROMPT = `
You are an expert technical product analyst running a structured brainstorming session.

Your job is to help the user clarify their idea so it can be automatically built by an AI agent.

Rules:
- Ask at most 2 focused questions per turn. Never dump a list of 10 questions.
- Track what you already know and only ask what is still unclear.
- Be concise. The user wants to build, not write an essay.
- When you have enough to create a clear, buildable spec, say exactly:
  "I have everything I need. Type 'go' to start autopilot."
- Do NOT start building yet — only gather information.

Things you need to understand before saying you're ready:
  1. Core goal (what problem does this solve?)
  2. Target user or environment (CLI tool? web app? API? library?)
  3. Tech stack preferences or constraints
  4. Any specific requirements or constraints (auth, DB, language, etc.)
  5. Definition of "done" for this session

Speak naturally. Be encouraging. This is a conversation, not a form.
`.trim();

export interface BrainstormResult {
  reply: string;
  ready: boolean;
}

export class BrainstormAgent {
  private history: ChatMessage[] = [];
  private context: Partial<ContextSpec> = {};
  private settings: AutopilotSettings;
  private callModel: (
    messages: ChatMessage[],
    system: string,
  ) => Promise<string>;

  constructor(
    settings: AutopilotSettings,
    callModel: (messages: ChatMessage[], system: string) => Promise<string>,
  ) {
    this.settings = settings;
    this.callModel = callModel;
  }

  async chat(userMessage: string): Promise<BrainstormResult> {
    if (this.isGoTrigger(userMessage)) {
      return { reply: '', ready: true };
    }

    this.history.push({ role: 'user', content: userMessage });

    const reply = await this.callModel(this.history, BRAINSTORM_SYSTEM_PROMPT);

    this.history.push({ role: 'assistant', content: reply });

    this.updateContext(userMessage, reply);

    return { reply, ready: false };
  }

  private isGoTrigger(message: string): boolean {
    const lower = message.trim().toLowerCase();
    return this.settings.goTriggers.some(
      (t) =>
        lower === t || lower.startsWith(t + ' ') || lower.startsWith(t + ','),
    );
  }

  private updateContext(userMsg: string, _assistantMsg: string): void {
    if (!this.context.idea) {
      this.context.idea = userMsg;
    }
  }

  getContextSpec(): ContextSpec {
    const fullConversation = this.history
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    return {
      idea: this.context.idea ?? 'Unknown idea',
      goal: this.context.goal ?? fullConversation,
      techStack: this.context.techStack ?? [],
      constraints: this.context.constraints ?? [],
      outputFormat: this.context.outputFormat ?? 'other',
      clarifications: this.context.clarifications ?? {
        fullConversation,
      },
    };
  }
}
