/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ChatMessage, ContextSpec, AutopilotSettings } from '../types.js';

/**
 * Extracts structured project context directly from a simple idea string
 * without the conversational brainstorm Q&A phase. Used by `--idea` to go
 * straight to skill selection, planning, and autonomous execution.
 */
export class IdeaDirectPlanner {
  private callModel: (
    messages: ChatMessage[],
    system: string,
  ) => Promise<string>;

  constructor(
    _settings: AutopilotSettings,
    callModel: (messages: ChatMessage[], system: string) => Promise<string>,
  ) {
    this.callModel = callModel;
  }

  /**
   * Extract a full ContextSpec from a simple idea string in one model call.
   * The model infers missing details from the idea text using sensible defaults
   * for greenfield projects.
   */
  async extractContextSpec(idea: string): Promise<ContextSpec> {
    const prompt = `You are an expert technical analyst converting a simple idea string into a structured project specification for autonomous AI code generation.

## User's idea
"${idea}"

Extract the key details and return ONLY a valid JSON object with exactly these fields:

{
  "idea": "One clear sentence describing what is being built",
  "goal": "What the user wants to achieve / definition of done for this session — be specific about what 'working' looks like",
  "outputFormat": "cli | web-app | api | library | mobile-app | desktop-app | other",
  "techStack": ["list", "of", "specific", "languages/frameworks/tools", "inferred from idea or sensible defaults"],
  "constraints": ["list", "of", "hard", "requirements", "or", "restrictions", "inferred from context"]
}

Rules:
- Be specific — use the user's actual words, names, and details from the idea.
- Infer sensible defaults for anything not mentioned (e.g., if they say "web app", assume React + Node.js + PostgreSQL unless they specify otherwise).
- For techStack, include concrete, modern choices: language, framework, database, testing library, deployment target if relevant.
- For constraints, include anything implicit in the idea (e.g., "simple" → no microservices, "production" → auth + error handling + logging).
- If the idea is very brief, make reasonable assumptions but mark them clearly in constraints with "assumed: " prefix.
- Return ONLY the JSON object. No explanation, no markdown fences.`;

    try {
      const response = await this.callModel(
        [{ role: 'user', content: prompt }],
        'Extract structured project specification from an idea. Return only valid JSON.',
      );

      const cleaned = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned) as Partial<ContextSpec>;

      return {
        idea: (parsed.idea as string) || idea,
        goal: (parsed.goal as string) || `Build: ${idea}`,
        outputFormat:
          (parsed.outputFormat as ContextSpec['outputFormat']) || 'other',
        techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
        constraints: Array.isArray(parsed.constraints)
          ? parsed.constraints
          : [],
        clarifications: {
          extractedDirectlyFromIdea: idea,
        },
        projectMode: 'greenfield',
      };
    } catch {
      // Fallback: minimal context from the idea string alone
      return {
        idea,
        goal: `Build: ${idea}`,
        techStack: [],
        constraints: [],
        outputFormat: 'other',
        clarifications: { extractedDirectlyFromIdea: idea },
        projectMode: 'greenfield',
      };
    }
  }
}
