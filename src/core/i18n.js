export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = Object.freeze(['en', 'tr']);

const LANGUAGE_OPTIONS = Object.freeze([
  { value: 'en', labelKey: 'language.english' },
  { value: 'tr', labelKey: 'language.turkish' },
]);

const TRANSLATIONS = Object.freeze({
  en: Object.freeze({
    'aria.mainMenu': 'Main menu',
    'common.back': 'BACK',
    'credits.body': 'OBLIND - dark story prototype\nBuilt as a browser-based horror game experience.',
    'entry.entering': 'ENTERING...',
    'language.english': 'English',
    'language.turkish': 'Turkish',
    'menu.continue': 'CONTINUE',
    'menu.credits': 'CREDITS',
    'menu.newGame': 'NEW GAME',
    'menu.settings': 'SETTINGS',
    'settings.audio': 'AUDIO',
    'settings.brightness': 'BRIGHTNESS',
    'settings.controls': 'CONTROLS',
    'settings.display': 'DISPLAY',
    'settings.fullscreen': 'FULLSCREEN',
    'settings.language': 'LANGUAGE',
    'settings.master': 'MASTER',
    'settings.mouse': 'MOUSE',
    'settings.music': 'MUSIC',
    'settings.resetDefaults': 'RESET DEFAULTS',
    'settings.sfx': 'SFX',
    'settings.subtitles': 'SUBTITLES',
    'settings.title': 'SETTINGS',
    'settings.value.off': 'OFF',
    'settings.value.on': 'ON',
    'settings.vibration': 'VIBRATION',
  }),
  tr: Object.freeze({
    'aria.mainMenu': 'Ana menü',
    'common.back': 'GERİ',
    'credits.body': 'OBLIND - karanlık hikaye prototipi\nTarayıcı tabanlı korku oyunu deneyimi olarak geliştirildi.',
    'entry.entering': 'GİRİLİYOR...',
    'language.english': 'İngilizce',
    'language.turkish': 'Türkçe',
    'menu.continue': 'DEVAM ET',
    'menu.credits': 'JENERİK',
    'menu.newGame': 'YENİ OYUN',
    'menu.settings': 'AYARLAR',
    'settings.audio': 'SES',
    'settings.brightness': 'PARLAKLIK',
    'settings.controls': 'KONTROLLER',
    'settings.display': 'GÖRÜNTÜ',
    'settings.fullscreen': 'TAM EKRAN',
    'settings.language': 'DİL',
    'settings.master': 'GENEL',
    'settings.mouse': 'FARE',
    'settings.music': 'MÜZİK',
    'settings.resetDefaults': 'VARSAYILANLAR',
    'settings.sfx': 'SFX',
    'settings.subtitles': 'ALTYAZI',
    'settings.title': 'AYARLAR',
    'settings.value.off': 'KAPALI',
    'settings.value.on': 'AÇIK',
    'settings.vibration': 'TİTREŞİM',
  }),
});

function toSupportedLanguage(value) {
  if (typeof value !== 'string') return null;
  const code = value.trim().toLowerCase().split('-')[0];
  return SUPPORTED_LANGUAGES.includes(code) ? code : null;
}

export function normalizeLanguage(value) {
  return toSupportedLanguage(value) ?? DEFAULT_LANGUAGE;
}

export function detectSystemLanguage(source = globalThis.navigator) {
  if (!source || typeof source !== 'object') return DEFAULT_LANGUAGE;

  const candidates = [
    ...(Array.isArray(source.languages) ? source.languages : []),
    source.language,
    source.userLanguage,
  ];

  for (const candidate of candidates) {
    const language = toSupportedLanguage(candidate);
    if (language) return language;
  }

  return DEFAULT_LANGUAGE;
}

export function t(key, language = DEFAULT_LANGUAGE) {
  const normalized = normalizeLanguage(language);
  return TRANSLATIONS[normalized]?.[key] ?? TRANSLATIONS[DEFAULT_LANGUAGE]?.[key] ?? key;
}

export function getLanguageOptions(language = DEFAULT_LANGUAGE) {
  const normalized = normalizeLanguage(language);
  return LANGUAGE_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey, normalized),
  }));
}
