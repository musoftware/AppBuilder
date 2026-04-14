/**
 * ChatGPT Codex backend: POST `{base}/responses` with OAuth access token and
 * `chatgpt-account-id` header (same approach as Autohand code-cli OpenAIProvider).
 *
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Dispatcher } from 'undici';
import { fetch as undiciFetch } from 'undici';
import type OpenAI from 'openai';
import {
  FinishReason,
  GenerateContentResponse,
  type Part,
} from '@google/genai';
export const DEFAULT_CODEX_RESPONSES_INSTRUCTIONS =
  'You are Qwen Code, a coding assistant. Follow the repository instructions and help the user complete software tasks.';

export type CodexResponsesCompletedPayload = {
  id: string;
  created_at?: number;
  output?: unknown[];
  output_text?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  incomplete_details?: { reason?: string };
};

function safeJsonParse(text: string, fallback: Record<string, unknown>) {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return fallback;
  }
}

export function parseCodexResponsesSseToCompleted(
  rawBody: string,
): CodexResponsesCompletedPayload {
  let currentEvent = '';
  for (const line of rawBody.split('\n')) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7).trim();
      continue;
    }
    if (line.startsWith('data: ') && currentEvent === 'response.completed') {
      const jsonText = line.slice(6).trim();
      if (!jsonText || jsonText === '[DONE]') {
        continue;
      }
      return JSON.parse(jsonText) as CodexResponsesCompletedPayload;
    }
  }
  throw new Error(
    'Codex Responses stream did not include a response.completed event.',
  );
}

export function extractResponsesText(
  payload: CodexResponsesCompletedPayload,
): string {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  if (!Array.isArray(payload.output)) {
    return '';
  }
  const parts: string[] = [];
  for (const item of payload.output) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const entry = item as { type?: string; content?: unknown[] };
    if (entry.type !== 'message' || !Array.isArray(entry.content)) {
      continue;
    }
    for (const c of entry.content) {
      if (
        c &&
        typeof c === 'object' &&
        (c as { type?: string }).type === 'output_text' &&
        typeof (c as { text?: string }).text === 'string'
      ) {
        parts.push((c as { text: string }).text);
      }
    }
  }
  return parts.join('\n').trim();
}

function messageTextContent(
  content: OpenAI.Chat.ChatCompletionContentPart[] | string | null | undefined,
): string {
  if (typeof content === 'string') {
    return content;
  }
  if (!content) {
    return '';
  }
  if (Array.isArray(content)) {
    const chunks: string[] = [];
    for (const p of content) {
      if (p.type === 'text' && 'text' in p && p.text) {
        chunks.push(p.text);
      }
    }
    return chunks.join('\n');
  }
  return '';
}

function chatMessagesToResponsesInput(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      continue;
    }

    if (msg.role === 'tool' && 'tool_call_id' in msg && msg.tool_call_id) {
      items.push({
        type: 'function_call_output',
        call_id: msg.tool_call_id,
        output:
          typeof msg.content === 'string'
            ? msg.content
            : JSON.stringify(msg.content ?? ''),
      });
      continue;
    }

    const text =
      'content' in msg
        ? messageTextContent(
            msg.content as
              | OpenAI.Chat.ChatCompletionContentPart[]
              | string
              | null,
          )
        : '';
    if (text) {
      const isAssistant = msg.role === 'assistant';
      items.push({
        type: 'message',
        role: isAssistant ? 'assistant' : 'user',
        content: [
          {
            type: isAssistant ? 'output_text' : 'input_text',
            text,
          },
        ],
      });
    }

    if (
      msg.role === 'assistant' &&
      'tool_calls' in msg &&
      Array.isArray(msg.tool_calls)
    ) {
      for (const tc of msg.tool_calls) {
        items.push({
          type: 'function_call',
          call_id: tc.id,
          name: tc.function.name,
          arguments: tc.function.arguments,
        });
      }
    }
  }

  return items;
}

function collectSystemInstructions(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  fallback: string,
): string {
  const blocks: string[] = [];
  for (const msg of messages) {
    if (msg.role !== 'system') {
      continue;
    }
    const t =
      typeof msg.content === 'string'
        ? msg.content
        : messageTextContent(
            msg.content as OpenAI.Chat.ChatCompletionContentPart[] | null,
          );
    if (t.trim()) {
      blocks.push(t.trim());
    }
  }
  return blocks.length > 0 ? blocks.join('\n\n') : fallback;
}

export function buildCodexResponsesRequestBody(
  chat: OpenAI.Chat.ChatCompletionCreateParams,
  defaultInstructions: string = DEFAULT_CODEX_RESPONSES_INSTRUCTIONS,
): Record<string, unknown> {
  const instructions = collectSystemInstructions(
    chat.messages,
    defaultInstructions,
  );
  const input = chatMessagesToResponsesInput(chat.messages);

  const body: Record<string, unknown> = {
    model: chat.model,
    instructions,
    store: false,
    stream: true,
    tool_choice: 'auto',
    parallel_tool_calls: true,
    input,
  };

  if (chat.tools && chat.tools.length > 0) {
    body['tools'] = chat.tools.map((tool) => ({
      type: 'function' as const,
      name: tool.function.name,
      description: tool.function.description ?? '',
      parameters: tool.function.parameters ?? {
        type: 'object',
        properties: {},
      },
    }));
  }

  return body;
}

function extractToolCallParts(output: unknown[] | undefined): Part[] {
  const parts: Part[] = [];
  if (!Array.isArray(output)) {
    return parts;
  }
  for (const entry of output) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      (entry as { type?: string }).type !== 'function_call'
    ) {
      continue;
    }
    const fc = entry as {
      call_id?: string;
      name?: string;
      arguments?: string;
    };
    const args = safeJsonParse(fc.arguments ?? '{}', {});
    parts.push({
      functionCall: {
        id: fc.call_id ?? '',
        name: fc.name ?? '',
        args,
      },
    });
  }
  return parts;
}

export function codexCompletedPayloadToGeminiResponse(
  payload: CodexResponsesCompletedPayload,
  modelId: string,
): GenerateContentResponse {
  const text = extractResponsesText(payload);
  const toolParts = extractToolCallParts(payload.output);
  const parts: Part[] = [...(text ? [{ text }] : []), ...toolParts];

  const response = new GenerateContentResponse();

  const finishReason =
    toolParts.length > 0
      ? FinishReason.STOP
      : payload.incomplete_details?.reason === 'max_output_tokens'
        ? FinishReason.MAX_TOKENS
        : FinishReason.STOP;

  response.candidates = [
    {
      content: {
        parts: parts.length > 0 ? parts : [{ text: '' }],
        role: 'model' as const,
      },
      finishReason,
      index: 0,
      safetyRatings: [],
    },
  ];
  response.responseId = payload.id;
  response.createTime = (
    payload.created_at ?? Math.floor(Date.now() / 1000)
  ).toString();
  response.modelVersion = modelId;
  response.promptFeedback = { safetyRatings: [] };

  if (payload.usage) {
    const prompt = payload.usage.input_tokens ?? 0;
    const completion = payload.usage.output_tokens ?? 0;
    const total = payload.usage.total_tokens ?? prompt + completion;
    response.usageMetadata = {
      promptTokenCount: prompt,
      candidatesTokenCount: completion,
      totalTokenCount: total,
    };
  }

  return response;
}

export async function postCodexChatgptResponses(options: {
  backendBaseUrl: string;
  accessToken: string;
  chatgptAccountId: string;
  body: Record<string, unknown>;
  signal?: AbortSignal;
  dispatcher?: Dispatcher;
}): Promise<CodexResponsesCompletedPayload> {
  const base = options.backendBaseUrl.replace(/\/$/, '');
  const url = `${base}/responses`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${options.accessToken}`,
    'chatgpt-account-id': options.chatgptAccountId,
  };
  const bodyStr = JSON.stringify(options.body);

  const resp = options.dispatcher
    ? await undiciFetch(url, {
        method: 'POST',
        headers,
        body: bodyStr,
        signal: options.signal,
        dispatcher: options.dispatcher,
      })
    : await fetch(url, {
        method: 'POST',
        headers,
        body: bodyStr,
        signal: options.signal,
      });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(
      `Codex backend request failed (${resp.status}): ${errText.slice(0, 1200)}`,
    );
  }
  const raw = await resp.text();
  return parseCodexResponsesSseToCompleted(raw);
}
