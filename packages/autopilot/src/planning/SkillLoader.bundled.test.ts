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

  it('loadSummaries indexes bundled skills without reading every full file upfront', async () => {
    const loader = new SkillLoader(
      '/nonexistent/autopilot-skills-path-for-test',
    );
    const summaries = await loader.loadSummaries();
    const names = summaries.map((s) => s.name).sort();
    expect(names).toContain('architecture');
    expect(summaries.every((s) => s.path.endsWith('SKILL.md'))).toBe(true);
  });

  it('loadFromFolderName finds a bundled skill when loadAll would', async () => {
    const loader = new SkillLoader(
      '/nonexistent/autopilot-skills-path-for-test',
    );
    const skill = await loader.loadFromFolderName('architecture');
    expect(skill).toBeDefined();
    expect(skill?.name).toBe('architecture');
    expect(skill?.content.length).toBeGreaterThan(20);
  });

  it('loadFromFolderName returns undefined for missing skill', async () => {
    const loader = new SkillLoader(
      '/nonexistent/autopilot-skills-path-for-test',
    );
    const skill = await loader.loadFromFolderName(
      'definitely-missing-skill-folder-xyz',
    );
    expect(skill).toBeUndefined();
  });
});
