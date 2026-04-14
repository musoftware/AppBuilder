/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  CodexOpenAiAuthClient,
  decodeCodexJwtEmail,
  enrichCodexCredentialsChatgptAccount,
  extractChatgptAccountIdFromJwt,
} from './codexOpenAiAuth.js';

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none' }), 'utf8').toString(
    'base64url',
  );
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url',
  );
  return `${header}.${body}.signature`;
}

describe('decodeCodexJwtEmail', () => {
  it('returns email from a valid id_token payload', () => {
    const jwt = makeJwt({ email: 'user@example.com', sub: 'abc' });
    expect(decodeCodexJwtEmail(jwt)).toBe('user@example.com');
  });

  it('returns undefined when payload has no email', () => {
    const jwt = makeJwt({ sub: 'no-email' });
    expect(decodeCodexJwtEmail(jwt)).toBeUndefined();
  });

  it('returns undefined for malformed JWT strings', () => {
    expect(decodeCodexJwtEmail('not-a-jwt')).toBeUndefined();
    expect(decodeCodexJwtEmail('only.one')).toBeUndefined();
    expect(decodeCodexJwtEmail('a.b!!!.c')).toBeUndefined();
  });
});

describe('extractChatgptAccountIdFromJwt', () => {
  it('reads chatgpt_account_id from the OpenAI auth namespace claim', () => {
    const jwt = makeJwt({
      'https://api.openai.com/auth': { chatgpt_account_id: 'acct-xyz' },
      sub: 'user',
    });
    expect(extractChatgptAccountIdFromJwt(jwt)).toBe('acct-xyz');
  });

  it('returns undefined when claim is absent', () => {
    expect(extractChatgptAccountIdFromJwt(makeJwt({ sub: 'only-sub' }))).toBe(
      undefined,
    );
  });
});

describe('enrichCodexCredentialsChatgptAccount', () => {
  it('fills chatgpt_account_id from id_token when missing', () => {
    const idToken = makeJwt({
      'https://api.openai.com/auth': { chatgpt_account_id: 'from-jwt' },
    });
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const c = enrichCodexCredentialsChatgptAccount({
      id_token: idToken,
      access_token: makeJwt({ exp: futureExp, sub: 'sess' }),
      refresh_token: 'r',
    });
    expect(c.chatgpt_account_id).toBe('from-jwt');
  });
});

describe('CodexOpenAiAuthClient.getBearerToken', () => {
  it('uses OAuth access_token even when exchanged_api_key is set', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = makeJwt({ exp: futureExp, sub: 'session' });
    const client = new CodexOpenAiAuthClient();
    client.setCredentials({
      id_token: makeJwt({ sub: 'id' }),
      access_token: accessToken,
      refresh_token: 'refresh-token',
      exchanged_api_key: 'sk-exchange-should-not-win',
    });
    await expect(client.getBearerToken()).resolves.toBe(accessToken);
  });
});
