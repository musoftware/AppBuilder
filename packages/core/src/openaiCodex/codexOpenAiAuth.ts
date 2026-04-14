/**
 * ChatGPT device login compatible with the OpenAI Codex CLI (auth.openai.com).
 * Multi-account store mirrors Qwen OAuth (`oauth_accounts.json`) so users can
 * sign in with several ChatGPT sessions and switch from `/model`.
 *
 * Protocol reference: openai/codex `codex-rs/login` (device_code_auth.rs, server.rs).
 *
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import * as fsSync from 'node:fs';
import * as os from 'node:os';

import open from 'open';
import { Mutex } from 'async-mutex';

import type { Config } from '../config/config.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('OPENAI_CODEX');

const QWEN_DIR = '.qwen';
export const CODEX_OPENAI_CREDENTIAL_FILENAME = 'codex_openai_auth.json';
export const CODEX_OPENAI_ACCOUNTS_FILENAME = 'codex_openai_accounts.json';

/** Public OAuth client id used by the official Codex CLI. */
export const CODEX_OPENAI_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';

export const CODEX_OPENAI_ISSUER_DEFAULT = 'https://auth.openai.com';
const REFRESH_TOKEN_URL = 'https://auth.openai.com/oauth/token';

export interface CodexOpenAiCredentials {
  id_token: string;
  access_token: string;
  refresh_token: string;
  /** Optional token-exchange result (openai-api-key), when the server returns it. */
  exchanged_api_key?: string;
}

export interface CodexOpenAiAccountRecord {
  id: string;
  label?: string;
  credentials: CodexOpenAiCredentials;
  lastLoginAt: number;
}

export interface CodexOpenAiAccountStore {
  version: 1;
  activeAccountId?: string;
  accounts: CodexOpenAiAccountRecord[];
}

interface UserCodeResponse {
  device_auth_id: string;
  user_code: string;
  interval: string | number;
}

interface PollSuccessResponse {
  authorization_code: string;
  code_challenge: string;
  code_verifier: string;
}

interface OAuthTokenResponse {
  id_token: string;
  access_token: string;
  refresh_token: string;
}

interface RefreshTokenResponse {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
}

export function getCodexOpenAiCredentialPath(): string {
  return path.join(os.homedir(), QWEN_DIR, CODEX_OPENAI_CREDENTIAL_FILENAME);
}

export function getCodexOpenAiAccountsPath(): string {
  return path.join(os.homedir(), QWEN_DIR, CODEX_OPENAI_ACCOUNTS_FILENAME);
}

export function decodeCodexJwtEmail(jwt: string): string | undefined {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2 || !parts[1]) {
      return undefined;
    }
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as { email?: string };
    return typeof payload.email === 'string' ? payload.email : undefined;
  } catch {
    return undefined;
  }
}

export async function mirrorPrimaryCredentialFile(
  creds: CodexOpenAiCredentials,
): Promise<void> {
  const dir = path.dirname(getCodexOpenAiCredentialPath());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    getCodexOpenAiCredentialPath(),
    JSON.stringify(creds, null, 2),
    { mode: 0o600 },
  );
}

function normalizeAccountStore(raw: unknown): CodexOpenAiAccountStore {
  if (!raw || typeof raw !== 'object') {
    return { version: 1, accounts: [] };
  }
  const c = raw as Partial<CodexOpenAiAccountStore>;
  const accounts = Array.isArray(c.accounts)
    ? c.accounts
        .filter((a) => a && typeof a === 'object')
        .map((a) => {
          const r = a as Partial<CodexOpenAiAccountRecord>;
          const creds = r.credentials as CodexOpenAiCredentials | undefined;
          if (
            !creds?.id_token ||
            !creds?.access_token ||
            !creds?.refresh_token
          ) {
            return null;
          }
          return {
            id: typeof r.id === 'string' ? r.id : `acct-${randomUUID()}`,
            label: typeof r.label === 'string' ? r.label : undefined,
            credentials: creds,
            lastLoginAt:
              typeof r.lastLoginAt === 'number' ? r.lastLoginAt : Date.now(),
          };
        })
        .filter((x): x is CodexOpenAiAccountRecord => x !== null)
    : [];
  const activeAccountId =
    typeof c.activeAccountId === 'string' ? c.activeAccountId : undefined;
  return { version: 1, activeAccountId, accounts };
}

