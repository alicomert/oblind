import { BackdropLayer } from './BackdropLayer.js';
import { StartExperience } from './StartExperience.js';
import {
  DEFAULT_GAME_SETTINGS,
  GAME_SETTINGS_GROUPS,
  loadGameSettings,
  normalizeGameSettings,
  saveGameSettings,
} from '../core/settings.js';
import { getLanguageOptions, normalizeLanguage, t } from '../core/i18n.js';
import {
  ControllerActionRepeater,
  CONTROLLER_REPEAT,
  findGamepad,
  readGamepadState,
} from '../core/controller.js';

const START_MENU_MUSIC = Object.freeze({
  id: 'start-menu-bg',
  src: Object.freeze(['/audio/music/oblind-bg.mp3']),
  channel: 'music',
  loop: true,
  fadeInMs: 1200,
  fadeOutMs: 700,
});

const START_MENU_SOUNDS = Object.freeze({
  hover: Object.freeze({
    id: 'menu-hover',
    src: Object.freeze(['/audio/sfx/ui/hover.mp3']),
    channel: 'sfx',
    loop: false,
  }),
  click: Object.freeze({
    id: 'menu-click',
    src: Object.freeze(['/audio/sfx/ui/click.mp3']),
    channel: 'sfx',
    loop: false,
    playbackRate: 3,
  }),
});

const AUDIO_SETTING_KEYS = new Set(['masterVolume', 'musicVolume', 'sfxVolume']);

const KEYBOARD_MENU_ACTIONS = Object.freeze({
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'confirm',
  ' ': 'confirm',
  Escape: 'back',
});

export function getStartMenuMusicConfig() {
  return {
    ...START_MENU_MUSIC,
    src: [...START_MENU_MUSIC.src],
  };
}

export function getStartMenuSoundsConfig() {
  return Object.fromEntries(
    Object.entries(START_MENU_SOUNDS).map(([name, sound]) => [
      name,
      {
        ...sound,
        src: [...sound.src],
      },
    ]),
  );
}

export function getKeyboardMenuAction(key) {
  return KEYBOARD_MENU_ACTIONS[key] ?? null;
}

export function shouldPlaySettingClickSound(control) {
  return control?.type === 'toggle' || control?.type === 'select';
}

function createStartMenuAudio(src) {
  const AudioCtor = globalThis.Audio;
  return AudioCtor ? new AudioCtor(src) : null;
}

function getStartMenuVolume(settings = {}, channel = 'music') {
  const normalized = normalizeGameSettings(settings);
  const channelVolume = channel === 'music' ? normalized.musicVolume : normalized.sfxVolume;
  return Number((normalized.masterVolume * channelVolume).toFixed(2));
}

function getSoundEffectVolume(settings = {}, sound = {}) {
  const gain = Number(sound.gain ?? 1);
  const volume = getStartMenuVolume(settings, sound.channel) * (Number.isFinite(gain) ? gain : 1);
  return Number(Math.min(1, Math.max(0, volume)).toFixed(2));
}

function getSoundEffectPlaybackRate(sound = {}) {
  const playbackRate = Number(sound.playbackRate ?? 1);
  if (!Number.isFinite(playbackRate) || playbackRate <= 0) return 1;
  return playbackRate;
}

export function getNextControllerFocusIndex(currentIndex, direction, itemCount) {
  if (itemCount <= 0) return -1;
  const current = Number.isInteger(currentIndex) ? currentIndex : 0;
  return (current + direction + itemCount) % itemCount;
}

export function getControllerAdjustedValue(control, currentValue, direction) {
  if (control.type === 'toggle') return direction > 0;

  if (control.type === 'select') {
    const options = control.options ?? [];
    if (options.length === 0) return currentValue;
    const currentIndex = Math.max(0, options.findIndex((option) => option.value === currentValue));
    const nextIndex = getNextControllerFocusIndex(currentIndex, direction, options.length);
    return options[nextIndex]?.value ?? currentValue;
  }

  if (control.type === 'range') {
    const min = Number(control.min ?? 0);
    const max = Number(control.max ?? 1);
    const step = Number(control.step ?? 0.05);
    const current = Number(currentValue);
    const next = Math.min(max, Math.max(min, current + step * direction));
    return Number(next.toFixed(2));
  }

  return currentValue;
}

