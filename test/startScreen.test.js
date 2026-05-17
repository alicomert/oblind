import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as StartScreenModule from '../src/ui/StartScreen.js';

test('start screen menu uses a centered game-menu contract without duplicate logo text', () => {
  assert.equal(typeof StartScreenModule.getStartMenuConfig, 'function');

  const config = StartScreenModule.getStartMenuConfig();

  assert.equal(config.language, 'en');
  assert.deepEqual(
    config.actions.map((action) => action.label),
    ['NEW GAME', 'CONTINUE', 'SETTINGS', 'CREDITS'],
  );
  assert.equal(config.showInlineTitle, false);
  assert.equal(config.menuTop, 'calc(45vh + 8px)');
  assert.equal(config.menuAlign, 'center');
  assert.equal(config.usesThreeIntroScene, true);
  assert.equal(config.backgroundTreatment, 'natural');
  assert.deepEqual(config.menuMusic, {
    id: 'start-menu-bg',
    src: ['/audio/music/oblind-bg.mp3'],
    channel: 'music',
    loop: true,
    fadeInMs: 1200,
    fadeOutMs: 700,
  });
  assert.deepEqual(config.menuSounds, {
    hover: {
      id: 'menu-hover',
      src: ['/audio/sfx/ui/hover.mp3'],
      channel: 'sfx',
      loop: false,
    },
    click: {
      id: 'menu-click',
      src: ['/audio/sfx/ui/click.mp3'],
      channel: 'sfx',
      loop: false,
      playbackRate: 3,
    },
  });
  assert.deepEqual(config.screens, ['main', 'settings', 'credits']);
  assert.deepEqual(config.entryTransition, {
    durationMs: 2800,
    label: 'ENTERING...',
    finalFadeMs: 520,
  });
  assert.equal(config.actions.find((action) => action.command === 'start').entryTransition, true);
  assert.equal(config.actions.find((action) => action.command === 'continue').entryTransition, true);
});

test('start screen menu localizes the game-menu contract to Turkish', () => {
  const config = StartScreenModule.getStartMenuConfig('tr');

  assert.equal(config.language, 'tr');
  assert.deepEqual(
    config.actions.map((action) => action.label),
    ['YENİ OYUN', 'DEVAM ET', 'AYARLAR', 'JENERİK'],
  );
  assert.deepEqual(config.entryTransition, {
    durationMs: 2800,
    label: 'GİRİLİYOR...',
    finalFadeMs: 520,
  });
  assert.equal(config.settingsTitle, 'AYARLAR');
  assert.equal(config.backLabel, 'GERİ');
});

test('start screen exposes a game settings contract with audio, display, and control options', () => {
  const config = StartScreenModule.getStartMenuConfig();

  assert.deepEqual(
    config.settingsGroups.map((group) => group.title),
    ['AUDIO', 'DISPLAY', 'CONTROLS'],
  );
  assert.deepEqual(
    config.settingsGroups.flatMap((group) => group.controls.map((control) => control.key)),
    [
      'masterVolume',
      'musicVolume',
      'sfxVolume',
      'brightness',
      'fullscreen',
      'language',
      'mouseSensitivity',
      'vibration',
      'subtitles',
    ],
  );
  assert.deepEqual(
    config.settingsGroups
      .flatMap((group) => group.controls)
      .find((control) => control.key === 'language')
      .options,
    [
      { value: 'en', label: 'English' },
      { value: 'tr', label: 'Turkish' },
    ],
  );
});

test('start screen exposes controller navigation for every menu screen', () => {
  const config = StartScreenModule.getStartMenuConfig();

  assert.deepEqual(config.controller, {
    enabled: true,
    focusTreatment: 'controller-focus-ring',
    actions: ['up', 'down', 'left', 'right', 'confirm', 'back'],
    repeat: {
      initialDelayMs: 280,
      repeatMs: 110,
    },
  });
});

test('start screen maps keyboard arrows to menu actions and leaves tab native', () => {
  assert.equal(StartScreenModule.getKeyboardMenuAction('ArrowUp'), 'up');
  assert.equal(StartScreenModule.getKeyboardMenuAction('ArrowDown'), 'down');
  assert.equal(StartScreenModule.getKeyboardMenuAction('ArrowLeft'), 'left');
  assert.equal(StartScreenModule.getKeyboardMenuAction('ArrowRight'), 'right');
  assert.equal(StartScreenModule.getKeyboardMenuAction('Enter'), 'confirm');
  assert.equal(StartScreenModule.getKeyboardMenuAction(' '), 'confirm');
  assert.equal(StartScreenModule.getKeyboardMenuAction('Escape'), 'back');
  assert.equal(StartScreenModule.getKeyboardMenuAction('Tab'), null);
});