async function readLegacyPrimaryCredentials(): Promise<CodexOpenAiCredentials | null> {
  try {
    const raw = await fs.readFile(getCodexOpenAiCredentialPath(), 'utf8');
    const parsed = JSON.parse(raw) as CodexOpenAiCredentials;
    if (
      parsed?.id_token &&
      parsed?.access_token &&
      parsed?.refresh_token &&
      typeof parsed.id_token === 'string' &&
      typeof parsed.access_token === 'string' &&
      typeof parsed.refresh_token === 'string'
    ) {
      return parsed;
    }
    return null;
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return null;
    }
    debugLogger.warn('Failed to read legacy Codex credential file:', err);
    return null;
  }
}

export async function loadCodexOpenAiAccountStore(): Promise<CodexOpenAiAccountStore> {
  const p = getCodexOpenAiAccountsPath();
  try {
    const raw = await fs.readFile(p, 'utf8');
    return normalizeAccountStore(JSON.parse(raw));
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      const legacy = await readLegacyPrimaryCredentials();
      if (legacy) {
        const id = `acct-${randomUUID()}`;
        const email = decodeCodexJwtEmail(legacy.id_token);
        const store: CodexOpenAiAccountStore = {
          version: 1,
          activeAccountId: id,
          accounts: [
            {
              id,
              label: email,
              credentials: legacy,
              lastLoginAt: Date.now(),
            },
          ],
        };
        await saveCodexOpenAiAccountStore(store);
        await mirrorPrimaryCredentialFile(legacy);
        return store;
      }
      return { version: 1, accounts: [] };
    }
    debugLogger.warn('Failed to read Codex account store:', err);
    return { version: 1, accounts: [] };
  }
}

export async function saveCodexOpenAiAccountStore(
  store: CodexOpenAiAccountStore,
): Promise<void> {
  const p = getCodexOpenAiAccountsPath();
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(store, null, 2), { mode: 0o600 });
}

export async function upsertCodexOpenAiAccount(
  credentials: CodexOpenAiCredentials,
  label?: string,
): Promise<string> {
  const store = await loadCodexOpenAiAccountStore();
  let matchedIndex = -1;
  if (credentials.refresh_token) {
    matchedIndex = store.accounts.findIndex(
      (a) => a.credentials.refresh_token === credentials.refresh_token,
    );
  }
  if (matchedIndex < 0 && credentials.access_token) {
    matchedIndex = store.accounts.findIndex(
      (a) => a.credentials.access_token === credentials.access_token,
    );
  }
  const accountId =
    matchedIndex >= 0
      ? store.accounts[matchedIndex].id
      : `acct-${randomUUID()}`;
  const email = decodeCodexJwtEmail(credentials.id_token);
  const next: CodexOpenAiAccountRecord = {
    id: accountId,
    label: label ?? store.accounts[matchedIndex]?.label ?? email,
    credentials,
    lastLoginAt: Date.now(),
  };
  if (matchedIndex >= 0) {
    store.accounts[matchedIndex] = next;
  } else {
    store.accounts.push(next);
  }
  store.activeAccountId = accountId;
  await saveCodexOpenAiAccountStore(store);
  await mirrorPrimaryCredentialFile(credentials);
  return accountId;
}

export type CodexOpenAiAccountSummary = {
  id: string;
  label?: string;
  email?: string;
};

export async function listCodexOpenAiAccounts(): Promise<
  CodexOpenAiAccountSummary[]
> {
  const store = await loadCodexOpenAiAccountStore();
  return store.accounts.map((a) => ({
    id: a.id,
    label: a.label,
    email: decodeCodexJwtEmail(a.credentials.id_token),
  }));
}

export async function getActiveCodexOpenAiAccountId(): Promise<
  string | undefined
> {
  const store = await loadCodexOpenAiAccountStore();
  return store.activeAccountId;
}

export async function setActiveCodexOpenAiAccount(
  id: string,
): Promise<boolean> {
  const store = await loadCodexOpenAiAccountStore();
  const found = store.accounts.find((a) => a.id === id);
  if (!found) {
    return false;
  }
  store.activeAccountId = id;
  await saveCodexOpenAiAccountStore(store);
  await mirrorPrimaryCredentialFile(found.credentials);
  return true;
}

