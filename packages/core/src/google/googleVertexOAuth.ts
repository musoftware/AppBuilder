/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Google Vertex AI OAuth using the installed-app OAuth client configuration
 * used by Google's Gemini CLI (public desktop client credentials).
 *
 * Adapted from:
 * https://github.com/google-gemini/gemini-cli/blob/main/packages/core/src/code_assist/oauth2.ts
 */

import * as http from 'node:http';
import * as net from 'node:net';
import * as url from 'node:url';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';

import type {
  Credentials,
  GoogleAuthOptions,
  JWTInput,
} from 'google-auth-library';
import { OAuth2Client } from 'google-auth-library';
import open from 'open';

import type { Config } from '../config/config.js';
import { Storage } from '../config/storage.js';
import { FatalAuthenticationError, getErrorMessage } from '../utils/errors.js';

/** Env vars for a Google Cloud OAuth 2.0 "Desktop" client (never commit values). */
const VERTEX_OAUTH_CLIENT_ID_ENV = 'QWEN_GOOGLE_VERTEX_OAUTH_CLIENT_ID';
const VERTEX_OAUTH_CLIENT_SECRET_ENV = 'QWEN_GOOGLE_VERTEX_OAUTH_CLIENT_SECRET';

const OAUTH_SCOPE = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

const HTTP_REDIRECT = 301;
const SIGN_IN_SUCCESS_URL =
  'https://developers.google.com/gemini-code-assist/auth_success_gemini';
const SIGN_IN_FAILURE_URL =
  'https://developers.google.com/gemini-code-assist/auth_failure_gemini';

function resolveGoogleVertexOAuthClientCredentials(): {
  clientId: string;
  clientSecret: string;
} {
  const clientId = process.env[VERTEX_OAUTH_CLIENT_ID_ENV]?.trim();
  const clientSecret = process.env[VERTEX_OAUTH_CLIENT_SECRET_ENV]?.trim();
  if (!clientId || !clientSecret) {
    throw new FatalAuthenticationError(
      `Missing Google Vertex OAuth client credentials. Set ${VERTEX_OAUTH_CLIENT_ID_ENV} and ${VERTEX_OAUTH_CLIENT_SECRET_ENV} to a Google Cloud OAuth 2.0 client of type "Desktop app". Do not commit these values to a repository.`,
    );
  }
  return { clientId, clientSecret };
}

function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    let port = 0;
    try {
      const portStr = process.env['OAUTH_CALLBACK_PORT'];
      if (portStr) {
        port = parseInt(portStr, 10);
        if (isNaN(port) || port <= 0 || port > 65535) {
          return reject(
            new Error(`Invalid value for OAUTH_CALLBACK_PORT: "${portStr}"`),
          );
        }
        return resolve(port);
      }
      const server = net.createServer();
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          port = address.port;
        }
      });
      server.on('listening', () => {
        server.close();
        server.unref();
      });
      server.on('error', (e) => reject(e));
      server.on('close', () => resolve(port));
    } catch (e) {
      reject(e);
    }
  });
}

async function authWithWeb(
  client: OAuth2Client,
  oauthClient: { clientId: string; clientSecret: string },
): Promise<{
  authUrl: string;
  loginCompletePromise: Promise<void>;
}> {
  const port = await getAvailablePort();
  const host = process.env['OAUTH_CALLBACK_HOST'] || '127.0.0.1';
  const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
  const state = crypto.randomBytes(32).toString('hex');
  const authUrl = client.generateAuthUrl({
    redirect_uri: redirectUri,
    access_type: 'offline',
    scope: OAUTH_SCOPE,
    state,
    prompt: 'consent',
  });

  const loginCompletePromise = new Promise<void>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url || req.url.indexOf('/oauth2callback') === -1) {
          res.writeHead(HTTP_REDIRECT, { Location: SIGN_IN_FAILURE_URL });
          res.end();
          reject(
            new FatalAuthenticationError(
              'OAuth callback not received. Unexpected request: ' + req.url,
            ),
          );
          return;
        }
        const qs = new url.URL(req.url, 'http://127.0.0.1').searchParams;
        if (qs.get('error')) {
          res.writeHead(HTTP_REDIRECT, { Location: SIGN_IN_FAILURE_URL });
          res.end();
          const errorCode = qs.get('error');
          const errorDescription =
            qs.get('error_description') || 'No additional details provided';
          reject(
            new FatalAuthenticationError(
              `Google OAuth error: ${errorCode}. ${errorDescription}`,
            ),
          );
        } else if (qs.get('state') !== state) {
          res.end('State mismatch. Possible CSRF attack');
          reject(
            new FatalAuthenticationError(
              'OAuth state mismatch. Possible CSRF attack or browser session issue.',
            ),
          );
        } else if (qs.get('code')) {
          try {
            const { tokens } = await client.getToken({
              code: qs.get('code')!,
              redirect_uri: redirectUri,
            });
            client.setCredentials(tokens);
            await saveGoogleVertexOAuthCredentials(
              client.credentials,
              oauthClient,
            );
            res.writeHead(HTTP_REDIRECT, { Location: SIGN_IN_SUCCESS_URL });
            res.end();
            resolve();
          } catch (error) {
            res.writeHead(HTTP_REDIRECT, { Location: SIGN_IN_FAILURE_URL });
            res.end();
            reject(
              new FatalAuthenticationError(
                `Failed to exchange authorization code for tokens: ${getErrorMessage(error)}`,
              ),
            );
          }
        } else {
          reject(
            new FatalAuthenticationError(
              'No authorization code received from Google OAuth. Please try authenticating again.',
            ),
          );
        }
      } catch (e) {
        if (e instanceof FatalAuthenticationError) {
          reject(e);
        } else {
          reject(
            new FatalAuthenticationError(
              `Unexpected error during OAuth authentication: ${getErrorMessage(e)}`,
            ),
          );
        }
      } finally {
        server.close();
      }
    });

    server.listen(port, host, () => {});
    server.on('error', (err) => {
      reject(
        new FatalAuthenticationError(
          `OAuth callback server error: ${getErrorMessage(err)}`,
        ),
      );
    });
  });

  return { authUrl, loginCompletePromise };
}

