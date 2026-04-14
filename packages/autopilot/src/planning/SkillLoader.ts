import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { glob } from 'glob';
import type { Skill, SkillSummary } from '../types.js';
import { getBundledAutopilotSkillsDir } from '../bundledSkillsDir.js';

const SKILL_HEAD_BYTES = 16_384;

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

  constructor(customPath?: string, extraPaths: readonly string[] = []) {
    const bundled = getBundledAutopilotSkillsDir();
    this.searchPaths = dedupePaths([
      customPath,
      ...extraPaths,
      path.join(os.homedir(), '.qwen', 'skills'),
      path.join(process.cwd(), '.qwen', 'skills'),
      path.join(process.cwd(), '.agent', 'skills'),
      path.join(process.cwd(), '.claude', 'skills'),
      bundled,
    ]);
  }

  /**
   * Discover every `SKILL.md` under all search paths, reading only the first
   * chunk of each file for descriptions. Later paths do not override skill
   * names already seen (first wins).
   */
  async loadSummaries(): Promise<SkillSummary[]> {
    const seenNames = new Set<string>();
    const summaries: SkillSummary[] = [];

    for (const dir of this.searchPaths) {
      try {
        await fs.access(dir);
      } catch {
        continue;
      }

      const files = await glob('**/SKILL.md', { cwd: dir, absolute: true });

      for (const file of files) {
        try {
          const fh = await fs.open(file, 'r');
          const buf = Buffer.alloc(SKILL_HEAD_BYTES);
          const { bytesRead } = await fh.read(buf, 0, SKILL_HEAD_BYTES, 0);
          await fh.close();
          const head = buf.subarray(0, bytesRead).toString('utf-8');
          const summary = this.parseSummary(head, file, dir);
          if (seenNames.has(summary.name)) {
            continue;
          }
          seenNames.add(summary.name);
          summaries.push(summary);
        } catch {
          // skip unreadable files
        }
      }
    }

    if (summaries.length === 0) {
      console.warn(
        '[autopilot] No skills loaded. The CLI ships default skills in the install; if you see this, your build may be incomplete. You can also install more under ~/.qwen/skills, add autopilot.extraSkillsPaths, or set autopilot.skillsPath.',
      );
    }

    return summaries;
  }

  async hydrateSummaries(summaries: SkillSummary[]): Promise<Skill[]> {
    const skills: Skill[] = [];
    for (const s of summaries) {
      try {
        const content = await fs.readFile(s.path, 'utf-8');
        skills.push(this.parse(s.path, content, s.baseDir));
      } catch {
        // skip
      }
    }
    return skills;
  }

  /**
   * Full load (every skill body). Prefer {@link loadSummaries} + match +
   * {@link hydrateSummaries} for large libraries.
   */
  async loadAll(): Promise<Skill[]> {
    const summaries = await this.loadSummaries();
    return this.hydrateSummaries(summaries);
  }

  async loadByName(name: string): Promise<Skill | undefined> {
    const summaries = await this.loadSummaries();
    const normalized = name.replace(/^@/, '').toLowerCase();
    const hit = summaries.find((s) => s.name.toLowerCase() === normalized);
    if (!hit) {
      return undefined;
    }
    const [skill] = await this.hydrateSummaries([hit]);
    return skill;
  }

  /**
   * Load a single skill by its folder name (e.g. `e2e-testing` →
   * `<searchPath>/e2e-testing/SKILL.md`), trying each search path in order.
   */
  async loadFromFolderName(folderName: string): Promise<Skill | undefined> {
    const normalized = folderName.replace(/^@/, '').trim();
    if (!normalized) {
      return undefined;
    }

    for (const dir of this.searchPaths) {
      const filePath = path.join(dir, normalized, 'SKILL.md');
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return this.parse(filePath, content, dir);
      } catch {
        continue;
      }
    }

    return undefined;
  }

  private parseSummary(
    head: string,
    filePath: string,
    baseDir: string,
  ): SkillSummary {
    const relDir = path.relative(baseDir, path.dirname(filePath));
    const name = relDir.split(path.sep).pop() ?? relDir;
    const description = this.extractDescriptionFromHead(head);
    const tags = this.extractTags(name, head);
    return { name, path: filePath, baseDir, description, tags };
  }

  private extractDescriptionFromHead(head: string): string {
    const fm = head.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fm) {
      const body = fm[1] ?? '';
      const line = body.match(/^description:\s*(.+)$/m);
      if (line?.[1]) {
        return line[1].trim().replace(/^["']|["']$/g, '');
      }
      const afterFm = head.slice(fm[0].length).trim();
      const firstLine = afterFm
        .split('\n')
        .find((l) => l.trim().length > 0 && !l.trim().startsWith('#'));
      return (firstLine ?? '').trim().slice(0, 280);
    }

    const descMatch = head.match(/^#\s*[^\n]+\n+([^\n#]+)/m);
    return (descMatch?.[1]?.trim() ?? '').slice(0, 280);
  }

  private parse(filePath: string, content: string, baseDir: string): Skill {
    const relDir = path.relative(baseDir, path.dirname(filePath));
    const name = relDir.split(path.sep).pop() ?? relDir;

    const descFromFm = this.extractDescriptionFromHead(
      content.slice(0, SKILL_HEAD_BYTES),
    );
    const descMatch = content.match(/^#\s*[^\n]+\n+([^\n#]+)/m);
    const description = descFromFm || descMatch?.[1]?.trim() || '';

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
