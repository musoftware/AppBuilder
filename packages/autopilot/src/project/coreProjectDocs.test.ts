import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { writeCoreProjectDocs, buildPrdMarkdown } from './coreProjectDocs.js';
import type { ContextSpec, TaskGraph } from '../types.js';

const sampleContext: ContextSpec = {
  idea: 'Todo API',
  goal: 'Ship REST API with auth',
  techStack: ['node', 'typescript'],
  constraints: ['no cloud lock-in'],
  outputFormat: 'api',
  clarifications: { note: 'test' },
};

const sampleGraph: TaskGraph = {
  estimatedSteps: 1,
  tasks: [
    {
      id: 't1',
      title: 'Scaffold',
      description: 'Create package layout',
      dependsOn: [],
      type: 'scaffold',
      status: 'pending',
    },
  ],
};

describe('coreProjectDocs', () => {
  it('buildPrdMarkdown includes idea and goal', () => {
    const md = buildPrdMarkdown(sampleContext);
    expect(md).toContain('Todo API');
    expect(md).toContain('Ship REST API');
    expect(md).toContain('node');
  });

  it('writeCoreProjectDocs creates core files and refreshes TASKS.md', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ap-doc-'));
    const first = await writeCoreProjectDocs(dir, sampleContext, sampleGraph);
    expect(first.created).toContain('PRD.md');
    expect(first.created).toContain('PROJECT.md');
    expect(first.created).toContain('TASKS.md');

    const prd = await fs.readFile(path.join(dir, 'PRD.md'), 'utf8');
    expect(prd).toContain('Todo API');

    await fs.writeFile(path.join(dir, 'marker.txt'), 'x', 'utf8');
    const second = await writeCoreProjectDocs(dir, sampleContext, {
      ...sampleGraph,
      tasks: [
        ...sampleGraph.tasks,
        {
          id: 't2',
          title: 'Second',
          description: 'More',
          dependsOn: ['t1'],
          type: 'implement',
          status: 'pending',
        },
      ],
    });
    expect(second.created).not.toContain('PRD.md');
    expect(second.updated).toContain('TASKS.md');

    const tasks = await fs.readFile(path.join(dir, 'TASKS.md'), 'utf8');
    expect(tasks).toContain('Second');
  });
});
