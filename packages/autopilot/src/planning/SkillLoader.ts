import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { glob } from 'glob';
import type { Skill } from '../types.js';
import { getBundledAutopilotSkillsDir } from '../bundledSkillsDir.js';

function dedupePaths(paths: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of paths) {
    if (!p) {
      continue;
    }
    const norm = path.normalize(p);
    if (seen.has(norm)) {
      continue;
    }
    seen.add(norm);
    out.push(norm);
  }
  return out;
}

export class SkillLoader {
  private readonly searchPaths: string[];

  constructor(customPath?: string) {
    const bundled = getBundledAutopilotSkillsDir();
    this.searchPaths = dedupePaths([
      customPath,
      path.join(os.homedir(), '.qwen', 'skills'),
      path.join(process.cwd(), '.qwen', 'skills'),
      path.join(process.cwd(), '.agent', 'skills'),
      path.join(process.cwd(), '.claude', 'skills'),
      bundled,
    ]);
  }

  async loadAll(): Promise<Skill[]> {
    const skills: Skill[] = [];

    for (const dir of this.searchPaths) {
      try {
        await fs.access(dir);
      } catch {
        continue;
      }

      const files = await glob('**/SKILL.md', { cwd: dir, absolute: true });

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const skill = this.parse(file, content, dir);
          skills.push(skill);
        } catch {
          // skip unreadable files
        }
      }

      if (skills.length > 0) {
        break;
      }
    }

    if (skills.length === 0) {
      console.warn(
        '[autopilot] No skills loaded. The CLI ships default skills in the install; if you see this, your build may be incomplete. You can also install more under ~/.qwen/skills or set autopilot.skillsPath in settings.',
      );
    }

    return skills;
  }

  async loadByName(name: string): Promise<Skill | undefined> {
    const all = await this.loadAll();
    const normalized = name.replace(/^@/, '').toLowerCase();
    return all.find((s) => s.name.toLowerCase() === normalized);
  }

  private parse(filePath: string, content: string, baseDir: string): Skill {
    const relDir = path.relative(baseDir, path.dirname(filePath));
    const name = relDir.split(path.sep).pop() ?? relDir;

    const descMatch = content.match(/^#[^\n]+\n+([^\n#]+)/m);
    const description = descMatch?.[1]?.trim() ?? '';

    const tags = this.extractTags(name, content);

    return { name, path: filePath, content, tags, description };
  }

  private extractTags(name: string, content: string): string[] {
    const tags = new Set<string>([name]);
    const lower = content.toLowerCase();

    const keywords = [
      'typescript',
      'javascript',
      'python',
      'react',
      'node',
      'api',
      'security',
      'testing',
      'docker',
      'aws',
      'frontend',
      'backend',
      'database',
      'architecture',
      'design',
      'documentation',
      'brainstorming',
      'debugging',
      'performance',
      'deployment',
      'cli',
    ];

    for (const kw of keywords) {
      if (lower.includes(kw)) {
        tags.add(kw);
      }
    }

    return [...tags];
  }
}
