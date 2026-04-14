/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import * as os from 'node:os';
import { promises as fs } from 'node:fs';
import type { QwenCredentials } from './qwenOAuth2.js';

const QWEN_DIR = '.qwen';
const QWEN_CREDENTIAL_FILENAME = 'oauth_creds.json';
const QWEN_ACCOUNTS_FILENAME = 'oauth_accounts.json';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

interface StoredQwenAccount {
  id: string;
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
  quotaExhaustedAt?: number;
  credentials: QwenCredentials;
}

interface QwenAccountStore {
  version: 1;
  activeAccountId?: string;
  nextIndex: number;
  accounts: StoredQwenAccount[];
}

export interface RotateQwenAccountResult {
  rotated: boolean;
  reason?:
    | 'no_store'
    | 'invalid_store'
    | 'not_enough_accounts'
    | 'no_candidate';
  totalAccounts?: number;
}

function getQwenDirPath(): string {
  return path.join(os.homedir(), QWEN_DIR);
}

function getPrimaryCredentialPath(): string {
  return path.join(getQwenDirPath(), QWEN_CREDENTIAL_FILENAME);
}

function getQwenAccountsPath(): string {
  return path.join(getQwenDirPath(), QWEN_ACCOUNTS_FILENAME);
}

function getAccountId(credentials: QwenCredentials): string | null {
  const id = credentials.refresh_token || credentials.access_token;
  return id && id.trim().length > 0 ? id : null;
}

function isValidStore(data: unknown): data is QwenAccountStore {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const parsed = data as Partial<QwenAccountStore>;
  return (
    parsed.version === 1 &&
    typeof parsed.nextIndex === 'number' &&
    Array.isArray(parsed.accounts)
  );
}

function createDefaultStore(): QwenAccountStore {
  return {
    version: 1,
    nextIndex: 0,
    accounts: [],
  };
}

async function readStore(): Promise<QwenAccountStore | null> {
  try {
    const content = await fs.readFile(getQwenAccountsPath(), 'utf-8');
    const parsed = JSON.parse(content);
    if (!isValidStore(parsed)) {
      return null;
    }
    return parsed;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function writeStore(store: QwenAccountStore): Promise<void> {
  await fs.mkdir(getQwenDirPath(), { recursive: true, mode: 0o700 });
  await fs.writeFile(getQwenAccountsPath(), JSON.stringify(store, null, 2), {
    mode: 0o600,
  });
}

async function readPrimaryCredentials(): Promise<QwenCredentials | null> {
  try {
    const content = await fs.readFile(getPrimaryCredentialPath(), 'utf-8');
    return JSON.parse(content) as QwenCredentials;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function writePrimaryCredentials(
  credentials: QwenCredentials,
): Promise<void> {
  await fs.mkdir(getQwenDirPath(), { recursive: true, mode: 0o700 });
  await fs.writeFile(
    getPrimaryCredentialPath(),
    JSON.stringify(credentials, null, 2),
    { mode: 0o600 },
  );
}

function findCurrentAccountIndex(
  store: QwenAccountStore,
  activeId: string | undefined,
): number {
  if (!activeId) {
    return -1;
  }
  return store.accounts.findIndex((account) => account.id === activeId);
}

function canUseAccount(account: StoredQwenAccount, now: number): boolean {
  if (!account.credentials.refresh_token && !account.credentials.access_token) {
    return false;
  }
  if (!account.quotaExhaustedAt) {
    return true;
  }
  return now - account.quotaExhaustedAt >= DAY_IN_MS;
}

/**
 * Persist or update a Qwen OAuth account in the local account pool.
 * The most recently authenticated account becomes the active one.
 */
export async function recordQwenOAuthAccount(
  credentials: QwenCredentials,
): Promise<void> {
  const accountId = getAccountId(credentials);
  if (!accountId) {
    return;
  }

  const now = Date.now();
  const store = (await readStore()) ?? createDefaultStore();
  const index = store.accounts.findIndex((account) => account.id === accountId);

  if (index >= 0) {
    store.accounts[index] = {
      ...store.accounts[index],
      updatedAt: now,
      lastUsedAt: now,
      quotaExhaustedAt: undefined,
      credentials,
    };
    store.nextIndex = index;
  } else {
    store.accounts.push({
      id: accountId,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
      credentials,
    });
    store.nextIndex = store.accounts.length - 1;
  }

  store.activeAccountId = accountId;
  await writeStore(store);
}

/**
 * Rotate to the next available account in round-robin order.
 * Returns rotated=false when there is no usable backup account.
 */
export async function rotateToNextAvailableQwenOAuthAccount(): Promise<RotateQwenAccountResult> {
  const store = await readStore();
  if (!store) {
    return { rotated: false, reason: 'no_store', totalAccounts: 0 };
  }
  if (store.accounts.length < 2) {
    return {
      rotated: false,
      reason: 'not_enough_accounts',
      totalAccounts: store.accounts.length,
    };
  }

  const currentPrimary = await readPrimaryCredentials();
  const currentId =
    getAccountId(currentPrimary ?? {}) ?? store.activeAccountId ?? undefined;
  const currentIndex = findCurrentAccountIndex(store, currentId);
  const now = Date.now();

  if (currentIndex >= 0) {
    store.accounts[currentIndex] = {
      ...store.accounts[currentIndex],
      quotaExhaustedAt: now,
      updatedAt: now,
    };
  }

  const length = store.accounts.length;
  const startIndex = currentIndex >= 0 ? (currentIndex + 1) % length : 0;
  let selectedIndex = -1;

  for (let i = 0; i < length; i++) {
    const candidateIndex = (startIndex + i) % length;
    if (candidateIndex === currentIndex) {
      continue;
    }
    if (canUseAccount(store.accounts[candidateIndex], now)) {
      selectedIndex = candidateIndex;
      break;
    }
  }

  if (selectedIndex < 0) {
    await writeStore(store);
    return {
      rotated: false,
      reason: 'no_candidate',
      totalAccounts: store.accounts.length,
    };
  }

  const selected = store.accounts[selectedIndex];
  store.activeAccountId = selected.id;
  store.nextIndex = selectedIndex;
  store.accounts[selectedIndex] = {
    ...selected,
    updatedAt: now,
    lastUsedAt: now,
  };

  await writeStore(store);
  await writePrimaryCredentials(selected.credentials);

  return { rotated: true, totalAccounts: store.accounts.length };
}