function credentialsToJwtInput(
  tokens: Credentials,
  oauthClient: { clientId: string; clientSecret: string },
): JWTInput {
  const refreshToken = tokens.refresh_token;
  if (
    refreshToken === null ||
    refreshToken === undefined ||
    refreshToken === ''
  ) {
    throw new FatalAuthenticationError(
      'Google did not return a refresh token. Remove the app at https://myaccount.google.com/permissions and run `qwen auth google-vertex-oauth` again.',
    );
  }
  return {
    type: 'authorized_user',
    client_id: oauthClient.clientId,
    client_secret: oauthClient.clientSecret,
    refresh_token: refreshToken,
  };
}

async function saveGoogleVertexOAuthCredentials(
  tokens: Credentials,
  oauthClient: { clientId: string; clientSecret: string },
): Promise<void> {
  const credPath = Storage.getGoogleVertexOAuthCredsPath();
  const payload = credentialsToJwtInput(tokens, oauthClient);
  await fs.mkdir(Storage.getGlobalQwenDir(), { recursive: true });
  await fs.writeFile(credPath, JSON.stringify(payload, null, 2), 'utf-8');
}

function parseStoredJwtInput(raw: string): JWTInput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new FatalAuthenticationError(
      'Stored Google Vertex OAuth credentials are not valid JSON.',
    );
  }
  const data = parsed as Record<string, unknown>;
  const refresh =
    typeof data['refresh_token'] === 'string' ? data['refresh_token'] : '';
  if (!refresh) {
    throw new FatalAuthenticationError(
      'Stored Google Vertex OAuth credentials are missing refresh_token. Run: qwen auth google-vertex-oauth',
    );
  }
  const fileClientId =
    typeof data['client_id'] === 'string' ? data['client_id'].trim() : '';
  const fileClientSecret =
    typeof data['client_secret'] === 'string'
      ? data['client_secret'].trim()
      : '';
  if (fileClientId && fileClientSecret) {
    return {
      type: 'authorized_user',
      client_id: fileClientId,
      client_secret: fileClientSecret,
      refresh_token: refresh,
    };
  }
  if (fileClientId || fileClientSecret) {
    throw new FatalAuthenticationError(
      'Stored Google Vertex OAuth credentials must include both client_id and client_secret, or omit both to use environment variables.',
    );
  }
  const { clientId, clientSecret } =
    resolveGoogleVertexOAuthClientCredentials();
  return {
    type: 'authorized_user',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refresh,
  };
}

/**
 * Loads {@link GoogleAuthOptions} for Vertex AI using stored user OAuth tokens.
 */
export async function loadGoogleVertexOAuthGoogleAuthOptions(
  _config: Config,
): Promise<GoogleAuthOptions> {
  const credPath = Storage.getGoogleVertexOAuthCredsPath();
  let raw: string;
  try {
    raw = await fs.readFile(credPath, 'utf-8');
  } catch {
    throw new FatalAuthenticationError(
      'No Google Vertex OAuth credentials found. Run: qwen auth google-vertex-oauth',
    );
  }
  if (!raw.trim()) {
    throw new FatalAuthenticationError(
      'Google Vertex OAuth credential file is empty. Run: qwen auth google-vertex-oauth',
    );
  }
  return {
    credentials: parseStoredJwtInput(raw),
  };
}

export async function hasGoogleVertexOAuthCredentials(): Promise<boolean> {
  try {
    await fs.access(Storage.getGoogleVertexOAuthCredsPath());
    return true;
  } catch {
    return false;
  }
}

export async function clearGoogleVertexOAuthCredentials(): Promise<void> {
  await fs.rm(Storage.getGoogleVertexOAuthCredsPath(), { force: true });
}

/**
 * Runs browser-based Google OAuth and stores refreshable credentials for Vertex.
 */
export async function performGoogleVertexOAuthLogin(
  config: Config,
): Promise<void> {
  const oauthClient = resolveGoogleVertexOAuthClientCredentials();
  const client = new OAuth2Client({
    clientId: oauthClient.clientId,
    clientSecret: oauthClient.clientSecret,
    transporterOptions: {
      proxy: config.getProxy(),
    },
  });

  const webLogin = await authWithWeb(client, oauthClient);

  process.stdout.write(
    '\nOpening your browser to sign in with Google.\nIf it does not open, visit:\n\n' +
      webLogin.authUrl +
      '\n\n',
  );

  const child = await open(webLogin.authUrl);
  if (child && typeof child.on === 'function') {
    child.on('error', (error) => {
      process.stderr.write(
        `Failed to open browser: ${getErrorMessage(error)}\nOpen the URL above manually.\n`,
      );
    });
  }

  const authTimeout = 5 * 60 * 1000;
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new FatalAuthenticationError(
          'Authentication timed out after 5 minutes.',
        ),
      );
    }, authTimeout);
  });

  await Promise.race([webLogin.loginCompletePromise, timeoutPromise]);
}
