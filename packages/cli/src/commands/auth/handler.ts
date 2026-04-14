/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomUUID } from 'node:crypto';
import {
  AuthType,
  getErrorMessage,
  type ApiKeyProfile,
  type Config,
  type ProviderModelConfig as ModelConfig,
  clearQwenCredentials,
  clearGoogleVertexOAuthCredentials,
  clearCodexOpenAiCredentials,
  decodeCodexJwtEmail,
  DEFAULT_GEMINI_VERTEX_OAUTH_MODEL,
  DEFAULT_OPENAI_CODEX_MODEL,
  OPENAI_CODEX_MODELS,
  getActiveCodexOpenAiAccountId,
  getActiveQwenOAuthAccountId,
  hasGoogleVertexOAuthCredentials,
  listQwenOAuthAccounts,
  loadCodexOpenAiAccountStore,
  loadCodexOpenAiCredentials,
  performGoogleVertexOAuthLogin,
  removeCodexOpenAiAccount,
  removeQwenOAuthAccount,
  runCodexOpenAiDeviceCodeLogin,
  setActiveCodexOpenAiAccount,
  setActiveQwenOAuthAccount,
} from '@qwen-code/qwen-code-core';
import { writeStdoutLine, writeStderrLine } from '../../utils/stdioHelpers.js';
import { t } from '../../i18n/index.js';
import {
  getCodingPlanConfig,
  isCodingPlanConfig,
  CodingPlanRegion,
  CODING_PLAN_ENV_KEY,
} from '../../constants/codingPlan.js';
import { getPersistScopeForModelSelection } from '../../config/modelProvidersScope.js';
import { backupSettingsFile } from '../../utils/settingsUtils.js';
import { loadSettings, type LoadedSettings } from '../../config/settings.js';
import { loadCliConfig } from '../../config/config.js';
import type { CliArgs } from '../../config/config.js';
import { InteractiveSelector } from './interactiveSelector.js';

interface QwenAuthOptions {
  region?: string;
  key?: string;
  all?: boolean;
}

type ApiKeyProfileCommand =
  | {
      op: 'add';
      id?: string;
      name?: string;
      key?: string;
      baseUrl?: string;
      active?: boolean;
    }
  | { op: 'list' }
  | { op: 'use'; id: string }
  | { op: 'remove'; id: string };

type OAuthAccountCommand =
  | { op: 'list' }
  | { op: 'use'; id: string }
  | { op: 'remove'; id: string };

type CodexAccountCommand = OAuthAccountCommand;

interface CodingPlanSettings {
  region?: CodingPlanRegion;
  version?: string;
}

interface MergedSettingsWithCodingPlan {
  security?: {
    auth?: {
      selectedType?: string;
      apiKey?: string;
      apiProfiles?: {
        activeProfileId?: string;
        profiles: ApiKeyProfile[];
      };
    };
  };
  codingPlan?: CodingPlanSettings;
  model?: {
    name?: string;
  };
  modelProviders?: Record<string, ModelConfig[]>;
  env?: Record<string, string>;
}

/**
 * Handles the authentication process based on the specified command and options
 */
export async function handleGoogleVertexOAuthAuth(
  mode: 'login' | 'clear',
): Promise<void> {
  const settings = loadSettings();
  const scope = getPersistScopeForModelSelection(settings);

  if (mode === 'clear') {
    await clearGoogleVertexOAuthCredentials();
    settings.setValue(scope, 'security.auth.selectedType', undefined);
    writeStdoutLine(
      t('Removed stored Google Vertex OAuth credentials and reset auth type.'),
    );
    return;
  }

  const minimalArgv: CliArgs = {
    query: undefined,
    model: undefined,
    sandbox: undefined,
    sandboxImage: undefined,
    debug: undefined,
    prompt: undefined,
    promptInteractive: undefined,
    yolo: undefined,
    approvalMode: undefined,
    telemetry: undefined,
    checkpointing: undefined,
    telemetryTarget: undefined,
    telemetryOtlpEndpoint: undefined,
    telemetryOtlpProtocol: undefined,
    telemetryLogPrompts: undefined,
    telemetryOutfile: undefined,
    allowedMcpServerNames: undefined,
    allowedTools: undefined,
    acp: undefined,
    experimentalAcp: undefined,
    experimentalLsp: undefined,
    extensions: [],
    listExtensions: undefined,
    openaiLogging: undefined,
    openaiApiKey: undefined,
    openaiBaseUrl: undefined,
    openaiLoggingDir: undefined,
    proxy: undefined,
    includeDirectories: undefined,
    tavilyApiKey: undefined,
    googleApiKey: undefined,
    googleSearchEngineId: undefined,
    webSearchDefault: undefined,
    screenReader: undefined,
    inputFormat: undefined,
    outputFormat: undefined,
    includePartialMessages: undefined,
    chatRecording: undefined,
    continue: undefined,
    resume: undefined,
    sessionId: undefined,
    maxSessionTurns: undefined,
    coreTools: undefined,
    excludeTools: undefined,
    authType: undefined,
    channel: undefined,
    systemPrompt: undefined,
    appendSystemPrompt: undefined,
  };

  const config = await loadCliConfig(
    settings.merged,
    minimalArgv,
    process.cwd(),
    [],
  );

  await performGoogleVertexOAuthLogin(config);

  const settingsFile = settings.forScope(scope);
  backupSettingsFile(settingsFile.path);
  settings.setValue(
    scope,
    'security.auth.selectedType',
    AuthType.GEMINI_VERTEX_OAUTH,
  );
  settings.setValue(scope, 'model.name', DEFAULT_GEMINI_VERTEX_OAUTH_MODEL);
  writeStdoutLine(
    t(
      'Google sign-in complete. Credentials are saved locally; set GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION, then run the CLI.',
    ),
  );
}