export async function removeCodexOpenAiAccount(id: string): Promise<boolean> {
  const store = await loadCodexOpenAiAccountStore();
  const idx = store.accounts.findIndex((a) => a.id === id);
  if (idx < 0) {
    return false;
  }
  store.accounts.splice(idx, 1);
  if (store.activeAccountId === id) {
    store.activeAccountId = store.accounts[0]?.id;
  }
  await saveCodexOpenAiAccountStore(store);
  if (store.accounts.length === 0) {
    await clearCodexOpenAiCredentials();
    return true;
  }
  const active = store.accounts.find((a) => a.id === store.activeAccountId);
  if (active) {
    await mirrorPrimaryCredentialFile(active.credentials);
  }
  return true;
}

export function hasCodexOpenAiPersistedSessionSync(): boolean {
  const accountsPath = getCodexOpenAiAccountsPath();
  try {
    if (fsSync.existsSync(accountsPath)) {
      const raw = fsSync.readFileSync(accountsPath, 'utf8');
      const s = normalizeAccountStore(JSON.parse(raw));
      if (s.accounts.length > 0) {
        return true;
      }
    }
  } catch {
    // ignore
  }
  return fsSync.existsSync(getCodexOpenAiCredentialPath());
}

export async function loadCodexOpenAiCredentials(): Promise<CodexOpenAiCredentials | null> {
  const store = await loadCodexOpenAiAccountStore();
  if (store.accounts.length > 0) {
    const activeId = store.activeAccountId ?? store.accounts[0]?.id;
    const active = store.accounts.find((a) => a.id === activeId);
    if (active) {
      return active.credentials;
    }
  }
  return readLegacyPrimaryCredentials();
}

export async function saveCodexOpenAiCredentials(
  creds: CodexOpenAiCredentials,
): Promise<void> {
  const store = await loadCodexOpenAiAccountStore();
  if (store.accounts.length === 0) {
    await upsertCodexOpenAiAccount(creds);
    return;
  }
  const activeId = store.activeAccountId ?? store.accounts[0]?.id;
  if (activeId && store.accounts.length > 0) {
    const idx = store.accounts.findIndex((a) => a.id === activeId);
    if (idx >= 0) {
      store.accounts[idx] = {
        ...store.accounts[idx],
        credentials: creds,
        lastLoginAt: Date.now(),
      };
      await saveCodexOpenAiAccountStore(store);
      await mirrorPrimaryCredentialFile(creds);
      return;
    }
  }
  await mirrorPrimaryCredentialFile(creds);
}

export async function clearCodexOpenAiCredentials(): Promise<void> {
  await Promise.all([
    fs
      .unlink(getCodexOpenAiAccountsPath())
      .catch((e: NodeJS.ErrnoException) => {
        if (e.code !== 'ENOENT') {
          debugLogger.warn('Failed to remove Codex accounts file:', e);
        }
      }),
    fs
      .unlink(getCodexOpenAiCredentialPath())
      .catch((e: NodeJS.ErrnoException) => {
        if (e.code !== 'ENOENT') {
          debugLogger.warn(
            'Failed to remove Codex primary credential file:',
            e,
          );
        }
      }),
  ]);
}

function normalizeInterval(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(1, Math.floor(raw));
  }
  if (typeof raw === 'string') {
    const n = parseInt(raw.trim(), 10);
    return Number.isFinite(n) && n > 0 ? n : 5;
  }
  return 5;
}

function decodeJwtExp(jwt: string): number | undefined {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2 || !parts[1]) {
      return undefined;
    }
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : undefined;
  } catch {
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function postJson<T>(
  url: string,
  body: unknown,
): Promise<{ ok: boolean; status: number; json: T | null; text: string }> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  let json: T | null = null;
  try {
    json = text ? (JSON.parse(text) as T) : null;
  } catch {
    json = null;
  }
  return { ok: resp.ok, status: resp.status, json, text };
}

