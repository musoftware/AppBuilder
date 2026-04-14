/**
 * Optional JSONL log for autopilot queue turns (interactive or headless).
 * Set `QWEN_AUTOPILOT_QUEUE_LOG` to an absolute or workspace-relative file path.
 */

import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import type { ChatMessage } from '@qwen-code/autopilot';
import { getErrorMessage } from '@qwen-code/qwen-code-core';

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

/** Log `autopilot_queue_halted` when remaining work was skipped (e.g. error mid-queue). */
export function logAutopilotQueueHalted(
  logPath: string | null,
  payload: Record<string, unknown> & {
    reason: string;
    droppedRemaining: number;
  },
): void {
  if (!logPath || payload.droppedRemaining <= 0) {
    return;
  }
  appendAutopilotQueueJsonl(logPath, {
    kind: 'autopilot_queue_halted',
    ...payload,
  });
}

/**
 * Run linear headless phases with JSONL turn logging and a halt record if a phase throws.
 * Returns the last model text from the final successful phase, or `''` when `phases` is empty.
 */
export async function runHeadlessPhasesWithJsonl(
  phases: string[],
  callModelWithTools: (
    messages: ChatMessage[],
    system: string,
    yolo: boolean,
  ) => Promise<string>,
  system: string,
  source: string,
): Promise<string> {
  const logPath = getAutopilotQueueLogPath();
  const total = phases.length;
  let last = '';
  for (let i = 0; i < total; i++) {
    const phase = phases[i]!;
    logAutopilotQueueTurn(logPath, {
      kind: 'autopilot_queue',
      index: i + 1,
      total,
      prompt: phase,
      extra: { source },
    });
    try {
      last = await callModelWithTools(
        [{ role: 'user', content: phase }],
        system,
        true,
      );
    } catch (error: unknown) {
      const droppedRemaining = total - i - 1;
      logAutopilotQueueHalted(logPath, {
        reason: 'headless_phase_error',
        source,
        droppedRemaining,
        errorPreview: previewPrompt(
          getErrorMessage(error) || String(error),
          200,
        ),
      });
      throw error;
    }
  }
  return last;
}
