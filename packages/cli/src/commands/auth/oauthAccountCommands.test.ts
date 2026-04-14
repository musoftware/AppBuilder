/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthType } from '@qwen-code/qwen-code-core';
import { handleQwenAuth } from './handler.js';
import type { LoadedSettings } from '../../config/settings.js';

const oauthMocks = vi.hoisted(() => ({
  listQwenOAuthAccounts: vi.fn(),
  getActiveQwenOAuthAccountId: vi.fn(),
  setActiveQwenOAuthAccount: vi.fn(),
  removeQwenOAuthAccount: vi.fn(),
}));

vi.mock('@qwen-code/qwen-code-core', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@qwen-code/qwen-code-core')>();
  return {
    ...actual,
    listQwenOAuthAccounts: oauthMocks.listQwenOAuthAccounts,
    getActiveQwenOAuthAccountId: oauthMocks.getActiveQwenOAuthAccountId,
    setActiveQwenOAuthAccount: oauthMocks.setActiveQwenOAuthAccount,
    removeQwenOAuthAccount: oauthMocks.removeQwenOAuthAccount,
  };
});

vi.mock('../../config/settings.js', () => ({
  loadSettings: vi.fn(),
}));

vi.mock('../../config/modelProvidersScope.js', () => ({
  getPersistScopeForModelSelection: vi.fn(() => 'user'),
}));

vi.mock('../../utils/settingsUtils.js', () => ({
  backupSettingsFile: vi.fn(),
}));

vi.mock('../../utils/stdioHelpers.js', () => ({
  writeStdoutLine: vi.fn(),
  writeStderrLine: vi.fn(),
}));

import { loadSettings } from '../../config/settings.js';
import { writeStdoutLine, writeStderrLine } from '../../utils/stdioHelpers.js';

function createLoadedSettings(): LoadedSettings {
  return {
    merged: {},
    system: { settings: {}, path: '/system.json' },
    systemDefaults: { settings: {}, path: '/system-defaults.json' },
    user: { settings: {}, path: '/user.json' },
    workspace: { settings: {}, path: '/workspace.json' },
    forScope: vi.fn(() => ({ path: '/user.json' })),
    setValue: vi.fn(),
    isTrusted: true,
  } as unknown as LoadedSettings;
}

describe('handleQwenAuth oauth-account (multi-login)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    oauthMocks.listQwenOAuthAccounts.mockReset();
    oauthMocks.getActiveQwenOAuthAccountId.mockReset();
    oauthMocks.setActiveQwenOAuthAccount.mockReset();
    oauthMocks.removeQwenOAuthAccount.mockReset();
    vi.mocked(loadSettings).mockReturnValue(createLoadedSettings());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists accounts and marks active id', async () => {
    oauthMocks.listQwenOAuthAccounts.mockResolvedValue([
      {
        id: 'acct-1',
        label: 'Primary',
        credentials: { access_token: 'very-long-access-token-value' },
        lastLoginAt: 1,
      },
    ]);
    oauthMocks.getActiveQwenOAuthAccountId.mockResolvedValue('acct-1');

    await handleQwenAuth('oauth-account', { op: 'list' });

    expect(oauthMocks.listQwenOAuthAccounts).toHaveBeenCalledOnce();
    expect(oauthMocks.getActiveQwenOAuthAccountId).toHaveBeenCalledOnce();
    expect(writeStdoutLine).toHaveBeenCalledWith(
      expect.stringContaining('acct-1'),
    );
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('use sets active account and persists QWEN_OAUTH selection', async () => {
    const settings = createLoadedSettings();
    vi.mocked(loadSettings).mockReturnValue(settings);
    oauthMocks.setActiveQwenOAuthAccount.mockResolvedValue(true);

    await handleQwenAuth('oauth-account', { op: 'use', id: 'acct-2' });

    expect(oauthMocks.setActiveQwenOAuthAccount).toHaveBeenCalledWith('acct-2');
    expect(settings.setValue).toHaveBeenCalledWith(
      'user',
      'security.auth.selectedType',
      AuthType.QWEN_OAUTH,
    );
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('use fails when account id is unknown', async () => {
    oauthMocks.setActiveQwenOAuthAccount.mockResolvedValue(false);

    await handleQwenAuth('oauth-account', { op: 'use', id: 'missing' });

    expect(writeStderrLine).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('remove clears auth selection when no accounts remain', async () => {
    const settings = createLoadedSettings();
    vi.mocked(loadSettings).mockReturnValue(settings);
    oauthMocks.removeQwenOAuthAccount.mockResolvedValue(true);
    oauthMocks.listQwenOAuthAccounts.mockResolvedValue([]);

    await handleQwenAuth('oauth-account', { op: 'remove', id: 'acct-x' });

    expect(oauthMocks.removeQwenOAuthAccount).toHaveBeenCalledWith('acct-x');
    expect(settings.setValue).toHaveBeenCalledWith(
      'user',
      'security.auth.selectedType',
      undefined,
    );
    expect(process.exit).toHaveBeenCalledWith(0);
  });
});
