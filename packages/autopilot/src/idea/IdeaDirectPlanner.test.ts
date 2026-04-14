/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { IdeaDirectPlanner } from './IdeaDirectPlanner.js';
import type { AutopilotSettings } from '../types.js';

const DEFAULT_SETTINGS: AutopilotSettings = {
  skillsPath: undefined,
  extraSkillsPaths: [],
  maxTaskRetries: 2,
  planPreviewSeconds: 3,
  goTriggers: ['go', 'start', 'execute', 'run it'],
};

describe('IdeaDirectPlanner', () => {
  it('should extract context spec from a simple idea string', async () => {
    const mockCallModel = vi.fn().mockResolvedValue(
      JSON.stringify({
        idea: 'Build a task manager CLI with SQLite storage',
        goal: 'Create a command-line tool for managing tasks with CRUD operations stored in SQLite',
        outputFormat: 'cli',
        techStack: [
          'TypeScript',
          'Node.js',
          'SQLite',
          'better-sqlite3',
          'Commander.js',
          'Vitest',
        ],
        constraints: [
          'CLI tool for developers',
          'Local storage only, no cloud sync',
        ],
      }),
    );

    const planner = new IdeaDirectPlanner(DEFAULT_SETTINGS, mockCallModel);
    const result = await planner.extractContextSpec(
      'build a task manager CLI with SQLite storage',
    );

    expect(result.idea).toContain('task manager CLI');
    expect(result.outputFormat).toBe('cli');
    expect(result.techStack).toContain('TypeScript');
    expect(result.techStack).toContain('SQLite');
    expect(result.projectMode).toBe('greenfield');
    expect(mockCallModel).toHaveBeenCalledTimes(1);
  });

  it('should handle very brief ideas with sensible defaults', async () => {
    const mockCallModel = vi.fn().mockResolvedValue(
      JSON.stringify({
        idea: 'A todo app',
        goal: 'Build a simple todo application with add/remove/complete functionality',
        outputFormat: 'web-app',
        techStack: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL'],
        constraints: ['assumed: simple web app with basic CRUD operations'],
      }),
    );

    const planner = new IdeaDirectPlanner(DEFAULT_SETTINGS, mockCallModel);
    const result = await planner.extractContextSpec('todo app');

    expect(result.idea).toContain('todo');
    expect(result.outputFormat).toBe('web-app');
    expect(result.techStack.length).toBeGreaterThan(0);
    expect(result.projectMode).toBe('greenfield');
  });

  it('should return fallback context when model call fails', async () => {
    const mockCallModel = vi
      .fn()
      .mockRejectedValue(new Error('Model API error'));

    const planner = new IdeaDirectPlanner(DEFAULT_SETTINGS, mockCallModel);
    const result = await planner.extractContextSpec('build a calculator');

    expect(result.idea).toBe('build a calculator');
    expect(result.goal).toBe('Build: build a calculator');
    expect(result.techStack).toEqual([]);
    expect(result.constraints).toEqual([]);
    expect(result.projectMode).toBe('greenfield');
  });
});
