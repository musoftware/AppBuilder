import type { ContextSpec, TaskGraph, ChatMessage } from '../types.js';
import {
  buildPrdMarkdown,
  buildArchitectureMarkdown,
  buildContextMarkdown,
  buildEnvMarkdown,
  type GeneratedDocs,
} from './coreProjectDocs.js';

const SYSTEM_PROMPT =
  'You are a technical writer and software architect. ' +
  'Generate detailed, project-specific documentation in Markdown. ' +
  'Use the full brainstorm conversation to write content that is specific to this exact project — ' +
  'never write generic placeholders. Return only the Markdown document, no extra text.';

function fullConversation(context: ContextSpec): string {
  const conv =
    typeof context.clarifications?.['fullConversation'] === 'string'
      ? context.clarifications['fullConversation']
      : JSON.stringify(context.clarifications, null, 2);
  return conv;
}

function taskList(graph: TaskGraph): string {
  return graph.tasks
    .map((t) => `- **${t.title}**: ${t.description}`)
    .join('\n');
}

const DOC_PROMPTS: Record<
  keyof GeneratedDocs,
  (context: ContextSpec, graph: TaskGraph) => string
> = {
  prd: (context, graph) =>
    `
## Brainstorm conversation (source of truth)
${fullConversation(context)}

## Planned tasks
${taskList(graph)}

Write a detailed Product Requirements Document (PRD) for this project.

Start with: # Product Requirements Document

Include all of these sections, filled with specific details from the conversation above:
1. **Product overview & goals** — describe the real idea and goal in plain language
2. **User personas** — who uses this, their role and needs
3. **Features & user stories** — break down the goal into specific, shippable features with user stories ("As a <persona>, I want to <action> so that <benefit>")
4. **Out of scope** — explicit non-goals to prevent scope creep
5. **Success metrics** — how you know v1 succeeded (specific, measurable)
6. **Technical context** — output format, tech stack, and constraints from the conversation

Be specific. Name the actual technologies, the actual problem being solved, and the actual user. Do not write placeholders or generic content.
`.trim(),

  architecture: (context, graph) =>
    `
## Brainstorm conversation (source of truth)
${fullConversation(context)}

## Planned tasks
${taskList(graph)}

Write a detailed System Architecture document for this project.

Start with: # System Architecture

Include all of these sections, specific to this exact project:
1. **Tech stack** — list every technology mentioned with versions where known
2. **Folder / project structure** — a realistic directory tree for this type of project (${context.outputFormat}), with brief explanations of each directory
3. **Data & persistence** — database choice, schema highlights, migration strategy (if applicable)
4. **API design overview** — endpoints, resources, and boundaries (if applicable)
5. **Third-party integrations** — auth, payments, email, external APIs mentioned in conversation
6. **Runtime & deployment** — how it runs locally and in production

Use the actual tech stack: ${context.techStack.join(', ') || 'as discussed in conversation'}.
Do not write generic placeholders — make this document immediately useful to a developer starting on this project.
`.trim(),

  context: (context, graph) =>
    `
## Brainstorm conversation (source of truth)
${fullConversation(context)}

## Planned tasks
${taskList(graph)}

Write a Project Context document — this is living session memory for AI-assisted development.

Start with: # Project Context

Include all of these sections, summarising the real decisions from the brainstorm:
1. **What we are building** — clear description of the project
2. **Current goal** — the specific thing to accomplish in this session
3. **Decisions so far** — key technical and product decisions made during brainstorming
4. **Known issues & constraints** — hard requirements and limitations: ${context.constraints.join(', ') || 'as discussed'}
5. **Brainstorm notes** — summarise the key points and nuances from the conversation in bullet form

This document will be read by AI agents in future sessions — make it dense with useful, specific information.
`.trim(),

  env: (context, _graph) =>
    `
## Brainstorm conversation (source of truth)
${fullConversation(context)}

Write an Environment & Setup document for this project.

Start with: # Environment & Setup

Include all of these sections, based on the actual tech stack (${context.techStack.join(', ') || 'as discussed'}):
1. **Required environment variables** — a Markdown table with columns: Variable | Purpose | How to get. Include every env var that would be needed for this specific project.
2. **Local development** — numbered steps to get this project running locally, using the actual tools and commands for this stack.
3. **Deployment** — hosting target, build command, deployment checklist specific to this project.

Rules:
- Never include real secret values — only variable names and how to obtain them.
- Use the actual tech stack and project details, not generic examples.
- If a step requires a specific tool (e.g. Docker, a specific CLI), name it.
`.trim(),
};

export class ProjectDocsGenerator {
  constructor(
    private callModel: (
      messages: ChatMessage[],
      system: string,
    ) => Promise<string>,
  ) {}

  private async generateOne(
    docType: keyof GeneratedDocs,
    context: ContextSpec,
    graph: TaskGraph,
    fallback: string,
  ): Promise<string> {
    try {
      const prompt = DOC_PROMPTS[docType](context, graph);
      const result = await this.callModel(
        [{ role: 'user', content: prompt }],
        SYSTEM_PROMPT,
      );
      const trimmed = result.trim();
      return trimmed.length > 50 ? trimmed : fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Generates each document individually in sequence so progress can be
   * reported and each document gets a focused, full-context prompt.
   */
  async generate(
    context: ContextSpec,
    graph: TaskGraph,
    onProgress?: (doc: string) => void,
  ): Promise<GeneratedDocs> {
    const docs: Partial<GeneratedDocs> = {};

    const steps: Array<[keyof GeneratedDocs, string, string]> = [
      ['prd', 'PRD.md', buildPrdMarkdown(context)],
      ['architecture', 'ARCHITECTURE.md', buildArchitectureMarkdown(context)],
      ['context', 'CONTEXT.md', buildContextMarkdown(context)],
      ['env', 'ENV.md', buildEnvMarkdown()],
    ];

    for (const [key, label, fallback] of steps) {
      onProgress?.(label);
      docs[key] = await this.generateOne(key, context, graph, fallback);
    }

    return docs as GeneratedDocs;
  }
}
