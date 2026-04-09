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
  'Return only a valid JSON object — no extra text, no code fences.';

const buildPrompt = (context: ContextSpec, graph: TaskGraph): string =>
  `
Generate comprehensive documentation for this software project.

## Project context
${JSON.stringify(context, null, 2)}

## Planned tasks
${graph.tasks.map((t) => `- **${t.title}**: ${t.description}`).join('\n')}

Return a JSON object with exactly these four string keys:

{
  "prd": "<full PRD.md content>",
  "architecture": "<full ARCHITECTURE.md content>",
  "context": "<full CONTEXT.md content>",
  "env": "<full ENV.md content>"
}

Requirements for each document:

**prd** — Product Requirements Document
- H1: "# Product Requirements Document"
- Sections: Product overview & goals, User personas, Features & user stories,
  Out of scope, Success metrics, Technical context (output shape, tech stack, constraints).
- Be specific: name the real idea, goal, stack, and constraints from the context above.

**architecture** — System Architecture
- H1: "# System Architecture"
- Sections: Tech stack (with versions where known), Folder / project structure
  (realistic tree for this type of project), Data & persistence, API design overview,
  Third-party integrations, Runtime & deployment.
- Tailor to the outputFormat: ${context.outputFormat}.

**context** — Project Context (living session memory)
- H1: "# Project Context"
- Sections: What we are building, Current goal, Decisions so far, Known issues & constraints,
  Brainstorm notes.
- Summarise the clarifications and decisions captured during brainstorm.

**env** — Environment & Setup
- H1: "# Environment & Setup"
- Sections: Required environment variables (table with Variable / Purpose / How to get),
  Local development steps numbered, Deployment notes.
- Base the steps on the actual tech stack: ${context.techStack.join(', ') || 'unknown'}.
- Never include real secret values — only variable names.
`.trim();

export class ProjectDocsGenerator {
  constructor(
    private callModel: (
      messages: ChatMessage[],
      system: string,
    ) => Promise<string>,
  ) {}

  async generate(
    context: ContextSpec,
    graph: TaskGraph,
  ): Promise<GeneratedDocs> {
    try {
      const response = await this.callModel(
        [{ role: 'user', content: buildPrompt(context, graph) }],
        SYSTEM_PROMPT,
      );

      const cleaned = response
        .replace(/```json[\s\S]*?```|```[\s\S]*?```/g, (m) =>
          m.replace(/```json|```/g, ''),
        )
        .trim();

      const parsed = JSON.parse(cleaned) as Partial<Record<string, string>>;

      return {
        prd: parsed['prd']?.trim() || buildPrdMarkdown(context),
        architecture:
          parsed['architecture']?.trim() || buildArchitectureMarkdown(context),
        context: parsed['context']?.trim() || buildContextMarkdown(context),
        env: parsed['env']?.trim() || buildEnvMarkdown(),
      };
    } catch {
      // Fall back to static templates if the model call or JSON parse fails.
      return {
        prd: buildPrdMarkdown(context),
        architecture: buildArchitectureMarkdown(context),
        context: buildContextMarkdown(context),
        env: buildEnvMarkdown(),
      };
    }
  }
}
