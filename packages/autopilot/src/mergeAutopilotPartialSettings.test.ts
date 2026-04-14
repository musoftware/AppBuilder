import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, mergeAutopilotPartialSettings } from './types.js';

describe('mergeAutopilotPartialSettings', () => {
  it('preserves default goTriggers when partial omits or passes undefined', () => {
    expect(mergeAutopilotPartialSettings({}).goTriggers).toEqual(
      DEFAULT_SETTINGS.goTriggers,
    );
    expect(
      mergeAutopilotPartialSettings({
        goTriggers: undefined,
      }).goTriggers,
    ).toEqual(DEFAULT_SETTINGS.goTriggers);
  });

  it('falls back to default goTriggers for empty array', () => {
    expect(
      mergeAutopilotPartialSettings({ goTriggers: [] }).goTriggers,
    ).toEqual(DEFAULT_SETTINGS.goTriggers);
  });

  it('uses custom goTriggers when non-empty', () => {
    expect(
      mergeAutopilotPartialSettings({ goTriggers: ['ship'] }).goTriggers,
    ).toEqual(['ship']);
  });

  it('preserves maxTaskRetries 0 (nullish merge)', () => {
    expect(
      mergeAutopilotPartialSettings({ maxTaskRetries: 0 }).maxTaskRetries,
    ).toBe(0);
  });

  it('preserves default skillsPath when partial skillsPath is undefined', () => {
    expect(
      mergeAutopilotPartialSettings({ skillsPath: undefined }).skillsPath,
    ).toBe(DEFAULT_SETTINGS.skillsPath);
  });

  it('uses default extraSkillsPaths when partial omits or passes empty', () => {
    expect(mergeAutopilotPartialSettings({}).extraSkillsPaths).toEqual([]);
    expect(
      mergeAutopilotPartialSettings({ extraSkillsPaths: undefined })
        .extraSkillsPaths,
    ).toEqual([]);
    expect(
      mergeAutopilotPartialSettings({ extraSkillsPaths: [] }).extraSkillsPaths,
    ).toEqual([]);
  });

  it('uses custom extraSkillsPaths when non-empty', () => {
    expect(
      mergeAutopilotPartialSettings({
        extraSkillsPaths: ['/a', '/b'],
      }).extraSkillsPaths,
    ).toEqual(['/a', '/b']);
  });
});
