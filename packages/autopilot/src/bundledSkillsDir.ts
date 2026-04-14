import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Directory containing autopilot SKILL.md trees (recursive) shipped with the CLI.
 *
 * Resolution order (first existing directory wins):
 *  1. `dist/src/autopilot-bundled-skills` — unbundled dev build
 *  2. `dist/src/bundled-skills` — unbundled dev build (legacy)
 *  3. `dist/autopilot-bundled-skills` — bundled single-file CLI (next to cli.js)
 *  4. `dist/project-brain-skills` — bundled single-file CLI (fallback)
 */
export function getBundledAutopilotSkillsDir(): string | undefined {
  const here = path.dirname(fileURLToPath(import.meta.url));

  // Relative to autopilot source file (dev / unbundled)
  const devCandidates = [
    path.join(here, 'autopilot-bundled-skills'),
    ...(path.basename(here) === 'src'
      ? [path.join(here, 'bundled-skills')]
      : []),
  ];

  for (const dir of devCandidates) {
    try {
      if (fs.existsSync(dir)) {
        return dir;
      }
    } catch {
      /* ignore */
    }
  }

  // Relative to CLI entry point (bundled single-file)
  // import.meta.url in bundled CLI points to cli.js or nearby
  const cliDir = findCliDistDir(here);
  if (cliDir) {
    const bundleCandidates = [
      path.join(cliDir, 'autopilot-bundled-skills'),
      path.join(cliDir, 'project-brain-skills'),
    ];
    for (const dir of bundleCandidates) {
      try {
        if (fs.existsSync(dir)) {
          return dir;
        }
      } catch {
        /* ignore */
      }
    }
  }

  return undefined;
}

/**
 * Walk up from the current file's directory to find the `dist/` folder
 * that contains `cli.js` or `project-brain-skills/`.
 */
function findCliDistDir(startDir: string): string | null {
  let current = startDir;
  for (let i = 0; i < 5; i++) {
    // Check if this directory has cli.js or project-brain-skills
    if (
      fs.existsSync(path.join(current, 'cli.js')) ||
      fs.existsSync(path.join(current, 'project-brain-skills'))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break; // Reached root
    current = parent;
  }
  return null;
}