export async function handleQwenAuth(
  command:
    | 'qwen-oauth'
    | 'codex-openai'
    | 'coding-plan'
    | 'logout'
    | 'api-key'
    | 'oauth-account'
    | 'codex-account',
  options: QwenAuthOptions | ApiKeyProfileCommand | OAuthAccountCommand,
) {
  try {
    const settings = loadSettings();

    if (command === 'api-key') {
      await handleApiKeyProfiles(settings, options as ApiKeyProfileCommand);
      process.exit(0);
    }

    if (command === 'oauth-account') {
      await handleOAuthAccounts(settings, options as OAuthAccountCommand);
      process.exit(0);
    }

    if (command === 'codex-account') {
      await handleCodexAccounts(settings, options as CodexAccountCommand);
      process.exit(0);
    }

    // Create a minimal argv for config loading
    const minimalArgv: CliArgs = {
      query: undefined,
      model: undefined,
      sandbox: undefined,
      sandboxImage: undefined,
      debug: undefined,
      prompt: undefined,
      promptInteractive: undefined,
      yolo: undefined,
      approvalMode: undefined,
      telemetry: undefined,
      checkpointing: undefined,
      telemetryTarget: undefined,
      telemetryOtlpEndpoint: undefined,
      telemetryOtlpProtocol: undefined,
      telemetryLogPrompts: undefined,
      telemetryOutfile: undefined,
      allowedMcpServerNames: undefined,
      allowedTools: undefined,
      acp: undefined,
      experimentalAcp: undefined,
      experimentalLsp: undefined,
      extensions: [],
      listExtensions: undefined,
      openaiLogging: undefined,
      openaiApiKey: undefined,
      openaiBaseUrl: undefined,
      openaiLoggingDir: undefined,
      proxy: undefined,
      includeDirectories: undefined,
      tavilyApiKey: undefined,
      googleApiKey: undefined,
      googleSearchEngineId: undefined,
      webSearchDefault: undefined,
      screenReader: undefined,
      inputFormat: undefined,
      outputFormat: undefined,
      includePartialMessages: undefined,
      chatRecording: undefined,
      continue: undefined,
      resume: undefined,
      sessionId: undefined,
      maxSessionTurns: undefined,
      coreTools: undefined,
      excludeTools: undefined,
      authType: undefined,
      channel: undefined,
      systemPrompt: undefined,
      appendSystemPrompt: undefined,
    };

    // Create a minimal config to access settings and storage
    const config = await loadCliConfig(
      settings.merged,
      minimalArgv,
      process.cwd(),
      [], // No extensions for auth command
    );

    if (command === 'qwen-oauth') {
      await handleQwenOAuth(config, settings);
    } else if (command === 'codex-openai') {
      await handleCodexOpenAiOAuth(config, settings);
    } else if (command === 'coding-plan') {
      await handleCodePlanAuth(config, settings, options as QwenAuthOptions);
    } else if (command === 'logout') {
      await handleLogout(settings, options as QwenAuthOptions);
      process.exit(0);
    }

    // Exit after authentication is complete
    writeStdoutLine(t('Authentication completed successfully.'));
    process.exit(0);
  } catch (error) {
    writeStderrLine(getErrorMessage(error));
    process.exit(1);
  }
}

async function handleLogout(
  settings: LoadedSettings,
  options: QwenAuthOptions,
): Promise<void> {
  const authTypeScope = getPersistScopeForModelSelection(settings);
  const selected = settings.merged.security?.auth?.selectedType as
    | AuthType
    | undefined;

  if (selected === AuthType.OPENAI_CODEX) {
    await clearCodexOpenAiCredentials();
    settings.setValue(authTypeScope, 'security.auth.selectedType', undefined);
    writeStdoutLine(t('Logged out from OpenAI Codex (ChatGPT OAuth).'));
    return;
  }

  await clearQwenCredentials();
  settings.setValue(authTypeScope, 'security.auth.selectedType', undefined);
  writeStdoutLine(
    options.all
      ? t('Logged out from all Qwen OAuth accounts.')
      : t('Logged out from Qwen OAuth.'),
  );
}

/**
 * Handles Qwen OAuth authentication
 */
