/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeminiContentGenerator } from './geminiContentGenerator.js';
import type {
  ContentGenerator,
  ContentGeneratorConfig,
} from '../contentGenerator.js';
import { AuthType } from '../contentGenerator.js';
import type { Config } from '../../config/config.js';
import { InstallationManager } from '../../utils/installationManager.js';

export { GeminiContentGenerator } from './geminiContentGenerator.js';

/**
 * Create a Gemini content generator.
 */
export async function createGeminiContentGenerator(
  config: ContentGeneratorConfig,
  gcConfig: Config,
): Promise<ContentGenerator> {
  const version = process.env['CLI_VERSION'] || process.version;
  const userAgent =
    config.userAgent ||
    `QwenCode/${version} (${process.platform}; ${process.arch})`;
  const baseHeaders: Record<string, string> = {
    'User-Agent': userAgent,
  };

  let headers: Record<string, string> = { ...baseHeaders };
  if (gcConfig?.getUsageStatisticsEnabled()) {
    const installationManager = new InstallationManager();
    const installationId = installationManager.getInstallationId();
    headers = {
      ...headers,
      'x-gemini-api-privileged-user-id': `${installationId}`,
    };
  }
  const httpOptions = { headers };

  if (config.authType === AuthType.GEMINI_VERTEX_OAUTH) {
    const { loadGoogleVertexOAuthGoogleAuthOptions } = await import(
      '../../google/googleVertexOAuth.js'
    );
    const googleAuthOptions =
      await loadGoogleVertexOAuthGoogleAuthOptions(gcConfig);
    return new GeminiContentGenerator(
      {
        vertexai: true,
        project: config.vertexProjectId,
        location: config.vertexLocation,
        googleAuthOptions,
        httpOptions,
      },
      config,
    );
  }

  const geminiContentGenerator = new GeminiContentGenerator(
    {
      apiKey: config.apiKey === '' ? undefined : config.apiKey,
      vertexai: config.vertexai,
      httpOptions,
    },
    config,
  );

  return geminiContentGenerator;
}
