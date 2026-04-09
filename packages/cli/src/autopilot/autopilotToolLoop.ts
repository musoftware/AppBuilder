import chalk from 'chalk';
import type { Config, ToolCallRequestInfo } from '@qwen-code/qwen-code-core';
import {
  ApprovalMode,
  executeToolCall,
  GeminiEventType,
  SendMessageType,
  promptIdContext,
  ToolNames,
} from '@qwen-code/qwen-code-core';
import {
  createAgentToolProgressHandler,
  createToolProgressHandler,
  normalizePartList,
} from '../utils/nonInteractiveHelpers.js';
import type { Content, Part, PartListUnion } from '@google/genai';
import type { ChatMessage } from '@qwen-code/autopilot';
import { JsonOutputAdapter } from '../nonInteractive/io/JsonOutputAdapter.js';
import { handleToolError } from '../utils/errors.js';
import { setMaxListeners } from 'node:events';

/**
 * Maps tool names and args to short, end-user-friendly descriptions.
 * Returns undefined for noisy read-only tools that add little value to the display.
 */
function getFriendlyToolDescription(
  name: string,
  args: Record<string, unknown>,
): string | undefined {
  const str = (key: string) =>
    args[key] != null ? String(args[key]) : undefined;
  switch (name) {
    case ToolNames.WRITE_FILE:
      return `Writing ${str('path') ?? 'file'}`;
    case ToolNames.EDIT:
      return `Editing ${str('file_path') ?? 'file'}`;
    case ToolNames.SHELL: {
      const cmd = str('command') ?? '';
      const short = cmd.length > 60 ? cmd.slice(0, 57) + '…' : cmd;
      return `Running: ${short}`;
    }
    case ToolNames.WEB_FETCH:
      return `Fetching ${str('url') ?? 'URL'}`;
    case ToolNames.WEB_SEARCH:
      return `Searching web: ${str('query') ?? ''}`;
    case ToolNames.MEMORY:
      return `Saving memory…`;
    case ToolNames.TODO_WRITE:
      return `Updating task list…`;
    case ToolNames.READ_FILE:
    case ToolNames.GREP:
    case ToolNames.GLOB:
    case ToolNames.LS:
    case ToolNames.LSP:
      return undefined;
    default:
      return `Using ${name}…`;
  }
}

function formatAutopilotMessages(
  messages: ChatMessage[],
  system: string,
): string {
  const body = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');
  return `${system.trim()}\n\n---\n\n${body}`;
}

/**
 * Runs a full tool-using agent loop for autopilot task execution.
 * Resets chat per invocation so tasks do not leak into session history.
 * Returns the final text content produced by the model (the task summary).
 */
export async function runAutopilotToolLoop(
  config: Config,
  promptText: string,
  promptId: string,
): Promise<string> {
  const geminiClient = config.getGeminiClient();
  await geminiClient.startChat([]);

  const adapter = new JsonOutputAdapter(config);
  const abortController = new AbortController();
  // 0 = unlimited: this signal is scoped to one task and accumulates one
  // listener per tool call; there is no actual leak.
  setMaxListeners(0, abortController.signal);

  const initialPartList: PartListUnion = [{ text: promptText }];
  const initialParts = normalizePartList(initialPartList);
  let currentMessages: Array<{ role: 'user'; parts: Part[] }> = [
    { role: 'user', parts: initialParts },
  ];

  let isFirstTurn = true;
  let finalText = '';

  while (true) {
    const toolCallRequests: ToolCallRequestInfo[] = [];
    const responseStream = geminiClient.sendMessageStream(
      currentMessages[0]?.parts || [],
      abortController.signal,
      promptId,
      {
        type: isFirstTurn
          ? SendMessageType.UserQuery
          : SendMessageType.ToolResult,
      },
    );
    isFirstTurn = false;

    adapter.startAssistantMessage();
    let turnText = '';

    for await (const event of responseStream) {
      adapter.processEvent(event);
      if (event.type === GeminiEventType.ToolCallRequest) {
        toolCallRequests.push(event.value);
      } else if (event.type === GeminiEventType.Content) {
        turnText += event.value;
      }
    }

    adapter.finalizeAssistantMessage();

    if (toolCallRequests.length > 0) {
      // Keep YOLO across tools: some tools may change approval mode after run.
      config.setApprovalMode(ApprovalMode.YOLO);

      // Run all tool calls in parallel — matches coreToolScheduler behaviour.
      const toolResults = await Promise.all(
        toolCallRequests.map(async (requestInfo) => {
          const isAgentTool = requestInfo.name === 'agent';
          const { handler: outputUpdateHandler } = isAgentTool
            ? createAgentToolProgressHandler(
                config,
                requestInfo.callId,
                adapter,
              )
            : createToolProgressHandler(requestInfo, adapter);

          const description = getFriendlyToolDescription(
            requestInfo.name,
            requestInfo.args,
          );
          if (description) {
            process.stdout.write(
              chalk.dim('    → ') + chalk.white(description) + '\n',
            );
          }

          const toolResponse = await executeToolCall(
            config,
            requestInfo,
            abortController.signal,
            { outputUpdateHandler },
          );

          if (toolResponse.error) {
            handleToolError(
              requestInfo.name,
              toolResponse.error,
              config,
              toolResponse.errorType || 'TOOL_EXECUTION_ERROR',
              typeof toolResponse.resultDisplay === 'string'
                ? toolResponse.resultDisplay
                : undefined,
            );
          }

          adapter.emitToolResult(requestInfo, toolResponse);
          return toolResponse.responseParts ?? [];
        }),
      );

      // Flatten in original request order so the model sees results correctly.
      const toolResponseParts: Part[] = toolResults.flat();
      currentMessages = [{ role: 'user', parts: toolResponseParts }];
    } else {
      finalText = turnText.trim();
      break;
    }
  }

  return finalText;
}

export function createAutopilotModelAdapters(config: Config): {
  callModel: (messages: ChatMessage[], system: string) => Promise<string>;
  callModelWithTools: (
    messages: ChatMessage[],
    system: string,
    yolo: boolean,
  ) => Promise<string>;
} {
  const callModel = async (
    messages: ChatMessage[],
    system: string,
  ): Promise<string> => {
    const geminiClient = config.getGeminiClient();
    const model = config.getModel();
    const contents: Content[] = messages.map((m) => ({
      role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      parts: [{ text: m.content }],
    }));

    const promptId =
      config.getSessionId() +
      '########autopilot-chat-' +
      Date.now().toString(16);

    const abortController = new AbortController();
    const response = await promptIdContext.run(promptId, () =>
      geminiClient.generateContent(
        contents,
        { systemInstruction: system },
        abortController.signal,
        model,
        promptId,
      ),
    );

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts?.length) {
      return '';
    }
    return parts.map((p) => ('text' in p && p.text ? p.text : '')).join('');
  };

  const callModelWithTools = async (
    messages: ChatMessage[],
    system: string,
    yolo: boolean,
  ): Promise<string> => {
    const promptId =
      config.getSessionId() +
      '########autopilot-task-' +
      Date.now().toString(16);

    const promptText = formatAutopilotMessages(messages, system);
    const previousMode = config.getApprovalMode();

    if (yolo) {
      config.setApprovalMode(ApprovalMode.YOLO);
    }

    try {
      const summary = await promptIdContext.run(promptId, () =>
        runAutopilotToolLoop(config, promptText, promptId),
      );
      return summary;
    } finally {
      config.setApprovalMode(previousMode);
    }
  };

  return { callModel, callModelWithTools };
}
