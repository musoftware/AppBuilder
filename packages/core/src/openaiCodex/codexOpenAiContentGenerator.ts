/**
 * OpenAI Codex (ChatGPT OAuth): ChatGPT backend `/responses` + OAuth bearer,
 * matching Autohand code-cli OpenAIProvider (chatgpt mode).
 *
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  GenerateContentParameters,
  GenerateContentResponse,
} from '@google/genai';
import type { Config } from '../config/config.js';
import type { ContentGeneratorConfig } from '../core/contentGenerator.js';
import { OpenAIContentGenerator } from '../core/openaiContentGenerator/index.js';
import { DefaultOpenAICompatibleProvider } from '../core/openaiContentGenerator/provider/default.js';
import { CODEX_CHATGPT_BACKEND_BASE_URL } from '../core/openaiContentGenerator/constants.js';
import { buildRuntimeFetchOptions } from '../utils/runtimeFetchOptions.js';
import type { CodexOpenAiAuthClient } from './codexOpenAiAuth.js';
import {
  loadCodexOpenAiCredentials,
  refreshCodexOpenAiSession,
} from './codexOpenAiAuth.js';
import {
  buildCodexResponsesRequestBody,
  codexCompletedPayloadToGeminiResponse,
  postCodexChatgptResponses,
} from './codexChatgptResponsesClient.js';

export class CodexOpenAiContentGenerator extends OpenAIContentGenerator {
  private readonly authClient: CodexOpenAiAuthClient;
  private readonly cgConfig: ContentGeneratorConfig;
  private readonly cliConfig: Config;

  constructor(
    authClient: CodexOpenAiAuthClient,
    contentGeneratorConfig: ContentGeneratorConfig,
    cliConfig: Config,
  ) {
    const provider = new DefaultOpenAICompatibleProvider(
      contentGeneratorConfig,
      cliConfig,
    );
    super(contentGeneratorConfig, cliConfig, provider);
    this.authClient = authClient;
    this.cgConfig = contentGeneratorConfig;
    this.cliConfig = cliConfig;

    this.pipeline.client.baseURL =
      contentGeneratorConfig.baseUrl ?? CODEX_CHATGPT_BACKEND_BASE_URL;
    this.pipeline.client.apiKey =
      contentGeneratorConfig.apiKey ?? 'OPENAI_CODEX_DYNAMIC_TOKEN';
  }

  protected override shouldSuppressErrorLogging(
    error: unknown,
    request: GenerateContentParameters,
  ): boolean {
    return (
      super.shouldSuppressErrorLogging(error, request) ||
      this.isAuthError(error)
    );
  }

  private isAuthError(error: unknown): boolean {
    if (!error) {
      return false;
    }
    const errorMessage =
      error instanceof Error
        ? error.message.toLowerCase()
        : String(error).toLowerCase();
    const errorWithCode = error as {
      status?: number | string;
      code?: number | string;
    };
    const errorCode = errorWithCode?.status ?? errorWithCode?.code;
    return (
      errorCode === 401 ||
      errorCode === 403 ||
      errorCode === '401' ||
      errorCode === '403' ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('invalid api key') ||
      errorMessage.includes('invalid access token') ||
      errorMessage.includes('token expired') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('access denied') ||
      (errorMessage.includes('token') && errorMessage.includes('expired'))
    );
  }

  private async withCodexAuthRetry<T>(operation: () => Promise<T>): Promise<T> {
    let authRefreshRetried = false;
    for (;;) {
      try {
        return await operation();
      } catch (error) {
        if (this.isAuthError(error) && !authRefreshRetried) {
          authRefreshRetried = true;
          const cur =
            this.authClient.getCredentials() ??
            (await loadCodexOpenAiCredentials());
          if (!cur) {
            throw error;
          }
          const refreshed = await refreshCodexOpenAiSession(cur);
          this.authClient.setCredentials(refreshed);
          continue;
        }
        throw error;
      }
    }
  }

  private async runCodexResponsesOnce(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse> {
    const effectiveModel = request.model || this.cgConfig.model;
    const chatParams = await this.pipeline.buildOpenAiChatParams(
      request,
      userPromptId,
      true,
      effectiveModel,
    );
    const body = buildCodexResponsesRequestBody(chatParams);
    const base = this.cgConfig.baseUrl ?? CODEX_CHATGPT_BACKEND_BASE_URL;
    const rt = buildRuntimeFetchOptions('openai', this.cliConfig.getProxy());
    const dispatcher = rt?.fetchOptions?.dispatcher;

    const accessToken = await this.authClient.getBearerToken();
    const chatgptAccountId = await this.authClient.getChatgptAccountId();

    const payload = await postCodexChatgptResponses({
      backendBaseUrl: base,
      accessToken,
      chatgptAccountId,
      body,
      signal: request.config?.abortSignal,
      dispatcher,
    });
    return codexCompletedPayloadToGeminiResponse(payload, effectiveModel);
  }

  override async generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse> {
    return this.withCodexAuthRetry(() =>
      this.runCodexResponsesOnce(request, userPromptId),
    );
  }

  override async generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const res = await this.withCodexAuthRetry(() =>
      this.runCodexResponsesOnce(request, userPromptId),
    );
    async function* single() {
      yield res;
    }
    return single();
  }

  override async countTokens(
    _request: CountTokensParameters,
  ): Promise<CountTokensResponse> {
    throw new Error(
      'Token counting is not supported when using ChatGPT (Codex) sign-in.',
    );
  }

  override async embedContent(
    _request: EmbedContentParameters,
  ): Promise<EmbedContentResponse> {
    throw new Error(
      'Embeddings are not supported when using ChatGPT (Codex) sign-in.',
    );
  }
}
