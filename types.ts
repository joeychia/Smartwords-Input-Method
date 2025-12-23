export enum AppView {
  DICTATION = 'DICTATION',
  REWRITE = 'REWRITE',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS'
}

export interface RewriteVariant {
  id: string;
  label: string;
  text: string;
  description?: string;
}

export interface HistoryItem {
  id: string;
  original: string;
  selected: string;
  timestamp: number;
  tags: string[]; // e.g., 'concise', 'friendly'
  variants?: RewriteVariant[]; // Cache for viewing history later
}

export interface UserSettings {
  tone: 'natural' | 'formal' | 'casual';
  language: 'mixed' | 'en' | 'zh';
  autoStopSilence: boolean;
  geminiApiKey?: string;
  preferredEnvironment: 'auto' | 'dev' | 'prod';
}

export interface GeminResponseSchema {
  variants: RewriteVariant[];
}

// iOS Native Bridge Types
export interface WebKitMessageHandler {
  postMessage: (message: any) => void;
}

export interface WebKitMessageHandlers {
  vimHandler?: WebKitMessageHandler;
}

export interface WebKit {
  messageHandlers: WebKitMessageHandlers;
}

declare global {
  interface Window {
    webkit?: WebKit;
  }
}