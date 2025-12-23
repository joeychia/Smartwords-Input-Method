import { HistoryItem, UserSettings } from '../types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants';

export const getHistory = (): HistoryItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveHistoryItem = (item: HistoryItem) => {
  const history = getHistory();
  // Keep only last 50 items
  const newHistory = [item, ...history].slice(0, 50);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
};

export const getSettings = (): UserSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: UserSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

/**
 * BRIDGE TO IOS
 * When running in the iOS App, we cannot just save to localStorage if we want the Keyboard to see it.
 * The Keyboard lives in a different sandbox. We must send the text to the Native Swift Host,
 * which will write it to the Shared App Group.
 */
export const savePendingTextForKeyboard = (text: string) => {
  // 1. Save locally just in case
  localStorage.setItem(STORAGE_KEYS.PENDING_TEXT, text);

  // 2. Check for iOS Native Bridge
  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.vimHandler) {
    console.log("[Bridge] Sending text to iOS Native Host");
    window.webkit.messageHandlers.vimHandler.postMessage({
      action: 'saveToAppGroup',
      text: text
    });
  } else {
    console.log("[Bridge] iOS Native Host not found (Dev Mode)");
  }
};

/**
 * Notify iOS Host about environment preference change
 */
export const setEnvironmentPreference = (pref: 'auto' | 'dev' | 'prod') => {
  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.vimHandler) {
    console.log("[Bridge] Updating environment preference to:", pref);
    window.webkit.messageHandlers.vimHandler.postMessage({
      action: 'setEnvironmentPreference',
      preference: pref
    });
  }
};