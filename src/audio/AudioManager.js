import { Howl, Howler } from 'howler';

export class AudioManager {
  constructor() {
    this.sounds = new Map();
    this.master = new Howl({
      src: [],
      volume: 0.5,
    });
    this.master.unload();
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

  play(id, options = {}) {
    const sound = this.sounds.get(id);
    if (!sound) return null;
    if (!sound.playing() || options.force) {
      sound.volume(options.volume ?? 1);
      return sound.play();
    }
    return sound.play();
  }

  stop(id) {
    const sound = this.sounds.get(id);
    if (!sound) return;
    sound.stop();
  }

  stopAll() {
    this.sounds.forEach((sound) => sound.stop());
  }

  setMaster(volume) {
    Howler.volume(volume);
  }

  destroy() {
    this.sounds.forEach((sound) => sound.unload());
    this.sounds.clear();
  }
}