async function handleQwenOAuth(
  config: Config,
  settings: LoadedSettings,
): Promise<void> {
  writeStdoutLine(t('Starting Qwen OAuth authentication...'));

  try {
    await config.refreshAuth(AuthType.QWEN_OAUTH);

    // Persist the auth type
    const authTypeScope = getPersistScopeForModelSelection(settings);
    settings.setValue(
      authTypeScope,
      'security.auth.selectedType',
      AuthType.QWEN_OAUTH,
    );

    writeStdoutLine(t('Successfully authenticated with Qwen OAuth.'));
    process.exit(0);
  } catch (error) {
    writeStderrLine(
      t('Failed to authenticate with Qwen OAuth: {{error}}', {
        error: getErrorMessage(error),
      }),
    );
    process.exit(1);
  }
}

/**
 * OpenAI Codex (ChatGPT) device login — compatible with the official Codex CLI auth service.
 */
async function handleCodexOpenAiOAuth(
  config: Config,
  settings: LoadedSettings,
): Promise<void> {
  writeStdoutLine(t('Starting OpenAI Codex (ChatGPT) sign-in...'));

  try {
    const noBrowser = !!process.env['NO_BROWSER'];
    await runCodexOpenAiDeviceCodeLogin({
      openBrowser: !noBrowser,
      onStatus: (line: string) => writeStdoutLine(line),
    });

    const authTypeScope = getPersistScopeForModelSelection(settings);
    const settingsFile = settings.forScope(authTypeScope);
    backupSettingsFile(settingsFile.path);

    settings.setValue(
      authTypeScope,
      'security.auth.selectedType',
      AuthType.OPENAI_CODEX,
    );
    settings.setValue(authTypeScope, 'model.name', DEFAULT_OPENAI_CODEX_MODEL);

    await config.refreshAuth(AuthType.OPENAI_CODEX, true);

    writeStdoutLine(
      t(
        'Successfully signed in with ChatGPT. Accounts: ~/.qwen/codex_openai_accounts.json (active session mirrored to codex_openai_auth.json).',
      ),
    );
    process.exit(0);
  } catch (error) {
    writeStderrLine(
      t('OpenAI Codex sign-in failed: {{error}}', {
        error: getErrorMessage(error),
      }),
    );
    process.exit(1);
  }
}

/**
 * Handles Alibaba Cloud Coding Plan authentication
 */
async function handleCodePlanAuth(
  config: Config,
  settings: LoadedSettings,
  options: QwenAuthOptions,
): Promise<void> {
  const { region, key } = options;

  let selectedRegion: CodingPlanRegion;
  let selectedKey: string;

  // If region and key are provided as options, use them
  if (region && key) {
    selectedRegion =
      region.toLowerCase() === 'global'
        ? CodingPlanRegion.GLOBAL
        : CodingPlanRegion.CHINA;
    selectedKey = key;
  } else {
    // Otherwise, prompt interactively
    selectedRegion = await promptForRegion();
    selectedKey = await promptForKey();
  }

  writeStdoutLine(t('Processing Alibaba Cloud Coding Plan authentication...'));

  try {
    // Get configuration based on region
    const { template, version } = getCodingPlanConfig(selectedRegion);

    // Get persist scope
    const authTypeScope = getPersistScopeForModelSelection(settings);

    // Backup settings file before modification
    const settingsFile = settings.forScope(authTypeScope);
    backupSettingsFile(settingsFile.path);

    // Store api-key in settings.env (unified env key)
    settings.setValue(authTypeScope, `env.${CODING_PLAN_ENV_KEY}`, selectedKey);

    // Sync to process.env immediately so refreshAuth can read the apiKey
    process.env[CODING_PLAN_ENV_KEY] = selectedKey;

    // Generate model configs from template
    const newConfigs = template.map((templateConfig) => ({
      ...templateConfig,
      envKey: CODING_PLAN_ENV_KEY,
    }));

    // Get existing configs
    const existingConfigs =
      (settings.merged.modelProviders as Record<string, ModelConfig[]>)?.[
        AuthType.USE_OPENAI
      ] || [];

    // Filter out all existing Coding Plan configs (mutually exclusive)
    const nonCodingPlanConfigs = existingConfigs.filter(
      (existing) => !isCodingPlanConfig(existing.baseUrl, existing.envKey),
    );

    // Add new Coding Plan configs at the beginning
    const updatedConfigs = [...newConfigs, ...nonCodingPlanConfigs];

    // Persist to modelProviders
    settings.setValue(
      authTypeScope,
      `modelProviders.${AuthType.USE_OPENAI}`,
      updatedConfigs,
    );

    // Also persist authType
    settings.setValue(
      authTypeScope,
      'security.auth.selectedType',
      AuthType.USE_OPENAI,
    );

    // Persist coding plan region
    settings.setValue(authTypeScope, 'codingPlan.region', selectedRegion);

    // Persist coding plan version (single field for backward compatibility)
    settings.setValue(authTypeScope, 'codingPlan.version', version);

    // If there are configs, use the first one as the model
    if (updatedConfigs.length > 0 && updatedConfigs[0]?.id) {
      settings.setValue(
        authTypeScope,
        'model.name',
        (updatedConfigs[0] as ModelConfig).id,
      );
    }

    // Refresh auth with the new configuration
    await config.refreshAuth(AuthType.USE_OPENAI);

    writeStdoutLine(
      t('Successfully authenticated with Alibaba Cloud Coding Plan.'),
    );
  } catch (error) {
    writeStderrLine(
      t('Failed to authenticate with Coding Plan: {{error}}', {
        error: getErrorMessage(error),
      }),
    );
    process.exit(1);
  }
}

