import { describe, it, expect } from 'vitest';
import { SkillLoader } from './SkillLoader.js';

describe('SkillLoader bundled defaults', () => {
  it('loads shipped bundled skills without ~/.qwen/skills', async () => {
    const loader = new SkillLoader(
      // Intentionally non-existent so resolution falls through to bundled-skills
      '/nonexistent/autopilot-skills-path-for-test',
    );
    const skills = await loader.loadAll();
    const names = skills.map((s) => s.name).sort();
    expect(names).toContain('architecture');
    expect(names).toContain('brainstorming');
    expect(skills.length).toBeGreaterThanOrEqual(2);
  });
});
