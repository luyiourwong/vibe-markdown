export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Settings {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export type Lang = 'en' | 'zh';
export type ViewMode = 'editor' | 'split' | 'preview';