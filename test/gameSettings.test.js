import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_GAME_SETTINGS,
  loadGameSettings,
  normalizeGameSettings,
  saveGameSettings,
  toPointerSensitivity,
} from '../src/core/settings.js';

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

test('game settings normalize unsafe values and preserve known options', () => {
  assert.deepEqual(normalizeGameSettings({
    masterVolume: 1.5,
    musicVolume: 0.35,
    sfxVolume: -1,
    brightness: 0.82,
    fullscreen: true,
    mouseSensitivity: 0.1,
    vibration: false,
    subtitles: false,
    language: 'tr',
    unknown: 'ignored',
  }), {
    ...DEFAULT_GAME_SETTINGS,
    masterVolume: 1,
    musicVolume: 0.35,
    sfxVolume: 0,
    brightness: 0.82,
    fullscreen: true,
    mouseSensitivity: 0.25,
    vibration: false,
    subtitles: false,
    language: 'tr',
  });
});

test('game settings load and save from storage', () => {
  const storage = createMemoryStorage();
  const settings = normalizeGameSettings({ masterVolume: 0.4, sfxVolume: 0.2, fullscreen: true });

  saveGameSettings(settings, storage);

  assert.deepEqual(loadGameSettings(storage), settings);
});

test('game settings use system language only when no saved language exists', () => {
  const storage = createMemoryStorage();

  assert.equal(loadGameSettings(storage, { languages: ['tr-TR'] }).language, 'tr');

  saveGameSettings({ language: 'en' }, storage);

  assert.equal(loadGameSettings(storage, { languages: ['tr-TR'] }).language, 'en');
});

test('mouse sensitivity maps menu value to pointer movement scale', () => {
  assert.equal(toPointerSensitivity({ mouseSensitivity: 0.25 }), 0.0014);
  assert.equal(toPointerSensitivity({ mouseSensitivity: 1 }), 0.0038);
});
