/**
 * OpenAI Codex (ChatGPT OAuth) content generator: dynamic bearer + api.openai.com.
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
import { DEFAULT_OPENAI_BASE_URL } from '../core/openaiContentGenerator/constants.js';
import type { CodexOpenAiAuthClient } from './codexOpenAiAuth.js';

export class CodexOpenAiContentGenerator extends OpenAIContentGenerator {
  private readonly authClient: CodexOpenAiAuthClient;
  private readonly cgConfig: ContentGeneratorConfig;

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

    this.pipeline.client.baseURL =
      contentGeneratorConfig.baseUrl ?? DEFAULT_OPENAI_BASE_URL;
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

  private async executeWithCredentialManagement<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    let authRefreshRetried = false;
    for (;;) {
      try {
        const token = await this.authClient.getBearerToken();
        this.pipeline.client.apiKey = token;
        this.pipeline.client.baseURL =
          this.cgConfig.baseUrl ?? DEFAULT_OPENAI_BASE_URL;
        return await operation();
      } catch (error) {
        if (this.isAuthError(error) && !authRefreshRetried) {
          authRefreshRetried = true;
          const { refreshCodexOpenAiSession, loadCodexOpenAiCredentials } =
            await import('./codexOpenAiAuth.js');
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

  override async generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse> {
    return this.executeWithCredentialManagement(() =>
      super.generateContent(request, userPromptId),
    );
  }

  override async generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    return this.executeWithCredentialManagement(() =>
      super.generateContentStream(request, userPromptId),
    );
  }

  override async countTokens(
    request: CountTokensParameters,
  ): Promise<CountTokensResponse> {
    return super.countTokens(request);
  }

  override async embedContent(
    request: EmbedContentParameters,
  ): Promise<EmbedContentResponse> {
    return this.executeWithCredentialManagement(() =>
      super.embedContent(request),
    );
  }
}