function localizeSettingsGroups(language) {
  return GAME_SETTINGS_GROUPS.map((group) => ({
    title: t(group.titleKey, language),
    controls: group.controls.map((control) => ({
      ...control,
      label: t(control.labelKey, language),
      options: control.type === 'select' ? getLanguageOptions(language) : control.options,
    })),
  }));
}

export function getStartMenuConfig(language = undefined) {
  const currentLanguage = normalizeLanguage(language);

  return {
    language: currentLanguage,
    showInlineTitle: false,
    menuTop: 'calc(45vh + 8px)',
    menuAlign: 'center',
    usesThreeIntroScene: true,
    backgroundTreatment: 'natural',
    menuMusic: getStartMenuMusicConfig(),
    menuSounds: getStartMenuSoundsConfig(),
    screens: ['main', 'settings', 'credits'],
    controller: {
      enabled: true,
      focusTreatment: 'controller-focus-ring',
      actions: ['up', 'down', 'left', 'right', 'confirm', 'back'],
      repeat: CONTROLLER_REPEAT,
    },
    ariaMainMenu: t('aria.mainMenu', currentLanguage),
    settingsTitle: t('settings.title', currentLanguage),
    creditsTitle: t('menu.credits', currentLanguage),
    creditsText: t('credits.body', currentLanguage),
    resetDefaultsLabel: t('settings.resetDefaults', currentLanguage),
    backLabel: t('common.back', currentLanguage),
    entryTransition: {
      durationMs: 2800,
      label: t('entry.entering', currentLanguage),
      finalFadeMs: 520,
    },
    actions: [
      { label: t('menu.newGame', currentLanguage), command: 'start', entryTransition: true },
      { label: t('menu.continue', currentLanguage), command: 'continue', disabled: true, entryTransition: true },
      { label: t('menu.settings', currentLanguage), command: 'settings' },
      { label: t('menu.credits', currentLanguage), command: 'credits' },
    ],
    settingsGroups: localizeSettingsGroups(currentLanguage),
  };
}

export class StartMenuMusic {
  constructor({
    config = getStartMenuMusicConfig(),
    settings = {},
    target = globalThis.window,
    audioFactory = createStartMenuAudio,
  } = {}) {
    this.config = config;
    this.settings = normalizeGameSettings(settings);
    this.target = target;
    this.audio = audioFactory?.(this.config.src[0]) ?? null;
    this.targetVolume = getStartMenuVolume(this.settings, this.config.channel);
    this.fadeFrame = null;
    this.playing = false;
    this.destroyed = false;
    this.unlockEvents = ['pointerdown', 'keydown', 'touchstart', 'gamepadconnected'];
    this.onUnlock = () => this.start();

    if (this.audio) {
      this.audio.loop = Boolean(this.config.loop);
      this.audio.preload = 'auto';
      this.audio.volume = 0;
    }
  }

  start() {
    if (this.destroyed || !this.audio || this.playing) return null;
    this.addUnlockListeners();
    this.targetVolume = getStartMenuVolume(this.settings, this.config.channel);
    this.audio.volume = 0;
    const result = this.audio.play?.() ?? null;
    this.playing = true;
    if (result?.then) {
      result
        .then(() => {
          this.removeUnlockListeners();
          this.fadeTo(this.targetVolume, this.config.fadeInMs);
        })
        .catch(() => {
          this.playing = false;
        });
    }
    if (!result?.then) this.fadeTo(this.targetVolume, this.config.fadeInMs);
    return result;
  }

  addUnlockListeners() {
    if (this.unlockListenersAttached || !this.target?.addEventListener) return;
    for (const eventName of this.unlockEvents) {
      this.target.addEventListener(eventName, this.onUnlock, { passive: true });
    }
    this.unlockListenersAttached = true;
  }

  removeUnlockListeners() {
    if (!this.unlockListenersAttached || !this.target?.removeEventListener) return;
    for (const eventName of this.unlockEvents) {
      this.target.removeEventListener(eventName, this.onUnlock);
    }
    this.unlockListenersAttached = false;
  }

  setSettings(settings = {}) {
    this.settings = normalizeGameSettings(settings);
    this.targetVolume = getStartMenuVolume(this.settings, this.config.channel);
    if (this.audio && this.playing) this.audio.volume = this.targetVolume;
  }

