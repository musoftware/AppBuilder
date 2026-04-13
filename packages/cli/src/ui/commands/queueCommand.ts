/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CommandContext,
  SlashCommand,
  MessageActionReturn,
} from './types.js';
import { CommandKind } from './types.js';

/** Reference to the queue function, set by AppContainer during initialization */
let enqueueToAutopilotQueue: ((messages: string[]) => void) | null = null;

/**
 * Called by AppContainer to inject the enqueue function into this module.
 * This allows the /queue command to add messages to the autopilot queue.
 */
export function setEnqueueFunction(fn: (messages: string[]) => void): void {
  enqueueToAutopilotQueue = fn;
}

export const queueCommand: SlashCommand = {
  name: 'queue',
  description:
    'Add follow-up messages to execute after the current task completes. Use && to chain multiple messages.',
  kind: CommandKind.BUILT_IN,
  action: async (
    context: CommandContext,
    args: string,
  ): Promise<MessageActionReturn> => {
    const { ui } = context;
    const { addItem } = ui;

    const trimmedArgs = args.trim();
    if (!trimmedArgs) {
      return {
        type: 'message',
        messageType: 'error',
        content:
          'Usage:\n' +
          '  /queue <message>          — Add a message to the queue\n' +
          '  /queue <msg1> && <msg2>   — Add multiple messages\n' +
          '  /queue clear              — Clear pending queue messages\n',
      };
    }

    // Handle /queue clear
    if (
      trimmedArgs.toLowerCase() === 'clear' ||
      trimmedArgs.toLowerCase() === 'cancel'
    ) {
      if (!enqueueToAutopilotQueue) {
        return {
          type: 'message',
          messageType: 'error',
          content: 'Queue functionality is not available in this session.',
        };
      }
      // Clear the queue by setting an empty array
      enqueueToAutopilotQueue([]);
      addItem(
        {
          type: 'info',
          text: '✓ Autopilot queue cleared. Pending messages have been dropped.',
        },
        Date.now(),
      );
      return { type: 'message', messageType: 'info', content: '' };
    }

    // Handle /queue status
    if (trimmedArgs.toLowerCase() === 'status') {
      addItem(
        {
          type: 'info',
          text:
            'Queue behavior: Messages execute sequentially after each task completes.\n' +
            'Use /queue <message> to add follow-ups, or /queue clear to cancel pending messages.',
        },
        Date.now(),
      );
      return { type: 'message', messageType: 'info', content: '' };
    }

    // Parse multiple messages separated by && or newlines
    const messages = trimmedArgs
      .split(/\s*&&\s*|\n/)
      .map((m) => m.trim())
      .filter(Boolean);

    if (messages.length === 0) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'No valid messages found in queue command.',
      };
    }

    if (!enqueueToAutopilotQueue) {
      return {
        type: 'message',
        messageType: 'error',
        content:
          'Queue functionality is not available in this session.\n' +
          'The /queue command only works during active autopilot sessions.',
      };
    }

    // Add messages to the queue
    enqueueToAutopilotQueue(messages);

    const messageList = messages.map((m, i) => `  ${i + 1}. ${m}`).join('\n');
    addItem(
      {
        type: 'info',
        text:
          `✓ Added ${messages.length} message(s) to autopilot queue:\n${messageList}\n\n` +
          `These will execute sequentially after the current task completes.`,
      },
      Date.now(),
    );

    return { type: 'message', messageType: 'info', content: '' };
  },
};