/**
 * Prompts the user to select a region using an interactive selector
 */
async function promptForRegion(): Promise<CodingPlanRegion> {
  const selector = new InteractiveSelector(
    [
      {
        value: CodingPlanRegion.CHINA,
        label: t('中国 (China)'),
        description: t('阿里云百炼 (aliyun.com)'),
      },
      {
        value: CodingPlanRegion.GLOBAL,
        label: t('Global'),
        description: t('Alibaba Cloud (alibabacloud.com)'),
      },
    ],
    t('Select region for Coding Plan:'),
  );

  return await selector.select();
}

/**
 * Prompts the user to enter a secret without echoing characters.
 */
async function promptForHiddenSecret(promptText: string): Promise<string> {
  const stdin = process.stdin;
  const stdout = process.stdout;

  stdout.write(promptText);

  const wasRaw = stdin.isRaw;
  if (stdin.setRawMode) {
    stdin.setRawMode(true);
  }
  stdin.resume();

  return new Promise<string>((resolve, reject) => {
    let input = '';

    const onData = (chunk: string) => {
      for (const char of chunk) {
        switch (char) {
          case '\r': // Enter
          case '\n':
            stdin.removeListener('data', onData);
            if (stdin.setRawMode) {
              stdin.setRawMode(wasRaw);
            }
            stdout.write('\n');
            resolve(input);
            return;
          case '\x03': // Ctrl+C
            stdin.removeListener('data', onData);
            if (stdin.setRawMode) {
              stdin.setRawMode(wasRaw);
            }
            stdout.write('^C\n');
            reject(new Error('Interrupted'));
            return;
          case '\x08': // Backspace
          case '\x7F': // Delete
            if (input.length > 0) {
              input = input.slice(0, -1);
              stdout.write('\x1B[D \x1B[D');
            }
            break;
          default:
            input += char;
            stdout.write('*');
            break;
        }
      }
    };

    stdin.on('data', onData);
  });
}

/**
 * Prompts the user to enter an API key
 */
async function promptForKey(): Promise<string> {
  return promptForHiddenSecret(t('Enter your Coding Plan API key: '));
}

function maskStoredApiKey(apiKey: string): string {
  const k = apiKey.trim();
  if (k.length <= 10) {
    return '****';
  }
  return `${k.slice(0, 6)}…${k.slice(-4)}`;
}

function readStoredApiProfiles(merged: MergedSettingsWithCodingPlan): {
  activeProfileId?: string;
  profiles: ApiKeyProfile[];
} {
  const raw = merged.security?.auth?.apiProfiles as
    | { activeProfileId?: string; profiles?: ApiKeyProfile[] }
    | undefined;
  if (!raw || typeof raw !== 'object') {
    return { profiles: [] };
  }
  const profiles = Array.isArray(raw.profiles)
    ? raw.profiles.filter(
        (p): p is ApiKeyProfile =>
          !!p &&
          typeof p === 'object' &&
          typeof (p as ApiKeyProfile).id === 'string' &&
          typeof (p as ApiKeyProfile).apiKey === 'string',
      )
    : [];
  return {
    activeProfileId:
      typeof raw.activeProfileId === 'string' ? raw.activeProfileId : undefined,
    profiles,
  };
}

