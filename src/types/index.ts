export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export interface Settings {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export type Lang = 'en' | 'zh';
export type ViewMode = 'editor' | 'split' | 'preview';
export interface HighlightRange {
  start: number;
  end: number;
}