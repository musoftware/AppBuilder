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