async function handleApiKeyProfiles(
  settings: LoadedSettings,
  cmd: ApiKeyProfileCommand,
): Promise<void> {
  const scope = getPersistScopeForModelSelection(settings);
  const merged = settings.merged as MergedSettingsWithCodingPlan;

  if (cmd.op === 'list') {
    const { activeProfileId, profiles } = readStoredApiProfiles(merged);
    if (!profiles.length) {
      writeStdoutLine(t('No API key profiles stored.'));
      writeStdoutLine(
        t('Run `qwen auth api-key add` to save an OpenAI-compatible key.'),
      );
      return;
    }
    writeStdoutLine(t('Stored API key profiles:\n'));
    for (const p of profiles) {
      const active =
        p.id === activeProfileId ||
        (!activeProfileId && p.id === profiles[0]?.id);
      const mark = active ? t(' (active)') : '';
      const label = p.name ? `${p.id} — ${p.name}` : p.id;
      writeStdoutLine(
        t('  • {{label}}{{mark}}  key: {{masked}}', {
          label,
          mark,
          masked: maskStoredApiKey(p.apiKey),
        }),
      );
      if (p.baseUrl) {
        writeStdoutLine(t('      base URL: {{url}}', { url: p.baseUrl }));
      }
    }
    writeStdoutLine('');
    return;
  }

  if (cmd.op === 'use') {
    const { profiles } = readStoredApiProfiles(merged);
    const match = profiles.find((p) => p.id === cmd.id);
    if (!match) {
      writeStderrLine(
        t('Unknown profile id "{{id}}". Run `qwen auth api-key list`.', {
          id: cmd.id,
        }),
      );
      process.exit(1);
    }
    const settingsFile = settings.forScope(scope);
    backupSettingsFile(settingsFile.path);
    settings.setValue(scope, 'security.auth.apiProfiles', {
      activeProfileId: cmd.id,
      profiles,
    });
    settings.setValue(scope, 'security.auth.selectedType', AuthType.USE_OPENAI);
    writeStdoutLine(
      t('Active API key profile set to "{{id}}".', { id: cmd.id }),
    );
    return;
  }

  if (cmd.op === 'remove') {
    const { activeProfileId, profiles } = readStoredApiProfiles(merged);
    const next = profiles.filter((p) => p.id !== cmd.id);
    if (next.length === profiles.length) {
      writeStderrLine(
        t('Unknown profile id "{{id}}". Run `qwen auth api-key list`.', {
          id: cmd.id,
        }),
      );
      process.exit(1);
    }
    let nextActive = activeProfileId;
    if (activeProfileId === cmd.id) {
      nextActive = next[0]?.id;
    }
    const settingsFile = settings.forScope(scope);
    backupSettingsFile(settingsFile.path);
    settings.setValue(scope, 'security.auth.apiProfiles', {
      activeProfileId: nextActive,
      profiles: next,
    });
    writeStdoutLine(t('Removed profile "{{id}}".', { id: cmd.id }));
    return;
  }

  // add
  let apiKey = cmd.key?.trim() ?? '';
  if (!apiKey) {
    apiKey = (await promptForHiddenSecret(t('Enter API key: '))).trim();
  }
  if (!apiKey) {
    writeStderrLine(t('API key is required.'));
    process.exit(1);
  }

  const id = (cmd.id?.trim() || randomUUID()) as string;
  const { activeProfileId, profiles } = readStoredApiProfiles(merged);
  if (profiles.some((p) => p.id === id)) {
    writeStderrLine(
      t('Profile id "{{id}}" already exists. Choose another --id.', {
        id,
      }),
    );
    process.exit(1);
  }

  const newProfile: ApiKeyProfile = {
    id,
    ...(cmd.name?.trim() ? { name: cmd.name.trim() } : {}),
    apiKey,
    ...(cmd.baseUrl?.trim() ? { baseUrl: cmd.baseUrl.trim() } : {}),
  };
  const nextProfiles = [...profiles, newProfile];
  const makeActive = !!cmd.active || !profiles.length || !activeProfileId;
  const nextActive = makeActive ? id : activeProfileId;

  const settingsFile = settings.forScope(scope);
  backupSettingsFile(settingsFile.path);
  settings.setValue(scope, 'security.auth.apiProfiles', {
    activeProfileId: nextActive,
    profiles: nextProfiles,
  });
  settings.setValue(scope, 'security.auth.selectedType', AuthType.USE_OPENAI);
  writeStdoutLine(
    t('Saved API key profile "{{id}}"{{active}}.', {
      id,
      active: makeActive ? t(' (active)') : '',
    }),
  );
}

function maskOAuthAccessToken(token: string | undefined): string {
  if (!token) {
    return t('(no access token)');
  }
  const tkn = token.trim();
  if (tkn.length <= 12) {
    return '****';
  }
  return `${tkn.slice(0, 8)}…${tkn.slice(-4)}`;
}

