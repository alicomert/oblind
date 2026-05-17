import * as THREE from 'three';

const START_EXPERIENCE_CONFIG = Object.freeze({
  particleCount: 360,
  particleShape: 'soft-round',
  particleSizing: 'screen-space',
  particleDistribution: 'center-radial',
  particleSizePx: 5,
  particleOpacity: 0.22,
  driftSpeed: 0.006,
  entryDriftBoost: 0.01,
});

export function getStartExperienceConfig() {
  return START_EXPERIENCE_CONFIG;
}

export class StartExperience {
  constructor(parent, settings = {}) {
    this.parent = parent;
    this.settings = settings;
    this.config = getStartExperienceConfig();
    this.entryTransition = {
      active: false,
      startTime: 0,
      duration: 1,
      progress: 0,
    };
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 80);
    this.camera.position.set(0, 0.8, 7.5);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.id = 'oblind-start-experience';
    this.renderer.domElement.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:1',
      'pointer-events:none',
      'display:block',
    ].join(';');
    this.parent.appendChild(this.renderer.domElement);

    this.createScene();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    this.renderer.setAnimationLoop((time) => this.render(time));
  }

  createScene() {
    const ambient = new THREE.AmbientLight(0x23313a, 0.5);
    const lantern = new THREE.PointLight(0xf0b45f, 2.4, 12, 2.2);
    lantern.position.set(0, -1.25, 1.5);
    this.scene.add(ambient, lantern);
    this.lantern = lantern;

    this.createMistParticles();
    this.createLanternGlow();
    this.createVignettePlanes();
  }

  createMistParticles() {
    const positions = new Float32Array(this.config.particleCount * 3);
    for (let index = 0; index < this.config.particleCount; index += 1) {
      const offset = index * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.pow(Math.random(), 0.72);
      const jitterX = (Math.random() - 0.5) * 0.45;
      const jitterY = (Math.random() - 0.5) * 0.28;
      positions[offset] = Math.cos(angle) * radius * 8.4 + jitterX;
      positions[offset + 1] = Math.sin(angle) * radius * 3.8 + jitterY;
      positions[offset + 2] = -2 - Math.random() * 17;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x91a9b5,
      map: new THREE.CanvasTexture(this.createParticleCanvas()),
      size: this.config.particleSizePx,
      sizeAttenuation: false,
      transparent: true,
      opacity: this.config.particleOpacity,
      depthWrite: false,
      alphaTest: 0.01,
      blending: THREE.NormalBlending,
    });

    this.mist = new THREE.Points(geometry, material);
    this.scene.add(this.mist);
  }

  createParticleCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 30);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.34, 'rgba(225, 238, 245, 0.58)');
    gradient.addColorStop(0.68, 'rgba(175, 205, 220, 0.22)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(32, 32, 30, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = 'rgba(255, 255, 255, 0.20)';
    context.beginPath();
    context.ellipse(25, 24, 10, 7, -0.35, 0, Math.PI * 2);
    context.fill();
    return canvas;
  }

  createLanternGlow() {
    const texture = new THREE.CanvasTexture(this.createGlowCanvas());
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: 0xffc879,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.glow = new THREE.Sprite(material);
    this.glow.position.set(0, -1.25, 0.8);
    this.glow.scale.set(5.2, 2.6, 1);
    this.scene.add(this.glow);
  }

  createGlowCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255, 218, 148, 0.95)');
    gradient.addColorStop(0.22, 'rgba(255, 161, 78, 0.34)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  createVignettePlanes() {
    const material = new THREE.MeshBasicMaterial({
      color: 0x0b1116,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });

    this.shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(18, 8), material);
    this.shadowPlane.position.set(0, 1.8, -4);
    this.scene.add(this.shadowPlane);
  }

  render(time) {
    const elapsed = time * 0.001;
    const delta = this.clock.getDelta();
    const progress = this.getEntryProgress(time);
    const suspense = progress * progress * (3 - 2 * progress);
    const pulse = Math.sin(elapsed * 5.6) * 0.18 + Math.sin(elapsed * 11.2) * 0.08;

    this.camera.position.x = Math.sin(elapsed * 0.18) * (0.08 + suspense * 0.12);
    this.camera.position.y = 0.8 + Math.cos(elapsed * 0.22) * 0.04 - suspense * 0.12;
    this.camera.position.z = 7.5 - suspense * 1.15;
    this.lantern.intensity = 2.1 + pulse + suspense * 3.6;
    this.glow.material.opacity = 0.26 + Math.sin(elapsed * 4.8) * 0.05 + suspense * 0.32;
    this.glow.scale.set(5.2 + suspense * 2.8, 2.6 + suspense * 1.4, 1);
    this.mist.material.opacity = this.config.particleOpacity + suspense * 0.06;
    this.mist.material.size = this.config.particleSizePx + suspense * 1;
    this.mist.rotation.y += delta * (this.config.driftSpeed + suspense * this.config.entryDriftBoost);
    this.mist.rotation.x = Math.sin(elapsed * 0.12) * 0.018 + suspense * 0.026;
    this.renderer.render(this.scene, this.camera);
  }

  beginEntryTransition(durationMs = 2800) {
    this.entryTransition = {
      active: true,
      startTime: performance.now(),
      duration: Math.max(1, durationMs),
      progress: 0,
    };
  }

  getEntryProgress(time) {
    if (!this.entryTransition.active) return 0;
    const progress = Math.min(1, Math.max(0, (time - this.entryTransition.startTime) / this.entryTransition.duration));
    this.entryTransition.progress = progress;
    return progress;
  }

  applySettings(settings = {}) {
    this.settings = settings;
    const brightness = Number(settings.brightness ?? 0.55);
    this.renderer.toneMappingExposure = 0.75 + brightness * 0.65;
    if (this.glow) this.glow.material.opacity = 0.24 + brightness * 0.12;
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.setAnimationLoop(null);
    this.scene.traverse((object) => {
      object.geometry?.dispose?.();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose?.());
        } else {
          object.material.map?.dispose?.();
          object.material.dispose?.();
        }
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
