/**
 * Optional JSONL log for autopilot queue turns (interactive or headless).
 * Set `QWEN_AUTOPILOT_QUEUE_LOG` to an absolute or workspace-relative file path.
 */

import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

function previewPrompt(text: string, max = 180): string {
  return text.slice(0, max).replace(/\s+/g, ' ').trim();
}

export function getAutopilotQueueLogPath(): string | null {
  const raw = process.env['QWEN_AUTOPILOT_QUEUE_LOG']?.trim();
  if (!raw) {
    return null;
  }
  return isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
}

export function appendAutopilotQueueJsonl(
  logPath: string,
  entry: Record<string, unknown>,
): void {
  try {
    mkdirSync(dirname(logPath), { recursive: true });
    appendFileSync(
      logPath,
      JSON.stringify({
        ts: new Date().toISOString(),
        ...entry,
      }) + '\n',
      'utf8',
    );
  } catch {
    /* ignore disk errors */
  }
}

export function logAutopilotQueueTurn(
  logPath: string | null,
  payload: {
    kind: string;
    index: number;
    total: number;
    prompt: string;
    extra?: Record<string, unknown>;
  },
): void {
  if (!logPath) {
    return;
  }
  appendAutopilotQueueJsonl(logPath, {
    kind: payload.kind,
    index: payload.index,
    total: payload.total,
    remainingAfterThis: payload.total - payload.index,
    promptChars: payload.prompt.length,
    promptPreview: previewPrompt(payload.prompt),
    ...payload.extra,
  });
}