async function handleOAuthAccounts(
  settings: LoadedSettings,
  cmd: OAuthAccountCommand,
): Promise<void> {
  const scope = getPersistScopeForModelSelection(settings);

  if (cmd.op === 'list') {
    const accounts = await listQwenOAuthAccounts();
    const activeId = await getActiveQwenOAuthAccountId();
    if (!accounts.length) {
      writeStdoutLine(t('No Qwen OAuth accounts stored.'));
      writeStdoutLine(t('Run `qwen auth qwen-oauth` to sign in.'));
      return;
    }
    writeStdoutLine(t('Qwen OAuth accounts (active is used for API calls):\n'));
    for (const a of accounts) {
      const active = a.id === activeId;
      const mark = active ? t(' (active)') : '';
      const label = a.label ? `${a.id} — ${a.label}` : a.id;
      writeStdoutLine(
        t('  • {{label}}{{mark}}  token: {{masked}}', {
          label,
          mark,
          masked: maskOAuthAccessToken(a.credentials.access_token),
        }),
      );
    }
    writeStdoutLine(
      t('\nSwitch account: `qwen auth oauth-account use <id>`\n'),
    );
    return;
  }

  if (cmd.op === 'use') {
    const ok = await setActiveQwenOAuthAccount(cmd.id);
    if (!ok) {
      writeStderrLine(
        t(
          'Unknown OAuth account id "{{id}}". Run `qwen auth oauth-account list`.',
          {
            id: cmd.id,
          },
        ),
      );
      process.exit(1);
    }
    const settingsFile = settings.forScope(scope);
    backupSettingsFile(settingsFile.path);
    settings.setValue(scope, 'security.auth.selectedType', AuthType.QWEN_OAUTH);
    writeStdoutLine(
      t(
        'Active Qwen OAuth account set to "{{id}}". The CLI will use this account for API calls.',
        { id: cmd.id },
      ),
    );
    return;
  }

  const removed = await removeQwenOAuthAccount(cmd.id);
  if (!removed) {
    writeStderrLine(
      t(
        'Unknown OAuth account id "{{id}}". Run `qwen auth oauth-account list`.',
        {
          id: cmd.id,
        },
      ),
    );
    process.exit(1);
  }
  const remaining = await listQwenOAuthAccounts();
  if (remaining.length === 0) {
    const settingsFile = settings.forScope(scope);
    backupSettingsFile(settingsFile.path);
    settings.setValue(scope, 'security.auth.selectedType', undefined);
    writeStdoutLine(
      t('Removed OAuth account "{{id}}". No accounts left; signed out.', {
        id: cmd.id,
      }),
    );
  } else {
    writeStdoutLine(
      t('Removed OAuth account "{{id}}". Active credentials updated.', {
        id: cmd.id,
      }),
    );
  }
}

async function handleCodexAccounts(
  settings: LoadedSettings,
  cmd: CodexAccountCommand,
): Promise<void> {
  const scope = getPersistScopeForModelSelection(settings);

  if (cmd.op === 'list') {
    const store = await loadCodexOpenAiAccountStore();
    const activeId = await getActiveCodexOpenAiAccountId();
    if (!store.accounts.length) {
      writeStdoutLine(t('No ChatGPT (Codex) accounts stored.'));
      writeStdoutLine(t('Run `qwen auth codex-openai` to add a session.'));
      return;
    }
    writeStdoutLine(
      t('ChatGPT / Codex accounts (active is mirrored for API calls):\n'),
    );
    for (const a of store.accounts) {
      const active = a.id === activeId;
      const mark = active ? t(' (active)') : '';
      const email = decodeCodexJwtEmail(a.credentials.id_token);
      const label = email
        ? `${a.id} — ${email}`
        : a.label
          ? `${a.id} — ${a.label}`
          : a.id;
      writeStdoutLine(
        t('  • {{label}}{{mark}}  access: {{masked}}', {
          label,
          mark,
          masked: maskOAuthAccessToken(a.credentials.access_token),
        }),
      );
    }
    writeStdoutLine(
      t('\nSwitch account: `qwen auth codex-account use <id>`\n'),
    );
    return;
  }

  if (cmd.op === 'use') {
    const ok = await setActiveCodexOpenAiAccount(cmd.id);
    if (!ok) {
      writeStderrLine(
        t(
          'Unknown Codex account id "{{id}}". Run `qwen auth codex-account list`.',
          { id: cmd.id },
        ),
      );
      process.exit(1);
    }
    const settingsFile = settings.forScope(scope);
    backupSettingsFile(settingsFile.path);
    settings.setValue(
      scope,
      'security.auth.selectedType',
      AuthType.OPENAI_CODEX,
    );
    writeStdoutLine(
      t(
        'Active ChatGPT (Codex) account set to "{{id}}". Restart or run /model if the session was already open.',
        { id: cmd.id },
      ),
    );
    return;
  }

  const removed = await removeCodexOpenAiAccount(cmd.id);
  if (!removed) {
    writeStderrLine(
      t(
        'Unknown Codex account id "{{id}}". Run `qwen auth codex-account list`.',
        { id: cmd.id },
      ),
    );
    process.exit(1);
  }
  const remaining = await loadCodexOpenAiAccountStore();
  if (remaining.accounts.length === 0) {
    const settingsFile = settings.forScope(scope);
    backupSettingsFile(settingsFile.path);
    settings.setValue(scope, 'security.auth.selectedType', undefined);
    writeStdoutLine(
      t('Removed Codex account "{{id}}". No accounts left; signed out.', {
        id: cmd.id,
      }),
    );
  } else {
    writeStdoutLine(
      t('Removed Codex account "{{id}}". Active credentials updated.', {
        id: cmd.id,
      }),
    );
  }
}

/**
 * Runs the interactive authentication flow
 */
