import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_LANGUAGE,
  detectSystemLanguage,
  getLanguageOptions,
  normalizeLanguage,
  t,
} from '../src/core/i18n.js';

test('i18n translates menu and settings text in English and Turkish', () => {
  assert.equal(DEFAULT_LANGUAGE, 'en');
  assert.equal(normalizeLanguage('tr'), 'tr');
  assert.equal(normalizeLanguage('de'), 'en');
  assert.equal(t('menu.newGame'), 'NEW GAME');
  assert.equal(t('menu.newGame', 'tr'), 'YENİ OYUN');
  assert.equal(t('settings.language'), 'LANGUAGE');
  assert.equal(t('settings.language', 'tr'), 'DİL');
  assert.equal(t('missing.key', 'tr'), 'missing.key');
});

test('i18n detects Turkish system language and falls back to English', () => {
  assert.equal(detectSystemLanguage({ languages: ['tr-TR', 'en-US'], language: 'en-US' }), 'tr');
  assert.equal(detectSystemLanguage({ languages: ['de-DE'], language: 'de-DE' }), 'en');
  assert.equal(detectSystemLanguage({ language: 'en-US' }), 'en');
  assert.equal(detectSystemLanguage(null), 'en');
});

test('i18n exposes language options localized for the current menu language', () => {
  assert.deepEqual(getLanguageOptions('en'), [
    { value: 'en', label: 'English' },
    { value: 'tr', label: 'Turkish' },
  ]);
  assert.deepEqual(getLanguageOptions('tr'), [
    { value: 'en', label: 'İngilizce' },
    { value: 'tr', label: 'Türkçe' },
  ]);
});
