import { AudioManager } from './AudioManager.js';
import * as THREE from 'three';

export class SpatialAudio {
  constructor(settings = {}) {
    this.manager = new AudioManager(settings);
    this.listener = new THREE.AudioListener();
    this.attachments = new Map();
  }

  attach(camera) {
    camera.add(this.listener);
    this.listener.setMasterVolume(0.3);
    return this.listener;
  }

  createAmbient(id, camera, { src, radius = 45, loop = true } = {}) {
    if (!src) return null;
    const sound = this.manager.preload(id, src, { loop });
    if (!sound) return null;
    const spatial = { id, camera, radius };
    this.attachments.set(id, spatial);
    this.played = this.manager.play(id, { force: true });
    return spatial;
  }

  stop(id) {
    this.manager.stop(id);
    this.attachments.delete(id);
  }

  destroy() {
    this.manager.destroy();
    this.attachments.clear();
  }
}