async function postForm<T>(
  url: string,
  body: URLSearchParams,
): Promise<{ ok: boolean; status: number; json: T | null; text: string }> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await resp.text();
  let json: T | null = null;
  try {
    json = text ? (JSON.parse(text) as T) : null;
  } catch {
    json = null;
  }
  return { ok: resp.ok, status: resp.status, json, text };
}

export async function exchangeAuthorizationCode(
  issuer: string,
  redirectUri: string,
  code: string,
  codeVerifier: string,
): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: CODEX_OPENAI_CLIENT_ID,
    code_verifier: codeVerifier,
  });
  const url = `${issuer.replace(/\/$/, '')}/oauth/token`;
  const { ok, status, json, text } = await postForm<OAuthTokenResponse>(
    url,
    body,
  );
  if (!ok || !json) {
    throw new Error(
      `OpenAI token exchange failed (${status}): ${text.slice(0, 500)}`,
    );
  }
  return json;
}

export async function obtainExchangedApiKey(
  issuer: string,
  idToken: string,
): Promise<string | undefined> {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
    client_id: CODEX_OPENAI_CLIENT_ID,
    requested_token: 'openai-api-key',
    subject_token: idToken,
    subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
  });
  const url = `${issuer.replace(/\/$/, '')}/oauth/token`;
  const { ok, json } = await postForm<{ access_token?: string }>(url, body);
  if (!ok || !json?.access_token) {
    return undefined;
  }
  return json.access_token;
}

export async function refreshCodexOpenAiSession(
  creds: CodexOpenAiCredentials,
): Promise<CodexOpenAiCredentials> {
  const { ok, status, json, text } = await postJson<RefreshTokenResponse>(
    REFRESH_TOKEN_URL,
    {
      client_id: CODEX_OPENAI_CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: creds.refresh_token,
    },
  );
  if (!ok) {
    throw new Error(`OpenAI refresh failed (${status}): ${text.slice(0, 500)}`);
  }
  if (!json) {
    throw new Error('OpenAI refresh returned an empty body.');
  }
  const next: CodexOpenAiCredentials = {
    id_token: json.id_token ?? creds.id_token,
    access_token: json.access_token ?? creds.access_token,
    refresh_token: json.refresh_token ?? creds.refresh_token,
    exchanged_api_key: creds.exchanged_api_key,
  };
  const exchanged = await obtainExchangedApiKey(
    CODEX_OPENAI_ISSUER_DEFAULT,
    next.id_token,
  );
  if (exchanged) {
    next.exchanged_api_key = exchanged;
  }
  await saveCodexOpenAiCredentials(next);
  return next;
}

async function pollDeviceAuthorization(
  issuer: string,
  deviceAuthId: string,
  userCode: string,
  intervalSec: number,
): Promise<PollSuccessResponse> {
  const apiBase = `${issuer.replace(/\/$/, '')}/api/accounts`;
  const url = `${apiBase}/deviceauth/token`;
  const maxWaitMs = 15 * 60 * 1000;
  const started = Date.now();

  for (;;) {
    const { ok, status, json, text } = await postJson<
      PollSuccessResponse | { error?: string }
    >(url, { device_auth_id: deviceAuthId, user_code: userCode });
    if (ok && json && 'authorization_code' in json) {
      return json as PollSuccessResponse;
    }
    if (status === 403 || status === 404) {
      if (Date.now() - started >= maxWaitMs) {
        throw new Error('Device authorization timed out after 15 minutes.');
      }
      const sleepMs = Math.min(
        intervalSec * 1000,
        maxWaitMs - (Date.now() - started),
      );
      await sleep(Math.max(1000, sleepMs));
      continue;
    }
    throw new Error(
      `Device token poll failed (${status}): ${text.slice(0, 500)}`,
    );
  }
}

/**
 * Run the same device-code sign-in flow as `codex login` (ChatGPT).
 */
