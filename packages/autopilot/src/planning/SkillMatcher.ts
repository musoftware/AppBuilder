import type { Skill, ContextSpec, ChatMessage } from '../types.js';

const ALWAYS_INCLUDE = ['brainstorming', 'architecture'];

const MATCHER_PROMPT = (context: ContextSpec, skillNames: string[]) =>
  `
You are selecting the best skills from a library to automatically build a project.

Project context:
- Idea: ${context.idea}
- Goal: ${context.goal}
- Tech stack: ${context.techStack.join(', ') || 'not specified'}
- Output format: ${context.outputFormat}
- Constraints: ${context.constraints.join(', ') || 'none'}

Available skills (name only):
${skillNames.map((n) => `- ${n}`).join('\n')}

Select the 4–8 most relevant skills for this project.
Return ONLY a JSON array of skill names, no explanation.
Example: ["brainstorming", "architecture", "test-driven-development", "create-pr"]
`.trim();

export class SkillMatcher {
  constructor(
    private callModel: (
      messages: ChatMessage[],
      system: string,
    ) => Promise<string>,
  ) {}

  async match(context: ContextSpec, allSkills: Skill[]): Promise<Skill[]> {
    const skillMap = new Map(allSkills.map((s) => [s.name, s]));
    const skillNames = allSkills.map((s) => s.name);

    const selected = new Set<string>(
      ALWAYS_INCLUDE.filter((n) => skillMap.has(n)),
    );

    try {
      const prompt = MATCHER_PROMPT(context, skillNames);
      const response = await this.callModel(
        [{ role: 'user', content: prompt }],
        'You are a precise JSON-outputting assistant. Return only valid JSON arrays.',
      );

      const cleaned = response.replace(/```json|```/g, '').trim();
      const names: string[] = JSON.parse(cleaned) as string[];
      if (Array.isArray(names)) {
        for (const name of names) {
          if (typeof name === 'string' && skillMap.has(name)) {
            selected.add(name);
          }
        }
      }
    } catch {
      const keywords = [
        context.outputFormat,
        ...context.techStack.map((t) => t.toLowerCase()),
      ];
      for (const skill of allSkills) {
        if (keywords.some((kw) => skill.tags.includes(kw))) {
          selected.add(skill.name);
        }
      }
    }

    return [...selected]
      .map((n) => skillMap.get(n))
      .filter((s): s is Skill => s !== undefined);
  }
}
