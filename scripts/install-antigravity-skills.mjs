/**
 * Shallow-clone antigravity-awesome-skills into ~/.qwen/skill-libraries/
 * and print the autopilot.extraSkillsPaths entry to add to your Qwen Code
 * settings (skills live under <clone>/skills — do not commit them to this repo).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const REPO = 'https://github.com/sickn33/antigravity-awesome-skills';
const TARGET_DIR = path.join(
  os.homedir(),
  '.qwen',
  'skill-libraries',
  'antigravity-awesome-skills',
);
const SKILLS_SUBDIR = path.join(TARGET_DIR, 'skills');

function main() {
  if (fs.existsSync(path.join(TARGET_DIR, '.git'))) {
    console.log(`Already present: ${TARGET_DIR}`);
    console.log('Pull latest with: git -C ' + JSON.stringify(TARGET_DIR) + ' pull');
  } else {
    fs.mkdirSync(path.dirname(TARGET_DIR), { recursive: true });
    execSync(`git clone --depth 1 ${REPO} "${TARGET_DIR}"`, {
      stdio: 'inherit',
    });
  }

  if (!fs.existsSync(SKILLS_SUBDIR)) {
    console.error('Expected skills directory missing:', SKILLS_SUBDIR);
    process.exit(1);
  }

  const entry = path.resolve(SKILLS_SUBDIR);
  console.log('');
  console.log('Add this to your settings (autopilot.extraSkillsPaths):');
  console.log(JSON.stringify([entry], null, 2));
  console.log('');
  console.log(
    'License: see the cloned repo (MIT + content terms). Use at your own risk.',
  );
}

main();
