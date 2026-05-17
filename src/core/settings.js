import { DEFAULT_LANGUAGE, detectSystemLanguage, normalizeLanguage } from './i18n.js';

export const SETTINGS_STORAGE_KEY = 'oblind.settings';

export const DEFAULT_GAME_SETTINGS = Object.freeze({
  masterVolume: 0.8,
  musicVolume: 0.6,
  sfxVolume: 0.75,
  brightness: 0.55,
  fullscreen: false,
  language: DEFAULT_LANGUAGE,
  mouseSensitivity: 0.55,
  vibration: true,
  subtitles: true,
});

export const GAME_SETTINGS_GROUPS = Object.freeze([
  {
    titleKey: 'settings.audio',
    controls: [
      { key: 'masterVolume', labelKey: 'settings.master', type: 'range', min: 0, max: 1, step: 0.05 },
      { key: 'musicVolume', labelKey: 'settings.music', type: 'range', min: 0, max: 1, step: 0.05 },
      { key: 'sfxVolume', labelKey: 'settings.sfx', type: 'range', min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    titleKey: 'settings.display',
    controls: [
      { key: 'brightness', labelKey: 'settings.brightness', type: 'range', min: 0.25, max: 1, step: 0.05 },
      { key: 'fullscreen', labelKey: 'settings.fullscreen', type: 'toggle' },
      { key: 'language', labelKey: 'settings.language', type: 'select' },
    ],
  },
  {
    titleKey: 'settings.controls',
    controls: [
      { key: 'mouseSensitivity', labelKey: 'settings.mouse', type: 'range', min: 0.25, max: 1, step: 0.05 },
      { key: 'vibration', labelKey: 'settings.vibration', type: 'toggle' },
      { key: 'subtitles', labelKey: 'settings.subtitles', type: 'toggle' },
    ],
  },
]);

const NUMBER_LIMITS = {
  masterVolume: [0, 1],
  musicVolume: [0, 1],
  sfxVolume: [0, 1],
  brightness: [0.25, 1],
  mouseSensitivity: [0.25, 1],
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeNumber(key, value) {
  const [min, max] = NUMBER_LIMITS[key];
  const numeric = Number(value);
  const fallback = DEFAULT_GAME_SETTINGS[key];
  if (!Number.isFinite(numeric)) return fallback;
  return Number(clamp(numeric, min, max).toFixed(2));
}

function normalizeBoolean(key, value) {
  if (typeof value === 'boolean') return value;
  return DEFAULT_GAME_SETTINGS[key];
}

export function normalizeGameSettings(value = {}) {
  const source = value && typeof value === 'object' ? value : {};

  return {
    masterVolume: normalizeNumber('masterVolume', source.masterVolume),
    musicVolume: normalizeNumber('musicVolume', source.musicVolume),
    sfxVolume: normalizeNumber('sfxVolume', source.sfxVolume),
    brightness: normalizeNumber('brightness', source.brightness),
    fullscreen: normalizeBoolean('fullscreen', source.fullscreen),
    language: normalizeLanguage(source.language),
    mouseSensitivity: normalizeNumber('mouseSensitivity', source.mouseSensitivity),
    vibration: normalizeBoolean('vibration', source.vibration),
    subtitles: normalizeBoolean('subtitles', source.subtitles),
  };
}

export function loadGameSettings(storage = globalThis.localStorage, languageSource = globalThis.navigator) {
  try {
    const raw = storage?.getItem?.(SETTINGS_STORAGE_KEY);
    if (raw) return normalizeGameSettings(JSON.parse(raw));
    return normalizeGameSettings({ language: detectSystemLanguage(languageSource) });
  } catch {
    return normalizeGameSettings({ language: detectSystemLanguage(languageSource) });
  }
}

export function saveGameSettings(settings, storage = globalThis.localStorage) {
  const normalized = normalizeGameSettings(settings);
  try {
    storage?.setItem?.(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Some browsers disable storage in restricted contexts. The in-memory state still works.
  }
  return normalized;
}

export function toPointerSensitivity(settings) {
  const normalized = normalizeGameSettings(settings);
  return Number((0.0006 + normalized.mouseSensitivity * 0.0032).toFixed(4));
}

export function toExposure(settings) {
  const normalized = normalizeGameSettings(settings);
  return Number((0.72 + normalized.brightness * 0.72).toFixed(2));
}