export async function runInteractiveAuth() {
  const selector = new InteractiveSelector(
    [
      {
        value: 'qwen-oauth' as const,
        label: t('Qwen OAuth'),
        description: t('Free · 100 requests/day · Ending 2026-04-15'),
      },
      {
        value: 'google-vertex-oauth' as const,
        label: t('Google · Vertex AI Gemini (OAuth)'),
        description: t(
          'Uses your Google account · Requires GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION',
        ),
      },
      {
        value: 'codex-openai' as const,
        label: t('OpenAI Codex (ChatGPT OAuth)'),
        description: t(
          'Same device login as the Codex CLI · Uses api.openai.com with your ChatGPT subscription',
        ),
      },
      {
        value: 'coding-plan' as const,
        label: t('Alibaba Cloud Coding Plan'),
        description: t(
          'Paid · Up to 6,000 requests/5 hrs · All Alibaba Cloud Coding Plan Models',
        ),
      },
      {
        value: 'logout' as const,
        label: t('Logout'),
        description: t(
          'Clear stored Qwen OAuth credentials and reset auth selection',
        ),
      },
    ],
    t('Select authentication method:'),
  );

  const choice = await selector.select();

  if (choice === 'coding-plan') {
    await handleQwenAuth('coding-plan', {});
  } else if (choice === 'logout') {
    await handleQwenAuth('logout', {});
  } else if (choice === 'google-vertex-oauth') {
    await handleGoogleVertexOAuthAuth('login');
  } else if (choice === 'codex-openai') {
    await handleQwenAuth('codex-openai', {});
  } else {
    await handleQwenAuth('qwen-oauth', {});
  }
}

/**
 * Shows the current authentication status
 */