export async function runCodexOpenAiDeviceCodeLogin(options?: {
  openBrowser?: boolean;
  onStatus?: (line: string) => void;
}): Promise<CodexOpenAiCredentials> {
  const issuer = CODEX_OPENAI_ISSUER_DEFAULT.replace(/\/$/, '');
  const apiBase = `${issuer}/api/accounts`;
  const openBrowser = options?.openBrowser !== false;
  const say = options?.onStatus ?? ((s: string) => debugLogger.info(s));

  const uc = await postJson<UserCodeResponse>(
    `${apiBase}/deviceauth/usercode`,
    {
      client_id: CODEX_OPENAI_CLIENT_ID,
    },
  );
  if (!uc.ok || !uc.json) {
    if (uc.status === 404) {
      throw new Error(
        'Device code login is not enabled for this auth server. Check network or try again later.',
      );
    }
    throw new Error(
      `Device code request failed (${uc.status}): ${uc.text.slice(0, 500)}`,
    );
  }

  const { device_auth_id, user_code } = uc.json;
  const interval = normalizeInterval(uc.json.interval);
  const verificationUrl = `${issuer}/codex/device`;

  say('');
  say('Sign in with ChatGPT (OpenAI Codex device flow)');
  say('');
  say(`1) Open in your browser: ${verificationUrl}`);
  say(`2) Enter this one-time code (expires in 15 minutes): ${user_code}`);
  say('');
  say('Never share this code; it grants access to your account.');
  say('');

  if (openBrowser) {
    await open(verificationUrl).catch(() => {
      say('(Could not open the browser automatically — use the URL above.)');
    });
  }

  const poll = await pollDeviceAuthorization(
    issuer,
    device_auth_id,
    user_code,
    interval,
  );

  const redirectUri = `${issuer}/deviceauth/callback`;
  const tokens = await exchangeAuthorizationCode(
    issuer,
    redirectUri,
    poll.authorization_code,
    poll.code_verifier,
  );

  const exchanged = await obtainExchangedApiKey(issuer, tokens.id_token);

  const creds: CodexOpenAiCredentials = {
    id_token: tokens.id_token,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    ...(exchanged ? { exchanged_api_key: exchanged } : {}),
  };
  await upsertCodexOpenAiAccount(creds);
  return creds;
}

const refreshMutex = new Mutex();

export class CodexOpenAiAuthClient {
  private credentials: CodexOpenAiCredentials | null = null;

  setCredentials(creds: CodexOpenAiCredentials): void {
    this.credentials = creds;
  }

  getCredentials(): CodexOpenAiCredentials | null {
    return this.credentials;
  }

  /**
   * Returns a bearer token suitable for `Authorization: Bearer` against api.openai.com.
   * Prefers the exchanged API-style token when present (Codex CLI persists this when available).
   */
  async getBearerToken(): Promise<string> {
    const creds = await this.ensureFreshCredentials();
    return creds.exchanged_api_key ?? creds.access_token;
  }

  private async ensureFreshCredentials(): Promise<CodexOpenAiCredentials> {
    if (!this.credentials) {
      const fromDisk = await loadCodexOpenAiCredentials();
      if (!fromDisk) {
        throw new Error(
          'No ChatGPT (Codex) credentials on disk. Run `qwen auth codex-openai` to sign in.',
        );
      }
      this.credentials = fromDisk;
    }

    const exp = decodeJwtExp(this.credentials.access_token);
    const now = Math.floor(Date.now() / 1000);
    const skew = 120;
    if (exp !== undefined && exp > now + skew) {
      return this.credentials;
    }

    return refreshMutex.runExclusive(async () => {
      const latest = this.credentials ?? (await loadCodexOpenAiCredentials());
      if (!latest) {
        throw new Error(
          'ChatGPT (Codex) credentials missing after refresh lock.',
        );
      }
      const exp2 = decodeJwtExp(latest.access_token);
      if (exp2 !== undefined && exp2 > Math.floor(Date.now() / 1000) + skew) {
        this.credentials = latest;
        return latest;
      }
      const refreshed = await refreshCodexOpenAiSession(latest);
      this.credentials = refreshed;
      return refreshed;
    });
  }
}

export async function getCodexOpenAiAuthClient(
  _config: Config,
  options?: { requireCachedCredentials?: boolean },
): Promise<CodexOpenAiAuthClient> {
  const client = new CodexOpenAiAuthClient();
  const existing = await loadCodexOpenAiCredentials();
  if (!existing) {
    if (options?.requireCachedCredentials) {
      throw new Error(
        'No cached ChatGPT (Codex) credentials. Run `qwen auth codex-openai` to sign in.',
      );
    }
    return client;
  }
  client.setCredentials(existing);
  return client;
}
