import type { Config, ToolCallRequestInfo } from '@qwen-code/qwen-code-core';
import {
  ApprovalMode,
  executeToolCall,
  GeminiEventType,
  SendMessageType,
  promptIdContext,
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
 */
export async function runAutopilotToolLoop(
  config: Config,
  promptText: string,
  promptId: string,
): Promise<void> {
  const geminiClient = config.getGeminiClient();
  await geminiClient.startChat([]);

  const adapter = new JsonOutputAdapter(config);
  const abortController = new AbortController();

  const initialPartList: PartListUnion = [{ text: promptText }];
  const initialParts = normalizePartList(initialPartList);
  let currentMessages: Array<{ role: 'user'; parts: Part[] }> = [
    { role: 'user', parts: initialParts },
  ];

  let isFirstTurn = true;

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

    for await (const event of responseStream) {
      adapter.processEvent(event);
      if (event.type === GeminiEventType.ToolCallRequest) {
        toolCallRequests.push(event.value);
      }
    }

    adapter.finalizeAssistantMessage();

    if (toolCallRequests.length > 0) {
      const toolResponseParts: Part[] = [];

      for (const requestInfo of toolCallRequests) {
        const isAgentTool = requestInfo.name === 'agent';
        const { handler: outputUpdateHandler } = isAgentTool
          ? createAgentToolProgressHandler(config, requestInfo.callId, adapter)
          : createToolProgressHandler(requestInfo, adapter);

        // Keep YOLO across tools: some tools may change approval mode after run.
        config.setApprovalMode(ApprovalMode.YOLO);

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

        if (toolResponse.responseParts) {
          toolResponseParts.push(...toolResponse.responseParts);
        }
      }

      currentMessages = [{ role: 'user', parts: toolResponseParts }];
    } else {
      break;
    }
  }
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
      await promptIdContext.run(promptId, () =>
        runAutopilotToolLoop(config, promptText, promptId),
      );
    } finally {
      config.setApprovalMode(previousMode);
    }

    return '';
  };

  return { callModel, callModelWithTools };
}