export async function showAuthStatus(): Promise<void> {
  try {
    const settings = loadSettings();
    const mergedSettings = settings.merged as MergedSettingsWithCodingPlan;

    writeStdoutLine(t('\n=== Authentication Status ===\n'));

    // Check for selected auth type
    const selectedType = mergedSettings.security?.auth?.selectedType;

    if (!selectedType) {
      writeStdoutLine(t('⚠️  No authentication method configured.\n'));
      writeStdoutLine(t('Run one of the following commands to get started:\n'));
      writeStdoutLine(
        t(
          '  qwen auth qwen-oauth     - Authenticate with Qwen OAuth (free tier)',
        ),
      );
      writeStdoutLine(
        t(
          '  qwen auth codex-openai   - Sign in with ChatGPT (OpenAI Codex device flow)',
        ),
      );
      writeStdoutLine(
        t(
          '  qwen auth coding-plan      - Authenticate with Alibaba Cloud Coding Plan\n',
        ),
      );
      writeStdoutLine(
        t(
          '  qwen auth api-key add      - Store an OpenAI-compatible API key (multi-profile)\n',
        ),
      );
      writeStdoutLine(
        t(
          '  qwen auth oauth-account list - List / switch Qwen OAuth accounts (multi-login)\n',
        ),
      );
      writeStdoutLine(
        t(
          '  qwen auth codex-account list - List / switch ChatGPT (Codex) sessions\n',
        ),
      );
      writeStdoutLine(
        t(
          '  qwen auth google-vertex-oauth - Sign in with Google for Vertex AI Gemini\n',
        ),
      );
      writeStdoutLine(t('Or simply run:'));
      writeStdoutLine(
        t('  qwen auth                - Interactive authentication setup\n'),
      );
      process.exit(0);
    }

    // Display status based on auth type
    if (selectedType === AuthType.QWEN_OAUTH) {
      writeStdoutLine(t('✓ Authentication Method: Qwen OAuth'));
      writeStdoutLine(t('  Type: Free tier (ending 2026-04-15)'));
      writeStdoutLine(t('  Limit: 100 requests/day'));
      writeStdoutLine(t('  Models: Qwen latest models'));
      try {
        const oauthAccounts = await listQwenOAuthAccounts();
        const activeOAuthId = await getActiveQwenOAuthAccountId();
        if (oauthAccounts.length > 0) {
          writeStdoutLine(
            t('  OAuth accounts: {{count}} (active: {{activeId}})', {
              count: String(oauthAccounts.length),
              activeId: activeOAuthId ?? oauthAccounts[0]?.id ?? '—',
            }),
          );
          writeStdoutLine(
            t('  Switch account: `qwen auth oauth-account use <id>`\n'),
          );
        } else {
          writeStdoutLine('');
        }
      } catch {
        writeStdoutLine('');
      }
    } else if (selectedType === AuthType.OPENAI_CODEX) {
      writeStdoutLine(
        t('✓ Authentication Method: OpenAI Codex (ChatGPT OAuth)'),
      );
      const store = await loadCodexOpenAiAccountStore();
      const activeId = await getActiveCodexOpenAiAccountId();
      if (store.accounts.length > 0) {
        writeStdoutLine(
          t('  Stored sessions: {{count}} (active: {{activeId}})', {
            count: String(store.accounts.length),
            activeId: activeId ?? store.accounts[0]?.id ?? '—',
          }),
        );
        for (const a of store.accounts) {
          const mark = a.id === activeId ? t(' (active)') : '';
          const email = decodeCodexJwtEmail(a.credentials.id_token);
          const line = email
            ? `${a.id} — ${email}`
            : a.label
              ? `${a.id} — ${a.label}`
              : a.id;
          writeStdoutLine(t('    • {{line}}{{mark}}', { line, mark }));
        }
        writeStdoutLine(
          t('  Models: {{models}} · use /model to switch model or account', {
            models: OPENAI_CODEX_MODELS.map((m) => m.id).join(', '),
          }),
        );
        writeStdoutLine(
          t('  Files: ~/.qwen/codex_openai_accounts.json (+ active mirror)\n'),
        );
      } else if (await loadCodexOpenAiCredentials()) {
        const creds = await loadCodexOpenAiCredentials();
        const email = creds ? decodeCodexJwtEmail(creds.id_token) : undefined;
        writeStdoutLine(t('  Session: legacy single-file credential'));
        if (email) {
          writeStdoutLine(t('  Account email: {{email}}', { email }));
        }
        writeStdoutLine(
          t('  Models: {{models}} (ChatGPT Codex backend)\n', {
            models: OPENAI_CODEX_MODELS.map((m) => m.id).join(', '),
          }),
        );
      } else {
        writeStdoutLine(
          t(
            '  ⚠️  No local session found. Run `qwen auth codex-openai` to sign in.\n',
          ),
        );
      }
    } else if (selectedType === AuthType.GEMINI_VERTEX_OAUTH) {
      writeStdoutLine(
        t('✓ Authentication Method: Gemini on Vertex AI (Google OAuth)'),
      );
      const credOk = await hasGoogleVertexOAuthCredentials();
      writeStdoutLine(
        t('  Stored OAuth credentials: {{status}}', {
          status: credOk ? t('yes') : t('no'),
        }),
      );
      writeStdoutLine(
        t(
          '  Required env: GOOGLE_CLOUD_PROJECT (or GOOGLE_CLOUD_PROJECT_ID), GOOGLE_CLOUD_LOCATION',
        ),
      );
      writeStdoutLine(
        t('  Clear credentials: `qwen auth google-vertex-oauth --clear`\n'),
      );
    } else if (selectedType === AuthType.USE_OPENAI) {
      // Check for Coding Plan configuration
      const codingPlanRegion = mergedSettings.codingPlan?.region;
      const codingPlanVersion = mergedSettings.codingPlan?.version;
      const modelName = mergedSettings.model?.name;

      // Check if API key is set in environment
      const hasApiKey =
        !!process.env[CODING_PLAN_ENV_KEY] ||
        !!mergedSettings.env?.[CODING_PLAN_ENV_KEY];

      if (hasApiKey) {
        writeStdoutLine(
          t('✓ Authentication Method: Alibaba Cloud Coding Plan'),
        );

        if (codingPlanRegion) {
          const regionDisplay =
            codingPlanRegion === CodingPlanRegion.CHINA
              ? t('中国 (China) - 阿里云百炼')
              : t('Global - Alibaba Cloud');
          writeStdoutLine(t('  Region: {{region}}', { region: regionDisplay }));
        }

        if (modelName) {
          writeStdoutLine(
            t('  Current Model: {{model}}', { model: modelName }),
          );
        }

        if (codingPlanVersion) {
          writeStdoutLine(
            t('  Config Version: {{version}}', {
              version: codingPlanVersion.substring(0, 8) + '...',
            }),
          );
        }

        writeStdoutLine(t('  Status: API key configured\n'));
      } else {
        const flatKey = mergedSettings.security?.auth?.apiKey;
        const { activeProfileId, profiles } =
          readStoredApiProfiles(mergedSettings);
        if (flatKey || profiles.length > 0) {
          writeStdoutLine(
            t(
              '✓ Authentication Method: OpenAI-compatible (stored credentials)',
            ),
          );
          if (profiles.length > 0) {
            const active =
              profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
            writeStdoutLine(
              t('  API key profiles: {{count}} (active: {{activeId}})', {
                count: String(profiles.length),
                activeId: active?.id ?? '—',
              }),
            );
          }
          if (flatKey && !profiles.length) {
            writeStdoutLine(t('  API key: set in settings (single key)\n'));
          } else if (profiles.length) {
            writeStdoutLine(t('  Manage profiles: `qwen auth api-key list`\n'));
          }
        } else {
          writeStdoutLine(
            t(
              '⚠️  Authentication Method: Alibaba Cloud Coding Plan (Incomplete)',
            ),
          );
          writeStdoutLine(
            t('  Issue: API key not found in environment or settings\n'),
          );
          writeStdoutLine(
            t('  Run `qwen auth coding-plan` to re-configure.\n'),
          );
        }
      }
    } else {
      writeStdoutLine(
        t('✓ Authentication Method: {{type}}', { type: selectedType }),
      );
      writeStdoutLine(t('  Status: Configured\n'));
    }
    process.exit(0);
  } catch (error) {
    writeStderrLine(
      t('Failed to check authentication status: {{error}}', {
        error: getErrorMessage(error),
      }),
    );
    process.exit(1);
  }
}
