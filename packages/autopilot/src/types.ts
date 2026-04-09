import path from 'node:path';
import os from 'node:os';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ContextSpec {
  idea: string;
  goal: string;
  techStack: string[];
  constraints: string[];
  outputFormat: 'cli' | 'web' | 'api' | 'library' | 'script' | 'other';
  clarifications: Record<string, string>;
  /** Project root: agents must limit file and shell effects to this directory. */
  workspaceRoot?: string;
  /** Whether this is a new project (greenfield) or an existing one (brownfield). */
  projectMode?: 'greenfield' | 'brownfield';
  /** Brief summary of the existing codebase — populated for brownfield projects. */
  existingProjectSummary?: string;
}

export interface Skill {
  name: string;
  path: string;
  content: string;
  tags: string[];
  description: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  skill?: Skill;
  dependsOn: string[];
  type: 'scaffold' | 'implement' | 'test' | 'document' | 'ship';
  status: 'pending' | 'running' | 'done' | 'failed';
}

export interface TaskGraph {
  tasks: Task[];
  estimatedSteps: number;
}

export interface AutopilotSettings {
  skillsPath: string;
  maxTaskRetries: number;
  planPreviewSeconds: number;
  goTriggers: string[];
}

export const DEFAULT_SETTINGS: AutopilotSettings = {
  skillsPath: path.join(os.homedir(), '.qwen', 'skills'),
  maxTaskRetries: 2,
  planPreviewSeconds: 3,
  goTriggers: [
    'go',
    'start',
    'execute',
    'run it',
    "let's go",
    'do it',
    'proceed',
  ],
};

/**
 * Merges partial CLI/settings overrides with defaults. Explicit `undefined` and
 * empty `goTriggers` must not wipe defaults (callers often pass `undefined` per field).
 */
export function mergeAutopilotPartialSettings(
  partial: Partial<AutopilotSettings> = {},
): AutopilotSettings {
  return {
    skillsPath: partial.skillsPath ?? DEFAULT_SETTINGS.skillsPath,
    maxTaskRetries: partial.maxTaskRetries ?? DEFAULT_SETTINGS.maxTaskRetries,
    planPreviewSeconds:
      partial.planPreviewSeconds ?? DEFAULT_SETTINGS.planPreviewSeconds,
    goTriggers:
      partial.goTriggers && partial.goTriggers.length > 0
        ? partial.goTriggers
        : DEFAULT_SETTINGS.goTriggers,
  };
}
