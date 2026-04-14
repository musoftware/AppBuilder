/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthType } from '@qwen-code/qwen-code-core';
import { handleQwenAuth } from './handler.js';
import type { LoadedSettings } from '../../config/settings.js';

const codexMocks = vi.hoisted(() => ({
  loadCodexOpenAiAccountStore: vi.fn(),
  getActiveCodexOpenAiAccountId: vi.fn(),
  setActiveCodexOpenAiAccount: vi.fn(),
  removeCodexOpenAiAccount: vi.fn(),
  decodeCodexJwtEmail: vi.fn(),
}));

vi.mock('@qwen-code/qwen-code-core', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@qwen-code/qwen-code-core')>();
  return {
    ...actual,
    loadCodexOpenAiAccountStore: codexMocks.loadCodexOpenAiAccountStore,
    getActiveCodexOpenAiAccountId: codexMocks.getActiveCodexOpenAiAccountId,
    setActiveCodexOpenAiAccount: codexMocks.setActiveCodexOpenAiAccount,
    removeCodexOpenAiAccount: codexMocks.removeCodexOpenAiAccount,
    decodeCodexJwtEmail: codexMocks.decodeCodexJwtEmail,
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

describe('handleQwenAuth codex-account (ChatGPT / OpenAI Codex multi-login)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    codexMocks.loadCodexOpenAiAccountStore.mockReset();
    codexMocks.getActiveCodexOpenAiAccountId.mockReset();
    codexMocks.setActiveCodexOpenAiAccount.mockReset();
    codexMocks.removeCodexOpenAiAccount.mockReset();
    codexMocks.decodeCodexJwtEmail.mockReset();
    vi.mocked(loadSettings).mockReturnValue(createLoadedSettings());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists accounts and marks active id', async () => {
    codexMocks.loadCodexOpenAiAccountStore.mockResolvedValue({
      version: 1,
      activeAccountId: 'acct-1',
      accounts: [
        {
          id: 'acct-1',
          credentials: {
            id_token: 'jwt-1',
            access_token: 'very-long-access-token-value',
            refresh_token: 'r1',
          },
          lastLoginAt: 1,
        },
      ],
    });
    codexMocks.getActiveCodexOpenAiAccountId.mockResolvedValue('acct-1');
    codexMocks.decodeCodexJwtEmail.mockReturnValue('user@example.com');

    await handleQwenAuth('codex-account', { op: 'list' });

    expect(codexMocks.loadCodexOpenAiAccountStore).toHaveBeenCalledOnce();
    expect(codexMocks.getActiveCodexOpenAiAccountId).toHaveBeenCalledOnce();
    expect(writeStdoutLine).toHaveBeenCalledWith(
      expect.stringContaining('acct-1'),
    );
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('use sets active account and persists OPENAI_CODEX selection', async () => {
    const settings = createLoadedSettings();
    vi.mocked(loadSettings).mockReturnValue(settings);
    codexMocks.setActiveCodexOpenAiAccount.mockResolvedValue(true);

    await handleQwenAuth('codex-account', { op: 'use', id: 'acct-2' });

    expect(codexMocks.setActiveCodexOpenAiAccount).toHaveBeenCalledWith(
      'acct-2',
    );
    expect(settings.setValue).toHaveBeenCalledWith(
      'user',
      'security.auth.selectedType',
      AuthType.OPENAI_CODEX,
    );
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('use fails when account id is unknown', async () => {
    codexMocks.setActiveCodexOpenAiAccount.mockResolvedValue(false);

    await handleQwenAuth('codex-account', { op: 'use', id: 'missing' });

    expect(writeStderrLine).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('remove clears auth selection when no accounts remain', async () => {
    const settings = createLoadedSettings();
    vi.mocked(loadSettings).mockReturnValue(settings);
    codexMocks.removeCodexOpenAiAccount.mockResolvedValue(true);
    codexMocks.loadCodexOpenAiAccountStore.mockResolvedValue({
      version: 1,
      accounts: [],
    });

    await handleQwenAuth('codex-account', { op: 'remove', id: 'acct-x' });

    expect(codexMocks.removeCodexOpenAiAccount).toHaveBeenCalledWith('acct-x');
    expect(settings.setValue).toHaveBeenCalledWith(
      'user',
      'security.auth.selectedType',
      undefined,
    );
    expect(process.exit).toHaveBeenCalledWith(0);
  });
});