  stop({ fade = false } = {}) {
    this.removeUnlockListeners();
    if (!this.audio) return;
    if (fade && this.config.fadeOutMs > 0) {
      this.fadeTo(0, this.config.fadeOutMs, () => this.finishStop());
      return;
    }
    this.finishStop();
  }

  fadeTo(volume, durationMs = 0, onComplete = null) {
    if (!this.audio) return;
    this.cancelFade();
    const initialVolume = this.audio.volume;
    const targetVolume = Math.max(0, Math.min(1, volume));
    const duration = Math.max(1, durationMs);
    const rafTarget = this.target?.requestAnimationFrame ?? globalThis.requestAnimationFrame;
    const nowTarget = this.target?.performance ?? globalThis.performance;
    const startedAt = nowTarget?.now?.() ?? Date.now();

    const step = (timestamp = Date.now()) => {
      const elapsed = timestamp - startedAt;
      const progress = Math.min(1, elapsed / duration);
      this.audio.volume = Number((initialVolume + (targetVolume - initialVolume) * progress).toFixed(3));
      if (progress < 1) {
        this.fadeFrame = rafTarget?.(step) ?? null;
        return;
      }
      this.fadeFrame = null;
      this.audio.volume = targetVolume;
      onComplete?.();
    };

    this.fadeFrame = rafTarget?.(step) ?? null;
    if (!rafTarget) step(startedAt + duration);
  }

  cancelFade() {
    if (!this.fadeFrame) return;
    const cancelTarget = this.target?.cancelAnimationFrame ?? globalThis.cancelAnimationFrame;
    cancelTarget?.(this.fadeFrame);
    this.fadeFrame = null;
  }

  finishStop() {
    this.cancelFade();
    this.audio.pause?.();
    this.audio.currentTime = 0;
    this.audio.volume = this.targetVolume;
    this.playing = false;
  }

  destroy() {
    if (this.destroyed) return;
    this.stop();
    this.destroyed = true;
  }
}

export class StartMenuSoundEffects {
  constructor({
    config = getStartMenuSoundsConfig(),
    settings = {},
    audioFactory = createStartMenuAudio,
  } = {}) {
    this.config = config;
    this.settings = normalizeGameSettings(settings);
    this.clips = new Map();
    this.destroyed = false;

    for (const [name, sound] of Object.entries(this.config)) {
      const audio = audioFactory?.(sound.src[0]);
      if (!audio) continue;
      audio.loop = Boolean(sound.loop);
      audio.preload = 'auto';
      audio.volume = getSoundEffectVolume(this.settings, sound);
      audio.playbackRate = getSoundEffectPlaybackRate(sound);
      this.clips.set(name, { ...sound, audio });
    }
  }

  play(name) {
    if (this.destroyed) return null;
    const clip = this.clips.get(name);
    if (!clip) return null;

    clip.audio.volume = getSoundEffectVolume(this.settings, clip);
    clip.audio.playbackRate = getSoundEffectPlaybackRate(clip);
    try {
      clip.audio.currentTime = 0;
    } catch {
      // Some browsers reject seeking before enough metadata is loaded.
    }
    const result = clip.audio.play?.() ?? null;
    result?.catch?.(() => {});
    return result;
  }

  setSettings(settings = {}) {
    this.settings = normalizeGameSettings(settings);
    for (const clip of this.clips.values()) {
      clip.audio.volume = getSoundEffectVolume(this.settings, clip);
    }
  }

  destroy() {
    if (this.destroyed) return;
    for (const clip of this.clips.values()) {
      clip.audio.pause?.();
      try {
        clip.audio.currentTime = 0;
      } catch {
        // Some browsers reject seeking before enough metadata is loaded.
      }
    }
    this.clips.clear();
    this.destroyed = true;
  }
}

