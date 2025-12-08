import { UserSettings } from './types';

export const APP_NAME = "VoiceFlow";

export const DEFAULT_SETTINGS: UserSettings = {
  tone: 'natural',
  language: 'mixed',
  autoStopSilence: true,
};

export const MOCK_CONTEXT_LIMIT = 10;

// LocalStorage Keys (Simulating App Group)
export const STORAGE_KEYS = {
  HISTORY: 'vim_history',
  SETTINGS: 'vim_settings',
  PENDING_TEXT: 'vim_pending_text' // Key shared with "Keyboard"
};