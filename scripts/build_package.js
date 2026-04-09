/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { execFileSync, execSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

if (!process.cwd().includes('packages')) {
  console.error('must be invoked from a package directory');
  process.exit(1);
}

/**
 * Resolve typescript/bin/tsc.js by walking up from the package dir (npm may
 * hoist `typescript` to the workspace root with no local node_modules copy).
 */
function resolveTscJs() {
  let dir = process.cwd();
  for (;;) {
    const tscBin = join(dir, 'node_modules', 'typescript', 'bin', 'tsc');
    if (existsSync(tscBin)) {
      return tscBin;
    }
    const tscJs = join(dir, 'node_modules', 'typescript', 'bin', 'tsc.js');
    if (existsSync(tscJs)) {
      return tscJs;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
}

const tscJs = resolveTscJs();
if (!tscJs) {
  console.error(
    'Could not find typescript (tsc). Run `npm install` from the repository root.',
  );
  process.exit(1);
}

// build typescript files
execFileSync(process.execPath, [tscJs, '--build'], { stdio: 'inherit' });

// copy .{md,json} files
execSync('node ../../scripts/copy_files.js', { stdio: 'inherit' });

// touch dist/.last_build
writeFileSync(join(process.cwd(), 'dist', '.last_build'), '');
process.exit(0);