export class StartScreen {
  constructor({ root, onStart }) {
    this.root = root;
    this.onStart = onStart;
    this.activeScreen = 'main';
    this.settingsState = loadGameSettings();
    this.config = getStartMenuConfig(this.settingsState.language);
    this.settingInputs = new Map();
    this.settingValueElements = new Map();
    this.menuButtons = [];
    this.screenElements = new Map();
    this.controllerControls = new WeakMap();
    this.controllerRepeater = new ControllerActionRepeater(CONTROLLER_REPEAT);
    this.controllerGamepadIndex = -1;
    this.controllerFocusIndex = 0;
    this.controllerFocusedElement = null;

    this.backdrop = new BackdropLayer(root);
    this.backdrop.setBackground('hauntedCabin');
    this.backdrop.setOverlay('transparent');
    this.experience = new StartExperience(root, this.settingsState);
    this.menuMusic = new StartMenuMusic({
      config: this.config.menuMusic,
      settings: this.settingsState,
    });
    this.menuSounds = new StartMenuSoundEffects({
      config: this.config.menuSounds,
      settings: this.settingsState,
    });
    this.menuMusic.start();
    this.applyMenuBrightness();

    this.element = document.createElement('section');
    this.element.id = 'oblind-start-screen';
    this.element.setAttribute('aria-label', this.config.ariaMainMenu);
    this.element.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:4',
      'display:block',
      'box-sizing:border-box',
      'font-family:\"Trebuchet MS\",system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif',
      'color:#edf0ff',
      'background:transparent',
      'transition:opacity 260ms ease, transform 260ms ease',
    ].join(';');

    this.panel = document.createElement('div');
    this.panel.style.cssText = [
      'position:absolute',
      `top:${this.config.menuTop}`,
      'left:50%',
      'width:min(352px, calc(100vw - 44px))',
      'max-height:calc(100vh - 45vh - 28px)',
      'overflow:auto',
      'transform:translateX(-50%)',
      'display:grid',
      'gap:9px',
      'justify-items:stretch',
      'scrollbar-width:thin',
    ].join(';');

