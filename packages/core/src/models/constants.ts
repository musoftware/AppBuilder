/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_QWEN_MODEL, MAINLINE_CODER_MODEL } from '../config/models.js';
import { CODEX_CHATGPT_BACKEND_BASE_URL } from '../core/openaiContentGenerator/constants.js';

import type { ModelConfig } from './types.js';

type AuthType = import('../core/contentGenerator.js').AuthType;
type ContentGeneratorConfig =
  import('../core/contentGenerator.js').ContentGeneratorConfig;

/**
 * Field keys for model-scoped generation config.
 *
 * Kept in a small standalone module to avoid circular deps. The `import('...')`
 * usage is type-only and does not emit runtime imports.
 */
export const MODEL_GENERATION_CONFIG_FIELDS = [
  'samplingParams',
  'timeout',
  'maxRetries',
  'retryErrorCodes',
  'enableCacheControl',
  'schemaCompliance',
  'reasoning',
  'contextWindowSize',
  'customHeaders',
  'extra_body',
  'modalities',
] as const satisfies ReadonlyArray<keyof ContentGeneratorConfig>;

/**
 * Credential-related fields that are part of ContentGeneratorConfig
 * but not ModelGenerationConfig.
 */
export const CREDENTIAL_FIELDS = [
  'model',
  'apiKey',
  'apiKeyEnvKey',
  'baseUrl',
] as const satisfies ReadonlyArray<keyof ContentGeneratorConfig>;

/**
 * All provider-sourced fields that need to be tracked for source attribution
 * and cleared when switching from provider to manual credentials.
 */
export const PROVIDER_SOURCED_FIELDS = [
  ...CREDENTIAL_FIELDS,
  ...MODEL_GENERATION_CONFIG_FIELDS,
] as const;

/**
 * Environment variable mappings per authType.
 */
export interface AuthEnvMapping {
  apiKey: string[];
  baseUrl: string[];
  model: string[];
}

export const AUTH_ENV_MAPPINGS = {
  openai: {
    apiKey: ['OPENAI_API_KEY'],
    baseUrl: ['OPENAI_BASE_URL'],
    model: ['OPENAI_MODEL', 'QWEN_MODEL'],
  },
  'openai-codex': {
    apiKey: [],
    baseUrl: [],
    model: [],
  },
  anthropic: {
    apiKey: ['ANTHROPIC_API_KEY'],
    baseUrl: ['ANTHROPIC_BASE_URL'],
    model: ['ANTHROPIC_MODEL'],
  },
  gemini: {
    apiKey: ['GEMINI_API_KEY'],
    baseUrl: [],
    model: ['GEMINI_MODEL'],
  },
  'vertex-ai': {
    apiKey: ['GOOGLE_API_KEY'],
    baseUrl: [],
    model: ['GOOGLE_MODEL'],
  },
  'qwen-oauth': {
    apiKey: [],
    baseUrl: [],
    model: [],
  },
  'gemini-vertex-oauth': {
    apiKey: [],
    baseUrl: [],
    model: ['GEMINI_MODEL'],
  },
} as const satisfies Record<AuthType, AuthEnvMapping>;

/** Default Gemini model when using Vertex with user OAuth. */
export const DEFAULT_GEMINI_VERTEX_OAUTH_MODEL = 'gemini-2.5-flash';

/** Default model when using ChatGPT / Codex OAuth (Codex backend Responses API). */
export const DEFAULT_OPENAI_CODEX_MODEL = 'gpt-5.2-codex';

export const DEFAULT_MODELS = {
  openai: MAINLINE_CODER_MODEL,
  'openai-codex': DEFAULT_OPENAI_CODEX_MODEL,
  'qwen-oauth': DEFAULT_QWEN_MODEL,
  'gemini-vertex-oauth': DEFAULT_GEMINI_VERTEX_OAUTH_MODEL,
} as Partial<Record<AuthType, string>>;

/**
 * Hard-coded Qwen OAuth models that are always available.
 * These cannot be overridden by user configuration.
 */
/**
 * Curated OpenAI Codex models (ChatGPT OAuth / Codex backend).
 * `gpt-5.1-codex` is for the OpenAI API; ChatGPT-backed Codex rejects it (400).
 */
export const OPENAI_CODEX_MODELS: ModelConfig[] = [
  {
    id: 'gpt-5.2-codex',
    name: 'GPT-5.2 Codex',
    description: 'Codex via ChatGPT sign-in (default; works on free and paid)',
    capabilities: { vision: true },
    baseUrl: CODEX_CHATGPT_BACKEND_BASE_URL,
  },
  {
    id: 'gpt-5.3-codex',
    name: 'GPT-5.3 Codex',
    description: 'Newer Codex (typically paid ChatGPT plans)',
    capabilities: { vision: true },
    baseUrl: CODEX_CHATGPT_BACKEND_BASE_URL,
  },
  {
    id: 'gpt-5.4',
    name: 'GPT-5.4',
    description: 'Latest general Codex model (paid ChatGPT plans)',
    capabilities: { vision: true },
    baseUrl: CODEX_CHATGPT_BACKEND_BASE_URL,
  },
  {
    id: 'gpt-5.4-mini',
    name: 'GPT-5.4 Mini',
    description: 'Faster, lower-cost option for lighter tasks',
    capabilities: { vision: true },
    baseUrl: CODEX_CHATGPT_BACKEND_BASE_URL,
  },
];

export const OPENAI_CODEX_ALLOWED_MODELS = OPENAI_CODEX_MODELS.map(
  (model) => model.id,
) as readonly string[];

export const QWEN_OAUTH_MODELS: ModelConfig[] = [
  {
    id: 'coder-model',
    name: 'coder-model',
    description:
      'Qwen 3.6 Plus — efficient hybrid model with leading coding performance',
    capabilities: { vision: true },
  },
];

/**
 * Derive allowed models from QWEN_OAUTH_MODELS for authorization.
 * This ensures single source of truth (SSOT).
 */
export const QWEN_OAUTH_ALLOWED_MODELS = QWEN_OAUTH_MODELS.map(
  (model) => model.id,
) as readonly string[];

/**
 * Curated Gemini models on Vertex AI for OAuth-based auth.
 */
export const GEMINI_VERTEX_OAUTH_MODELS: ModelConfig[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast Gemini 2.5 on Vertex AI',
    capabilities: { vision: true },
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Capable Gemini 2.5 on Vertex AI',
    capabilities: { vision: true },
  },
];

export const GEMINI_VERTEX_OAUTH_ALLOWED_MODELS =
  GEMINI_VERTEX_OAUTH_MODELS.map((model) => model.id) as readonly string[];
