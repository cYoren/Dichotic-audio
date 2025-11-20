
import type { SessionLog } from "./reporting";

export interface AppSettings {
  mode: 'user' | 'clinical';
  userModeType: 'audio' | 'number' | 'dat' | 'dashboard';
  leftVolume: number;
  rightVolume: number;
  noiseVolume: number;
  masterVolume: number;
  imbalance: number;
  noiseType: 'none' | 'white' | 'pink' | 'file';
  calibration?: {
      leftThreshold: number;
      rightThreshold: number;
      centerBalance: number; // -1 to 1
  }
}

const STORAGE_KEY = 'dichotic_settings_v1';
const SESSIONS_KEY = 'dichotic_sessions_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  mode: 'user',
  userModeType: 'audio',
  leftVolume: 1,
  rightVolume: 1,
  noiseVolume: 0,
  masterVolume: 1,
  imbalance: 0,
  noiseType: 'none'
};

export function getSettings(): AppSettings {
  // 1. Check URL Params
  const params = new URLSearchParams(window.location.search);
  const urlSettings: Partial<AppSettings> = {};

  if (params.has('mode')) urlSettings.mode = params.get('mode') as any;
  if (params.has('type')) urlSettings.userModeType = params.get('type') as any;
  if (params.has('imbalance')) urlSettings.imbalance = parseFloat(params.get('imbalance')!);
  if (params.has('noise')) urlSettings.noiseType = params.get('noise') as any;
  if (params.has('vol')) urlSettings.masterVolume = parseFloat(params.get('vol')!);

  // If URL has significant settings, use them over local storage
  if (Object.keys(urlSettings).length > 0) {
    return { ...DEFAULT_SETTINGS, ...urlSettings };
  }

  // 2. Check Local Storage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to parse settings', e);
  }

  // 3. Default
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings', e);
  }
}

export function getSessions(): SessionLog[] {
    try {
        const saved = localStorage.getItem(SESSIONS_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Failed to load sessions', e);
    }
    return [];
}

export function saveSession(session: SessionLog) {
    try {
        const sessions = getSessions();
        sessions.push(session);
        // Limit to last 1000 sessions to prevent storage overflow
        if (sessions.length > 1000) sessions.shift();
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.warn('Failed to save session', e);
    }
}

export function generateShareUrl(settings: AppSettings): string {
  const url = new URL(window.location.href);
  url.searchParams.set('mode', settings.mode);
  url.searchParams.set('type', settings.userModeType);
  url.searchParams.set('imbalance', settings.imbalance.toString());
  url.searchParams.set('noise', settings.noiseType);
  url.searchParams.set('vol', settings.masterVolume.toString());
  return url.toString();
}

