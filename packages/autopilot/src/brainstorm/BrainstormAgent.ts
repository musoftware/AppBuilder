import { messageMatchesGoTrigger } from '../goTriggerMatch.js';
import type { ChatMessage, ContextSpec, AutopilotSettings } from '../types.js';

const GREENFIELD_SYSTEM_PROMPT = `
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

const BROWNFIELD_SYSTEM_PROMPT = (existingSummary: string) =>
  `
You are an expert software engineer helping a developer make targeted changes to an EXISTING codebase.

Existing project context:
${existingSummary}

Your job is to understand exactly what they want to add or change, then confirm you have a clear, implementable spec.

Rules:
- Ask at most 2 focused questions per turn.
- The codebase already exists — focus on WHAT to change/add, not rebuilding anything.
- Ask about backward compatibility and breaking changes if relevant.
- When you have enough to create a clear change spec, say exactly:
  "I have everything I need. Type 'go' to start autopilot."
- Do NOT start implementing yet — only gather information.

Things to understand before saying you're ready:
  1. Precisely what feature/fix/change is needed?
  2. Which parts of the codebase are affected?
  3. Are there existing tests to update or new ones to write?
  4. Any constraints (API compatibility, coding conventions, dependencies to avoid)?
  5. Definition of "done" — how to verify the change is complete?

Speak naturally. Be direct. This is a conversation, not a form.
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
  private systemPrompt: string;
  private projectMode: 'greenfield' | 'brownfield';
  private existingProjectSummary: string;

  constructor(
    settings: AutopilotSettings,
    callModel: (messages: ChatMessage[], system: string) => Promise<string>,
    projectMode: 'greenfield' | 'brownfield' = 'greenfield',
    existingProjectSummary = '',
  ) {
    this.settings = settings;
    this.callModel = callModel;
    this.projectMode = projectMode;
    this.existingProjectSummary = existingProjectSummary;
    this.systemPrompt =
      projectMode === 'brownfield'
        ? BROWNFIELD_SYSTEM_PROMPT(existingProjectSummary)
        : GREENFIELD_SYSTEM_PROMPT;
  }

  async chat(userMessage: string): Promise<BrainstormResult> {
    if (messageMatchesGoTrigger(userMessage, this.settings.goTriggers)) {
      return { reply: '', ready: true };
    }

    this.history.push({ role: 'user', content: userMessage });

    const reply = await this.callModel(this.history, this.systemPrompt);

    this.history.push({ role: 'assistant', content: reply });

    this.updateContext(userMessage, reply);

    return { reply, ready: false };
  }

  /**
   * Record the user's request and continue to extract/plan without a
   * conversational brainstorm model turn. Used when the main CLI UI already
   * captured intent (e.g. `mu-pilot --brainstorm` with an optional seed).
   */
  seedForDirectPlan(userMessage: string): void {
    this.history.push({ role: 'user', content: userMessage });
    this.updateContext(userMessage, '');
  }

  private updateContext(userMsg: string, _assistantMsg: string): void {
    if (!this.context.idea) {
      this.context.idea = userMsg;
    }
  }

  /** Synchronous snapshot — only use when async extraction is not possible. */
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
      clarifications: this.context.clarifications ?? { fullConversation },
    };
  }

  /**
   * Uses the model to extract structured project context from the full
   * brainstorm conversation. Call this after the user types "go" to get
   * rich, specific context for document generation.
   */
  async extractContextSpec(): Promise<ContextSpec> {
    const { projectMode, existingProjectSummary } = this;
    const fullConversation = this.history
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const brownfieldExtra =
      projectMode === 'brownfield'
        ? `\n## Existing project context\n${existingProjectSummary}\n`
        : '';

    const ideaDescription =
      projectMode === 'brownfield'
        ? 'One clear sentence describing what change/feature is being added to the existing project'
        : 'One clear sentence describing what is being built';

    const prompt = `You are extracting structured project context from a brainstorming conversation.
${brownfieldExtra}
## Brainstorm conversation
${fullConversation}

Extract the key details and return ONLY a valid JSON object with exactly these fields:

{
  "idea": "${ideaDescription}",
  "goal": "What the user wants to achieve / definition of done for this session",
  "outputFormat": "cli | web-app | api | library | mobile-app | desktop-app | other",
  "techStack": ["list", "of", "specific", "languages/frameworks/tools", "mentioned"],
  "constraints": ["list", "of", "hard", "requirements", "or", "restrictions"]
}

Rules:
- Be specific — use the user's actual words, names, and details.
- If something was not discussed, use an empty array [] or the best guess from context.
- Return ONLY the JSON object. No explanation, no markdown fences.`;

    const fallback = (): ContextSpec => ({
      ...this.getContextSpec(),
      projectMode,
      existingProjectSummary:
        projectMode === 'brownfield' ? existingProjectSummary : undefined,
    });

    try {
      const response = await this.callModel(
        [{ role: 'user', content: prompt }],
        'Extract structured data from a conversation. Return only valid JSON.',
      );

      const cleaned = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned) as Partial<ContextSpec>;

      return {
        idea: (parsed.idea as string) || this.context.idea || 'Unknown idea',
        goal: (parsed.goal as string) || fullConversation,
        outputFormat:
          (parsed.outputFormat as ContextSpec['outputFormat']) || 'other',
        techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
        constraints: Array.isArray(parsed.constraints)
          ? parsed.constraints
          : [],
        clarifications: { fullConversation },
        projectMode,
        existingProjectSummary:
          projectMode === 'brownfield' ? existingProjectSummary : undefined,
      };
    } catch {
      return fallback();
    }
  }
}
