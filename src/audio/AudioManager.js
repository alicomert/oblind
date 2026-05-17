import { Howl, Howler } from 'howler';
import { normalizeGameSettings } from '../core/settings.js';

export class AudioManager {
  constructor(settings = {}) {
    this.settings = normalizeGameSettings(settings);
    this.sounds = new Map();
    Howler.volume(this.settings.masterVolume);
    this.enabled = Boolean(globalThis.AudioContext || globalThis.webkitAudioContext);
  }

  preload(id, src, options = {}) {
    if (this.sounds.has(id)) return this.sounds.get(id);
    const sound = new Howl({
      src,
      loop: false,
      preload: true,
      volume: 0.7,
      ...options,
    });
    this.sounds.set(id, sound);
    return sound;
  }

  getChannelVolume(channel = 'sfx') {
    return channel === 'music' ? this.settings.musicVolume : this.settings.sfxVolume;
  }

  play(id, options = {}) {
    const sound = this.sounds.get(id);
    if (!sound) return null;
    const channelVolume = this.getChannelVolume(options.channel);
    if (!sound.playing() || options.force) {
      sound.volume(options.volume ?? channelVolume);
      return sound.play();
    }
    return null;
  }

  stop(id) {
    const sound = this.sounds.get(id);
    if (!sound) return;
    sound.stop();
  }

  setVolume(id, volume) {
    const sound = this.sounds.get(id);
    if (!sound) return;
    sound.volume(volume);
  }

  fadeOut(id, durationMs = 500) {
    const sound = this.sounds.get(id);
    if (!sound) return;
    const currentVolume = sound.volume();
    sound.fade(currentVolume, 0, durationMs);
    globalThis.setTimeout?.(() => {
      sound.stop();
      sound.volume(currentVolume);
    }, durationMs);
  }

  stopAll() {
    this.sounds.forEach((sound) => sound.stop());
  }

  setMaster(volume) {
    this.settings = normalizeGameSettings({
      ...this.settings,
      masterVolume: volume,
    });
    Howler.volume(this.settings.masterVolume);
  }

  setSettings(settings) {
    this.settings = normalizeGameSettings(settings);
    Howler.volume(this.settings.masterVolume);
  }

  destroy() {
    this.sounds.forEach((sound) => sound.unload());
    this.sounds.clear();
  }
}
