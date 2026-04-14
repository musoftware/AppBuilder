/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

export type ChainCache = {
  version: number;
  createdAt: string;
  updatedAt: string;
  gitCommit: string;
  gitBranch: string;
  projectContext: string;
};

const CACHE_VERSION = 1;

const PROJECT_CONTEXT_BLOCK_RE =
  /---PROJECT CONTEXT START---[\s\S]*?---PROJECT CONTEXT END---/;

export function getChainCacheFilePath(workspaceRoot: string): string {
  return join(workspaceRoot, '.ai-docs', '.chain-cache.json');
}

function getGitCommit(workspaceRoot: string): string {
  try {
    return execSync('git rev-parse HEAD', {
      cwd: workspaceRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'no-git';
  }
}

function getGitBranch(workspaceRoot: string): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: workspaceRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'unknown';
  }
}

function getChangedFilesSince(
  workspaceRoot: string,
  sinceCommit: string,
): string[] {
  try {
    const output = execSync(`git diff --name-only ${sinceCommit} HEAD`, {
      cwd: workspaceRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
    }).trim();
    return output ? output.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function readCache(workspaceRoot: string): ChainCache | null {
  const cachePath = getChainCacheFilePath(workspaceRoot);
  if (!existsSync(cachePath)) {
    return null;
  }
  try {
    const raw = readFileSync(cachePath, 'utf-8');
    const parsed = JSON.parse(raw) as ChainCache;
    if (parsed.version !== CACHE_VERSION) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Writes or replaces the chain cache, preserving createdAt when updating an existing file.
 */
export function writeCache(
  workspaceRoot: string,
  projectContext: string,
): ChainCache {
  const aiDocsDir = join(workspaceRoot, '.ai-docs');
  if (!existsSync(aiDocsDir)) {
    mkdirSync(aiDocsDir, { recursive: true });
  }

  const existing = readCache(workspaceRoot);
  const now = new Date().toISOString();
  const cache: ChainCache = {
    version: CACHE_VERSION,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    gitCommit: getGitCommit(workspaceRoot),
    gitBranch: getGitBranch(workspaceRoot),
    projectContext,
  };

  writeFileSync(
    getChainCacheFilePath(workspaceRoot),
    `${JSON.stringify(cache, null, 2)}\n`,
    'utf-8',
  );
  return cache;
}

export function updateCache(
  workspaceRoot: string,
  updatedContext: string,
): void {
  const existing = readCache(workspaceRoot);
  const now = new Date().toISOString();
  const cache: ChainCache = {
    version: CACHE_VERSION,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    gitCommit: getGitCommit(workspaceRoot),
    gitBranch: getGitBranch(workspaceRoot),
    projectContext: updatedContext,
  };
  const aiDocsDir = join(workspaceRoot, '.ai-docs');
  if (!existsSync(aiDocsDir)) {
    mkdirSync(aiDocsDir, { recursive: true });
  }
  writeFileSync(
    getChainCacheFilePath(workspaceRoot),
    `${JSON.stringify(cache, null, 2)}\n`,
    'utf-8',
  );
}

export type CacheCheckResult =
  | { status: 'fresh'; cache: ChainCache }
  | { status: 'stale'; cache: ChainCache; changedFiles: string[] }
  | { status: 'missing' };

export function checkCache(workspaceRoot: string): CacheCheckResult {
  const currentCommit = getGitCommit(workspaceRoot);
  if (currentCommit === 'no-git') {
    return { status: 'missing' };
  }

  const cache = readCache(workspaceRoot);
  if (!cache) {
    return { status: 'missing' };
  }

  if (currentCommit === cache.gitCommit) {
    return { status: 'fresh', cache };
  }

  const changedFiles = getChangedFilesSince(workspaceRoot, cache.gitCommit);
  return { status: 'stale', cache, changedFiles };
}

export function buildDeltaScanPrompt(
  cachedContext: string,
  changedFiles: string[],
): string {
  const fileList =
    changedFiles.length > 0
      ? changedFiles.map((f) => `- ${f}`).join('\n')
      : '- (no files listed by git diff — verify with git status)';

  return `[FULL CHAIN — DELTA SCAN (cache update)]

The project context was previously captured and is cached.
Since that capture, the following files have changed:

CHANGED FILES:
${fileList}

Your job is to UPDATE the cached project context — not re-analyze everything.

CACHED CONTEXT (current):
${cachedContext}

Instructions:
1. Read ONLY the changed files listed above.
2. Identify what changed in those files that affects the project context:
   - New features added or removed
   - New routes or commands added
   - Schema changes (new models, fields, relations)
   - New dependencies added to package.json
   - New roles or permissions
   - Entry point changes
3. Output an UPDATED version of the full project context block,
   merging the changes into the existing context.

Output the complete updated context in this exact format:
---PROJECT CONTEXT START---
APP: <name — one sentence>
TYPE: <app type>
DOMAIN: <business domain>
ROLES: <comma-separated list>
STACK: <key technologies>
ENTRY: <entry file path>
FEATURES:
- <feature>: COMPLETE | PARTIAL | STUB
ROLE MAP:
- <role>: <what exists>
CHANGED SINCE LAST RUN:
- <what changed>
---PROJECT CONTEXT END---

Do NOT re-scan files that are not in the changed list.
Do NOT restart the full analysis.
Only update what changed.`;
}

export function extractProjectContextBlock(
  assistantOutput: string,
): string | null {
  const m = assistantOutput.match(PROJECT_CONTEXT_BLOCK_RE);
  return m ? m[0] : null;
}

/**
 * Persists PROJECT CONTEXT from a phase-0 assistant message into .ai-docs/.chain-cache.json.
 * @returns true if a block was found and written
 */
export function persistProjectContextFromAssistantOutput(
  workspaceRoot: string,
  assistantOutput: string,
): boolean {
  const block = extractProjectContextBlock(assistantOutput);
  if (!block) {
    return false;
  }
  writeCache(workspaceRoot, block);
  return true;
}

export function clearChainCacheFile(workspaceRoot: string): boolean {
  const p = getChainCacheFilePath(workspaceRoot);
  if (!existsSync(p)) {
    return false;
  }
  unlinkSync(p);
  return true;
}
