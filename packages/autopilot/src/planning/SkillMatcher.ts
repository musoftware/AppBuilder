import type { SkillSummary, ContextSpec, ChatMessage } from '../types.js';

const ALWAYS_INCLUDE = ['brainstorming', 'architecture'];

/** Max skills whose name+description are sent to the model for selection. */
const MATCHER_CANDIDATE_CAP = 56;

function tokenizeContext(context: ContextSpec): string[] {
  const textBlob = [
    context.idea,
    context.goal,
    ...context.techStack,
    ...context.constraints,
    context.outputFormat,
    ...Object.values(context.clarifications),
  ]
    .join(' ')
    .toLowerCase();

  return Array.from(
    new Set(
      textBlob
        .split(/[^a-z0-9+/.-]+/i)
        .filter((t) => t.length > 2)
        .slice(0, 100),
    ),
  );
}

function prefilterSummaries(
  context: ContextSpec,
  summaries: SkillSummary[],
  max: number,
): SkillSummary[] {
  const tokens = tokenizeContext(context);
  const scored = summaries
    .map((s) => {
      const skillText =
        `${s.name} ${s.description} ${s.tags.join(' ')}`.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (skillText.includes(t)) {
          score += 2;
        }
      }
      return { s, score };
    })
    .sort((a, b) => b.score - a.score);

  const out: SkillSummary[] = [];
  const seen = new Set<string>();

  for (const name of ALWAYS_INCLUDE) {
    const hit = summaries.find((x) => x.name === name);
    if (hit && !seen.has(hit.name)) {
      out.push(hit);
      seen.add(hit.name);
    }
  }

  for (const { s } of scored) {
    if (out.length >= max) {
      break;
    }
    if (!seen.has(s.name)) {
      out.push(s);
      seen.add(s.name);
    }
  }

  return out;
}

const MATCHER_PROMPT = (context: ContextSpec, candidates: SkillSummary[]) =>
  `
You are selecting the best skills from a library for an AI coding agent run.

Project context:
- Idea: ${context.idea}
- Goal: ${context.goal}
- Tech stack: ${context.techStack.join(', ') || 'not specified'}
- Output format: ${context.outputFormat}
- Constraints: ${context.constraints.join(', ') || 'none'}

Candidate skills (pick only from this list — use exact "name" values):
${candidates.map((s) => `- ${s.name}: ${s.description || '(no description)'}`).join('\n')}

Select the 4–8 most relevant skills for this job.
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

  /**
   * Chooses a small set of skills using a cheap prefilter plus one model call.
   * For large libraries, only a capped candidate list is shown to the model.
   */
  async match(
    context: ContextSpec,
    allSummaries: SkillSummary[],
  ): Promise<SkillSummary[]> {
    const candidates = prefilterSummaries(
      context,
      allSummaries,
      MATCHER_CANDIDATE_CAP,
    );
    const candidateMap = new Map(candidates.map((s) => [s.name, s]));

    const selected = new Set<string>();
    for (const name of ALWAYS_INCLUDE) {
      if (candidateMap.has(name)) {
        selected.add(name);
      }
    }

    try {
      const prompt = MATCHER_PROMPT(context, candidates);
      const response = await this.callModel(
        [{ role: 'user', content: prompt }],
        'You are a precise JSON-outputting assistant. Return only valid JSON arrays.',
      );

      const cleaned = response.replace(/```json|```/g, '').trim();
      const names: string[] = JSON.parse(cleaned) as string[];
      if (Array.isArray(names)) {
        for (const name of names) {
          if (typeof name === 'string' && candidateMap.has(name)) {
            selected.add(name);
          }
        }
      }
    } catch {
      const keywords = [
        context.outputFormat,
        ...context.techStack.map((t) => t.toLowerCase()),
      ];
      for (const s of candidates) {
        if (keywords.some((kw) => s.tags.includes(kw))) {
          selected.add(s.name);
        }
      }
      if (selected.size === 0) {
        for (const s of candidates.slice(0, 8)) {
          selected.add(s.name);
        }
      }
    }

    return [...selected]
      .map((n) => candidateMap.get(n))
      .filter((s): s is SkillSummary => s !== undefined);
  }
}