    this.transitionShade = document.createElement('div');
    this.transitionShade.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:3',
      'pointer-events:none',
      'opacity:0',
      'background:radial-gradient(circle at 50% 52%, rgba(41,49,55,0.18), rgba(0,0,0,0.9) 72%), rgba(0,0,0,0.18)',
      `transition:opacity ${this.config.entryTransition.durationMs}ms cubic-bezier(.18,.84,.18,1)`,
    ].join(';');

    this.buildScreens();
    this.element.append(this.transitionShade, this.panel);
    this.root.appendChild(this.element);
    this.showScreen('main');

    this.onKeyDown = (event) => {
      const action = getKeyboardMenuAction(event.key);
      if (!action) return;
      event.preventDefault();
      this.handleControllerAction(action);
    };
    this.onFocusIn = (event) => {
      const focusables = this.getActiveControllerFocusables();
      const nextIndex = focusables.indexOf(event.target);
      if (nextIndex < 0 || nextIndex === this.controllerFocusIndex) return;
      this.syncControllerFocus(nextIndex);
    };
    this.onGamepadConnected = (event) => {
      this.controllerGamepadIndex = event.gamepad.index;
    };
    this.pollController = (timestamp = 0) => {
      this.pollControllerInput(timestamp);
      this.controllerRaf = window.requestAnimationFrame?.(this.pollController);
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    this.element.addEventListener('focusin', this.onFocusIn);
    this.controllerRaf = window.requestAnimationFrame?.(this.pollController);
  }

  buildScreens() {
    this.settingInputs = new Map();
    this.settingValueElements = new Map();
    this.menuButtons = [];
    this.screenElements = new Map();
    this.controllerControls = new WeakMap();

    this.mainScreen = this.createScreen('main');
    this.settingsScreen = this.createScreen('settings');
    this.creditsScreen = this.createScreen('credits');

    this.buildMainScreen();
    this.buildSettingsScreen();
    this.buildCreditsScreen();

    this.panel.replaceChildren(this.mainScreen, this.settingsScreen, this.creditsScreen);
  }

  createScreen(name) {
    const screen = document.createElement('div');
    screen.dataset.screen = name;
    screen.style.cssText = [
      'display:none',
      'grid-template-columns:1fr',
      'gap:9px',
    ].join(';');
    this.screenElements.set(name, screen);
    return screen;
  }

  buildMainScreen() {
    const actions = document.createElement('div');
    actions.style.cssText = [
      'display:grid',
      'grid-template-columns:1fr',
      'gap:8px',
    ].join(';');

    const handlers = {
      start: (button) => this.enterGame(button, 'new'),
      continue: (button) => this.enterGame(button, 'continue'),
      settings: () => this.showScreen('settings'),
      credits: () => this.showScreen('credits'),
    };

    for (const action of this.config.actions) {
      actions.appendChild(this.createButton(action, handlers[action.command]));
    }

    this.mainScreen.appendChild(actions);
  }

  buildSettingsScreen() {
    this.settingsScreen.appendChild(this.createScreenTitle(this.config.settingsTitle));

    const settingsList = document.createElement('div');
    settingsList.style.cssText = [
      'display:grid',
      'gap:10px',
      'padding:2px 0',
    ].join(';');

    for (const group of this.config.settingsGroups) {
      settingsList.appendChild(this.createSettingsGroup(group));
    }

    this.settingsScreen.append(
      settingsList,
      this.createButton({ label: this.config.resetDefaultsLabel, command: 'reset', quiet: true }, () => this.resetSettings()),
      this.createButton({ label: this.config.backLabel, command: 'back', quiet: true }, () => this.showScreen('main')),
    );
  }

  buildCreditsScreen() {
    this.creditsScreen.append(
      this.createScreenTitle(this.config.creditsTitle),
      this.createTextBlock(this.config.creditsText),
      this.createButton({ label: this.config.backLabel, command: 'back', quiet: true }, () => this.showScreen('main')),
    );
  }

  createScreenTitle(text) {
    const title = document.createElement('div');
    title.textContent = text;
    title.style.cssText = [
      'height:34px',
      'display:grid',
      'place-items:center',
      'border:1px solid rgba(210,220,235,0.18)',
      'background:rgba(2,5,8,0.32)',
      'font:700 12px/1 \"Trebuchet MS\",system-ui,sans-serif',
      'color:rgba(238,242,248,0.78)',
      'text-align:center',
    ].join(';');
    return title;
  }

  createTextBlock(text) {
    const block = document.createElement('div');
    block.textContent = text;
    block.style.cssText = [
      'white-space:pre-line',
      'min-height:80px',
      'display:grid',
      'place-items:center',
      'padding:14px',
      'border:1px solid rgba(210,220,235,0.12)',
      'background:rgba(2,5,8,0.30)',
      'font:700 11px/1.55 \"Trebuchet MS\",system-ui,sans-serif',
      'color:rgba(226,232,245,0.62)',
      'text-align:center',
      'text-shadow:0 6px 18px rgba(0,0,0,0.95)',
    ].join(';');
    return block;
  }

  createSettingsGroup(group) {
    const section = document.createElement('section');
    section.style.cssText = [
      'display:grid',
      'gap:7px',
      'padding:8px 10px 10px',
      'border:1px solid rgba(210,220,235,0.12)',
      'background:rgba(2,5,8,0.34)',
      'box-shadow:inset 0 0 22px rgba(170,200,230,0.02)',
    ].join(';');

    const title = document.createElement('div');
    title.textContent = group.title;
    title.style.cssText = [
      'font:700 10px/1 \"Trebuchet MS\",system-ui,sans-serif',
      'color:rgba(226,232,245,0.58)',
      'text-align:center',
      'letter-spacing:0',
    ].join(';');
    section.appendChild(title);

    for (const control of group.controls) {
      section.appendChild(this.createSettingControl(control));
    }

    return section;
  }

  createSettingControl(control) {
    const row = document.createElement('label');
    row.style.cssText = [
      'min-height:28px',
      'display:grid',
      'grid-template-columns:84px 1fr 40px',
      'align-items:center',
      'gap:8px',
      'font:700 10px/1 \"Trebuchet MS\",system-ui,sans-serif',
      'color:rgba(238,242,248,0.74)',
    ].join(';');

    const label = document.createElement('span');
    label.textContent = control.label;

    const value = document.createElement('span');
    value.style.cssText = [
      'text-align:right',
      'font-variant-numeric:tabular-nums',
      'color:rgba(226,232,245,0.54)',
    ].join(';');
    this.settingValueElements.set(control.key, value);

    if (control.type === 'toggle') {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = Boolean(this.settingsState[control.key]);
      input.style.cssText = [
        'justify-self:center',
        'width:16px',
        'height:16px',
        'accent-color:#d8e4ed',
      ].join(';');
      input.addEventListener('change', () => {
        if (shouldPlaySettingClickSound(control)) this.playClickSound();
        this.updateSetting(control.key, input.checked);
      });
      this.settingInputs.set(control.key, input);
      this.controllerControls.set(input, control);
      input.dataset.controllerFocus = 'true';
      row.append(label, input, value);
      this.renderSettingValue(control.key);
      return row;
    }

    if (control.type === 'select') {
      const input = document.createElement('select');
      input.style.cssText = [
        'width:100%',
        'height:24px',
        'border:1px solid rgba(210,220,235,0.22)',
        'border-radius:2px',
        'background:rgba(6,9,12,0.62)',
        'color:rgba(238,242,248,0.84)',
        'font:700 10px/1 \"Trebuchet MS\",system-ui,sans-serif',
        'text-transform:uppercase',
      ].join(';');

      for (const option of control.options ?? []) {
        const element = document.createElement('option');
        element.value = option.value;
        element.textContent = option.label;
        input.appendChild(element);
      }

      input.value = String(this.settingsState[control.key]);
      input.addEventListener('change', () => {
        if (shouldPlaySettingClickSound(control)) this.playClickSound();
        this.updateSetting(control.key, input.value);
      });
      this.settingInputs.set(control.key, input);
      this.controllerControls.set(input, control);
      input.dataset.controllerFocus = 'true';
      row.append(label, input, value);
      this.renderSettingValue(control.key);
      return row;
    }

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(control.min);
    input.max = String(control.max);
    input.step = String(control.step);
    input.value = String(this.settingsState[control.key]);
    input.style.cssText = [
      'width:100%',
      'accent-color:#d8e4ed',
    ].join(';');
    input.addEventListener('input', () => this.updateSetting(control.key, Number(input.value)));
    this.settingInputs.set(control.key, input);
    this.controllerControls.set(input, control);
    input.dataset.controllerFocus = 'true';
    row.append(label, input, value);
    this.renderSettingValue(control.key);
    return row;
  }

  createButton(action, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    button.dataset.controllerFocus = 'true';
    button.disabled = Boolean(action.disabled);
    if (action.disabled) button.setAttribute('aria-disabled', 'true');
    button.style.cssText = [
      `height:${action.quiet ? '32px' : '38px'}`,
      'width:100%',
      'border:1px solid rgba(210,220,235,0.25)',
      'border-radius:2px',
      `font:700 ${action.quiet ? '11px' : '12px'}/1 \"Trebuchet MS\",system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif`,
      'letter-spacing:0',
      `color:${action.quiet ? 'rgba(226,232,245,0.66)' : 'rgba(238,242,248,0.86)'}`,
      'background:linear-gradient(90deg, rgba(6,9,12,0.5), rgba(22,27,31,0.34), rgba(6,9,12,0.5))',
      'box-shadow:0 12px 24px rgba(0,0,0,0.28), inset 0 0 20px rgba(180,205,230,0.025)',
      `cursor:${action.disabled ? 'default' : 'pointer'}`,
      'text-align:center',
      'padding:0 16px',
      'text-transform:uppercase',
      'transition:background 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease, opacity 160ms ease',
    ].join(';');

    if (action.command === 'start') {
      button.style.borderColor = 'rgba(226,232,245,0.42)';
      button.style.color = 'rgba(255,255,255,0.95)';
    }

    if (action.disabled) {
      button.style.opacity = '0.38';
    }

    button.addEventListener('mouseenter', () => {
      if (action.disabled) return;
      this.playHoverSound();
      button.style.transform = 'translateY(-1px)';
      button.style.borderColor = 'rgba(238,242,248,0.68)';
      button.style.color = '#ffffff';
      button.style.background = 'linear-gradient(90deg, rgba(34,43,48,0.58), rgba(62,69,72,0.42), rgba(34,43,48,0.58))';
    });
    button.addEventListener('mouseleave', () => {
      if (action.disabled) return;
      button.style.transform = 'translateY(0)';
      button.style.borderColor = action.command === 'start' ? 'rgba(226,232,245,0.42)' : 'rgba(210,220,235,0.25)';
      button.style.color = action.command === 'start' ? 'rgba(255,255,255,0.95)' : action.quiet ? 'rgba(226,232,245,0.66)' : 'rgba(238,242,248,0.86)';
      button.style.background = 'linear-gradient(90deg, rgba(6,9,12,0.5), rgba(22,27,31,0.34), rgba(6,9,12,0.5))';
    });
    button.addEventListener('click', () => {
      if (action.disabled) return;
      this.playClickSound();
      onClick?.(button);
    });

    this.menuButtons.push(button);

    return button;
  }

  showScreen(name) {
    this.activeScreen = name;
    for (const [screenName, element] of this.screenElements) {
      element.style.display = screenName === name ? 'grid' : 'none';
    }
    this.panel.style.top = name === 'main' ? this.config.menuTop : 'calc(34vh + 8px)';
    this.panel.style.maxHeight = name === 'main' ? 'calc(100vh - 45vh - 28px)' : 'calc(100vh - 34vh - 28px)';
    this.syncControllerFocus(0);
  }

  getActiveControllerFocusables() {
    const screen = this.screenElements.get(this.activeScreen);
    if (!screen) return [];

    return [...screen.querySelectorAll('[data-controller-focus="true"]')]
      .filter((element) => !element.disabled && element.getAttribute('aria-disabled') !== 'true');
  }

  clearControllerFocus() {
    if (!this.controllerFocusedElement) return;
    this.controllerFocusedElement.removeAttribute('data-controller-focused');
    this.controllerFocusedElement.style.outline = '';
    this.controllerFocusedElement.style.outlineOffset = '';
    this.controllerFocusedElement = null;
  }

  syncControllerFocus(index = this.controllerFocusIndex, { playSound = false } = {}) {
    const focusables = this.getActiveControllerFocusables();
    if (focusables.length === 0) {
      this.controllerFocusIndex = -1;
      this.clearControllerFocus();
      return;
    }

    const nextIndex = Math.min(focusables.length - 1, Math.max(0, index));
    const element = focusables[nextIndex];
    this.clearControllerFocus();
    this.controllerFocusIndex = nextIndex;
    this.controllerFocusedElement = element;
    element.dataset.controllerFocused = 'true';
    element.style.outline = '1px solid rgba(238,242,248,0.86)';
    element.style.outlineOffset = '3px';
    element.focus?.({ preventScroll: true });
    element.scrollIntoView?.({ block: 'nearest' });
    if (playSound) this.playHoverSound();
  }

  moveControllerFocus(direction) {
    const focusables = this.getActiveControllerFocusables();
    const nextIndex = getNextControllerFocusIndex(this.controllerFocusIndex, direction, focusables.length);
    if (nextIndex < 0) return;
    this.syncControllerFocus(nextIndex, { playSound: true });
  }

  playHoverSound() {
    if (this.started) return;
    this.menuSounds.play('hover');
  }

  playClickSound() {
    if (this.started) return;
    this.menuSounds.play('click');
  }

  adjustFocusedControl(direction) {
    const element = this.controllerFocusedElement;
    const control = element ? this.controllerControls.get(element) : null;
    if (!control) return false;

    const nextValue = getControllerAdjustedValue(control, this.settingsState[control.key], direction);
    if (nextValue === this.settingsState[control.key]) return true;

    if (element.type === 'checkbox') element.checked = Boolean(nextValue);
    else element.value = String(nextValue);
    this.updateSetting(control.key, nextValue);
    return true;
  }

  handleControllerAction(action) {
    if (this.started) return;

    if (action === 'up') {
      this.moveControllerFocus(-1);
      return;
    }

    if (action === 'down') {
      this.moveControllerFocus(1);
      return;
    }

    if (action === 'left') {
      this.adjustFocusedControl(-1);
      return;
    }

    if (action === 'right') {
      this.adjustFocusedControl(1);
      return;
    }

    if (action === 'back') {
      if (this.activeScreen !== 'main') this.showScreen('main');
      return;
    }

    if (action === 'confirm') {
      const focusables = this.getActiveControllerFocusables();
      const element = this.controllerFocusedElement ?? focusables[0];
      if (!element || element.disabled) return;
      element.click?.();
    }
  }

  pollControllerInput(timestamp = 0) {
    const gamepads = navigator.getGamepads?.() ?? [];
    const gamepad = findGamepad(gamepads, this.controllerGamepadIndex);

    if (!gamepad) {
      this.controllerGamepadIndex = -1;
      this.controllerRepeater.next({}, timestamp);
      return;
    }

    const state = readGamepadState(gamepad);
    this.controllerGamepadIndex = state.index;
    const actions = this.controllerRepeater.next(state.actions, timestamp);
    for (const action of actions) this.handleControllerAction(action);
  }

  enterGame(sourceButton, mode = 'new') {
    if (this.started) return;
    this.started = true;
    const settings = saveGameSettings(this.settingsState);
    const transition = this.config.entryTransition;

    this.activeEntryMode = mode;
    this.menuMusic.stop({ fade: true });
    this.panel.style.pointerEvents = 'none';
    this.panel.style.transition = `opacity ${transition.durationMs}ms ease, transform ${transition.durationMs}ms cubic-bezier(.18,.84,.18,1), filter ${transition.durationMs}ms ease`;
    this.panel.style.opacity = '0.18';
    this.panel.style.transform = 'translateX(-50%) translateY(34px) scale(0.96)';
    this.panel.style.filter = 'blur(1.5px)';
    this.transitionShade.style.opacity = '1';
    this.element.dataset.entering = mode;
    if (sourceButton) sourceButton.textContent = transition.label;

    for (const button of this.menuButtons) {
      button.disabled = true;
      button.style.cursor = 'default';
      if (!sourceButton || button !== sourceButton) button.style.opacity = '0.18';
    }

    this.experience.beginEntryTransition(transition.durationMs);

    window.setTimeout(() => {
      this.element.style.transition = `opacity ${transition.finalFadeMs}ms ease, transform ${transition.finalFadeMs}ms ease`;
      this.element.style.opacity = '0';
      this.element.style.transform = 'scale(1.015)';
    }, Math.max(0, transition.durationMs - transition.finalFadeMs));

    window.setTimeout(() => {
      this.destroy();
      this.onStart?.(settings);
    }, transition.durationMs);
  }

  startGame() {
    this.enterGame(null, 'new');
  }

  toggleFullscreen() {
    this.updateSetting('fullscreen', !document.fullscreenElement);
  }

  updateSetting(key, value) {
    this.settingsState = saveGameSettings({
      ...this.settingsState,
      [key]: value,
    });
    if (key === 'language') {
      this.refreshLanguage();
      return;
    }

    this.renderSettingValue(key);
    if (AUDIO_SETTING_KEYS.has(key)) {
      this.menuMusic.setSettings(this.settingsState);
      this.menuSounds.setSettings(this.settingsState);
    }
    if (key === 'fullscreen') this.setFullscreen(this.settingsState.fullscreen);
    if (key === 'brightness') this.applyMenuBrightness();
  }

  resetSettings() {
    this.settingsState = saveGameSettings(DEFAULT_GAME_SETTINGS);
    for (const [key, input] of this.settingInputs) {
      const value = this.settingsState[key];
      if (input.type === 'checkbox') input.checked = Boolean(value);
      else input.value = String(value);
      this.renderSettingValue(key);
    }
    this.refreshLanguage();
    this.setFullscreen(this.settingsState.fullscreen);
    this.applyMenuBrightness();
    this.menuMusic.setSettings(this.settingsState);
    this.menuSounds.setSettings(this.settingsState);
  }

  renderSettingValue(key) {
    const element = this.settingValueElements.get(key);
    if (!element) return;

    const value = this.settingsState[key];
    if (typeof value === 'boolean') {
      element.textContent = value ? t('settings.value.on', this.settingsState.language) : t('settings.value.off', this.settingsState.language);
      return;
    }

    if (key === 'language') {
      element.textContent = String(value).toUpperCase();
      return;
    }

    element.textContent = `${Math.round(value * 100)}`;
  }

  refreshLanguage() {
    const activeScreen = this.activeScreen;
    this.config = getStartMenuConfig(this.settingsState.language);
    this.element.setAttribute('aria-label', this.config.ariaMainMenu);
    this.transitionShade.style.transition = `opacity ${this.config.entryTransition.durationMs}ms cubic-bezier(.18,.84,.18,1)`;
    this.buildScreens();
    this.showScreen(activeScreen);
  }

  applyMenuBrightness() {
    const normalized = normalizeGameSettings(this.settingsState);
    const brightness = 0.88 + normalized.brightness * 0.24;
    this.backdrop.image.style.filter = `saturate(1) contrast(1.02) brightness(${brightness.toFixed(2)})`;
    this.experience?.applySettings(normalized);
  }

  setFullscreen(enabled) {
    if (enabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      return;
    }

    if (!enabled && document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('gamepadconnected', this.onGamepadConnected);
    this.element.removeEventListener('focusin', this.onFocusIn);
    if (this.controllerRaf) window.cancelAnimationFrame?.(this.controllerRaf);
    this.element.remove();
    this.menuMusic.destroy();
    this.menuSounds.destroy();
    this.experience.destroy();
    this.backdrop.destroy();
  }
}
