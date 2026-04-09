import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Directory containing autopilot SKILL.md trees (recursive) shipped with the CLI.
 * Unbundled: dist/src/bundled-skills (from src/bundled-skills via copy_files).
 * Bundled single file: dist/autopilot-bundled-skills next to cli.js.
 */
export function getBundledAutopilotSkillsDir(): string | undefined {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(here, 'autopilot-bundled-skills'),
    ...(path.basename(here) === 'src'
      ? [path.join(here, 'bundled-skills')]
      : []),
  ];
  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir)) {
        return dir;
      }
    } catch {
      /* ignore */
    }
  }
  return undefined;
}