test('settings controls only play click sounds for discrete changes', () => {
  assert.equal(StartScreenModule.shouldPlaySettingClickSound({ type: 'toggle' }), true);
  assert.equal(StartScreenModule.shouldPlaySettingClickSound({ type: 'select' }), true);
  assert.equal(StartScreenModule.shouldPlaySettingClickSound({ type: 'range' }), false);
  assert.equal(StartScreenModule.shouldPlaySettingClickSound(null), false);
});

test('start menu music uses a browser audio element contract', async () => {
  const frameCallbacks = [];
  const events = new Map();
  const audio = {
    loop: false,
    volume: 0,
    playCalls: 0,
    pauseCalls: 0,
    currentTime: 12,
    play() {
      this.playCalls += 1;
      return Promise.resolve();
    },
    pause() {
      this.pauseCalls += 1;
    },
  };
  const target = {
    performance: {
      now: () => 0,
    },
    addEventListener(eventName, handler) {
      events.set(eventName, handler);
    },
    removeEventListener(eventName) {
      events.delete(eventName);
    },
    requestAnimationFrame(callback) {
      frameCallbacks.push(callback);
    },
  };

  const music = new StartScreenModule.StartMenuMusic({
    settings: { masterVolume: 0.5, musicVolume: 0.6 },
    target,
    audioFactory(src) {
      assert.equal(src, '/audio/music/oblind-bg.mp3');
      return audio;
    },
  });

  assert.equal(audio.loop, true);
  assert.equal(audio.volume, 0);
  music.start();
  assert.equal(audio.playCalls, 1);
  assert.equal(events.has('pointerdown'), true);
  await Promise.resolve();
  assert.equal(frameCallbacks.length, 1);
  frameCallbacks.shift()(1200);
  assert.equal(audio.volume, 0.3);

  music.setSettings({ masterVolume: 1, musicVolume: 0.25 });
  assert.equal(audio.volume, 0.25);
  music.stop({ fade: true });
  assert.equal(frameCallbacks.length, 1);
  frameCallbacks.shift()(1900);
  assert.equal(audio.pauseCalls, 1);
  assert.equal(audio.currentTime, 0);
  assert.equal(events.size, 0);
});

test('start menu sound effects restart browser audio elements', () => {
  const clips = new Map();
  function createAudio() {
    return {
      loop: true,
      volume: 0,
      playbackRate: 1,
      playCalls: 0,
      pauseCalls: 0,
      currentTime: 9,
      play() {
        this.playCalls += 1;
        return Promise.resolve();
      },
      pause() {
        this.pauseCalls += 1;
      },
    };
  }

  const sounds = new StartScreenModule.StartMenuSoundEffects({
    settings: { masterVolume: 0.5, sfxVolume: 0.8 },
    audioFactory(src) {
      const audio = createAudio();
      clips.set(src, audio);
      return audio;
    },
  });

  const hover = clips.get('/audio/sfx/ui/hover.mp3');
  const click = clips.get('/audio/sfx/ui/click.mp3');
  assert.ok(hover);
  assert.ok(click);
  assert.equal(hover.loop, false);
  assert.equal(click.loop, false);
  assert.equal(hover.volume, 0.4);
  assert.equal(click.volume, 0.4);
  assert.equal(hover.playbackRate, 1);
  assert.equal(click.playbackRate, 3);

  sounds.play('hover');
  assert.equal(hover.currentTime, 0);
  assert.equal(hover.playCalls, 1);
  sounds.play('click');
  assert.equal(click.currentTime, 0);
  assert.equal(click.playCalls, 1);

  sounds.setSettings({ masterVolume: 1, sfxVolume: 0.25 });
  assert.equal(hover.volume, 0.25);
  assert.equal(click.volume, 0.25);
  sounds.destroy();
  assert.equal(hover.pauseCalls, 1);
  assert.equal(click.pauseCalls, 1);
});

test('start screen controller helpers wrap focus and adjust setting controls', () => {
  assert.equal(StartScreenModule.getNextControllerFocusIndex(0, -1, 4), 3);
  assert.equal(StartScreenModule.getNextControllerFocusIndex(3, 1, 4), 0);
  assert.equal(StartScreenModule.getNextControllerFocusIndex(2, 1, 0), -1);

  assert.equal(
    StartScreenModule.getControllerAdjustedValue({ type: 'range', min: 0.25, max: 1, step: 0.05 }, 0.55, 1),
    0.6,
  );
  assert.equal(
    StartScreenModule.getControllerAdjustedValue({ type: 'range', min: 0.25, max: 1, step: 0.05 }, 0.25, -1),
    0.25,
  );
  assert.equal(
    StartScreenModule.getControllerAdjustedValue({ type: 'toggle' }, false, 1),
    true,
  );
  assert.equal(
    StartScreenModule.getControllerAdjustedValue({ type: 'toggle' }, true, -1),
    false,
  );
  assert.equal(
    StartScreenModule.getControllerAdjustedValue({
      type: 'select',
      options: [
        { value: 'en', label: 'English' },
        { value: 'tr', label: 'Turkish' },
      ],
    }, 'en', 1),
    'tr',
  );
});
