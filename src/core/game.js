import * as THREE from 'three';
import { InputController } from './input.js';
import { createScene, buildRoomGeometry, positionCameraFromMovement, keepWithinRoom } from './scene.js';
import { createRoomManager } from '../rooms/RoomManager.js';
import { StoryManager } from '../story/StoryManager.js';
import { HUD } from '../ui/HUD.js';
import { Minimap } from '../ui/Minimap.js';
import { WavePulse } from '../ui/WavePulse.js';
import { HeartRate } from '../mechanics/HeartRate.js';
import { CrisisSystem } from '../mechanics/CrisisSystem.js';
import { EchoLocation } from '../mechanics/EchoLocation.js';
import { MemoryFragments } from '../mechanics/MemoryFragments.js';
import { STORY_FLOW } from '../story/StoryManager.js';
import { getItemAsset } from '../assets/imageLibrary.js';
import { normalizeGameSettings, toExposure, toPointerSensitivity } from './settings.js';

const HUD_TICK_MS = 90;

export function attachControlRequest(element, input) {
  const onPointerDown = () => input.requestControl();
  element.addEventListener('pointerdown', onPointerDown);
  return () => element.removeEventListener('pointerdown', onPointerDown);
}

export class Game {
  constructor({ root, settings } = {}) {
    this.root = root;
    this.settings = normalizeGameSettings(settings);
    this.input = new InputController({
      sensitivity: toPointerSensitivity(this.settings),
      vibrationEnabled: this.settings.vibration,
    });
    this.world = createScene();
    this.roomManager = createRoomManager();
    this.story = new StoryManager(STORY_FLOW);
    this.hud = new HUD(this.world.overlays.prompt, this.world.overlays.hud);
    this.map = new Minimap(this.root);
    this.wave = new WavePulse(this.root);
    this.heart = new HeartRate();
    this.crisis = new CrisisSystem({ onPulse: () => this.input.vibrate() });
    this.echo = new EchoLocation();
    this.memory = new MemoryFragments();

    this.playerYawPitch = new THREE.Euler(0, Math.PI, 0, 'YXZ');
    this.clock = new THREE.Clock();
    this.currentRoom = this.roomManager.getStartRoom();

    this.world.scene.userData.rooms = this.roomManager.getVisibleRooms(this.currentRoom.id);
    this.world.renderer.domElement.style.display = 'block';
    this.world.renderer.domElement.style.position = 'fixed';
    this.world.renderer.domElement.style.top = 0;
    this.world.renderer.domElement.style.left = 0;
    this.world.renderer.domElement.style.zIndex = 1;
    this.world.renderer.domElement.style.cursor = 'crosshair';
    this.world.overlays.hud.style.zIndex = 3;
    this.detachControlRequest = attachControlRequest(this.world.renderer.domElement, this.input);
    root.appendChild(this.world.renderer.domElement);
    root.appendChild(this.world.overlays.hud);
    this.applySettings();

    this.interactables = [];
    this.lastHudUpdate = 0;

    this.clockStart = Date.now();
    this.running = false;
    this.lastTimestamp = 0;
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);

    this.prepareRoom(this.currentRoom);
    this.resetPlayer();
    this.resize();
  }

  resetPlayer() {
    const cam = this.world.camera;
    const start = this.currentRoom.playerStart;
    cam.position.set(start.x, start.y, start.z);
    cam.rotation.set(0, Math.PI, 0);
    this.playerYawPitch.x = 0;
    this.playerYawPitch.y = Math.PI;
  }

  prepareRoom(room) {
    this.interactables = (room?.interactives ?? []).map((item) => ({
      ...item,
      image: getItemAsset(item.id),
    }));
    this.currentRoom = room;
    this.currentRoomId = room.id;
    this.world.scene.userData.activeRoomId = room.id;
    buildRoomGeometry(this.world.scene, [room]);
    this.map.renderRoomLabel(this.currentRoom.name);
  }

  transitionIfNeeded() {
    const playerPosition = this.world.camera.position;
    for (const portal of this.currentRoom.portals) {
      if (playerPosition.distanceTo(new THREE.Vector3(portal.position.x, portal.position.y, portal.position.z)) < portal.radius) {
        const target = this.roomManager.getRoom(portal.to);
        if (!target) continue;
        this.prepareRoom(target);
        this.currentRoom.onEnter?.();
        this.world.scene.userData.rooms = this.roomManager.getVisibleRooms(target.id);
        this.world.camera.position.set(target.playerStart.x, target.playerStart.y, target.playerStart.z);
        this.input.vibrate(220, 0.8, 0.6);
        this.story.pushMemory('location', target.name);
        break;
      }
    }
  }

  findInteractiveFocus() {
    const position = this.world.camera.position;
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.world.camera.rotation);
    let best = null;
    let bestDistance = Infinity;

    for (const item of this.interactables) {
      const point = new THREE.Vector3(item.position.x, item.position.y, item.position.z);
      const distance = point.distanceTo(position);
      if (distance > 5.2) continue;

      const toItem = point.clone().sub(position).normalize();
      const dot = forward.dot(toItem);
      if (dot < 0.2) continue;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = item;
      }
    }

    return best;
  }

  updateStory(delta) {
    const focus = this.findInteractiveFocus();
    this.hud.setInteractHint(focus?.name ?? null);

    if (this.input.consumeAction('interact') && focus) {
      this.story.advance(focus.storyNode);
      this.memory.record(focus.id);
      this.input.vibrate(220, 0.4, 0.4);
    }

    if (this.input.consumeAction('restart')) {
      this.story.restart();
      this.heart.reset();
      this.crisis.reset();
      this.input.vibrate(280, 0.2, 0.7);
      return;
    }

    this.world.overlays.prompt.innerText = '';
    if (delta > 0) this.heart.setStress(this.crisis.getIntensity() * 12);
  }

  resolveCrisis(delta) {
    const nearEntity = this.findInteractiveFocus();
    const distance = nearEntity
      ? this.world.camera.position.distanceTo(new THREE.Vector3(nearEntity.position.x, nearEntity.position.y, nearEntity.position.z))
      : 99;

    const dangerLevel = Math.max(0, 1 - distance / 6);
    if (this.crisis.tick(delta, dangerLevel)) {
      this.input.vibrate(120, 0.9, 0.8);
      this.world.lights.back.intensity = 4;
      this.wave.pulse(1.1);
      this.echo.setLevel('panic');
    } else {
      this.world.lights.back.intensity = 2.6;
      this.echo.setLevel('calm');
    }
  }

  updatePlayer(delta) {
    const move = this.input.getMoveVector();
    const look = this.input.getLookDelta();
    const cam = this.world.camera;

    positionCameraFromMovement(cam, this.playerYawPitch, move, look, delta);
    keepWithinRoom(cam, [this.currentRoom]);
    this.transitionIfNeeded();
    this.resolveCrisis(delta);
    this.hud.setHeartRate(this.heart.value);
    this.hud.setSceneLabel(this.currentRoom.name, this.story.getCurrentLabel());
  }

  tick() {
    const delta = this.clock.getDelta();
    this.updatePlayer(delta);
    this.updateStory(delta);
    this.heart.tick(delta);

    if (Date.now() - this.lastHudUpdate > HUD_TICK_MS) {
      this.world.overlays.prompt.style.opacity = 1;
      this.lastHudUpdate = Date.now();
    }

    this.world.renderer.render(this.world.scene, this.world.camera);
    this.wave.update();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = 0;
    const loop = (ts) => {
      this.lastTime = ts;
      if (!this.running) return;
      this.tick();
      this.raf = requestAnimationFrame(loop);
    };
    this.loop = loop;
    this.raf = requestAnimationFrame(this.loop);
  }

  resize() {
    this.world.camera.aspect = window.innerWidth / window.innerHeight;
    this.world.camera.updateProjectionMatrix();
    this.world.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.detachControlRequest?.();
    this.input.destroy();
    this.world.renderer.dispose();
  }

  applySettings(settings = this.settings) {
    this.settings = normalizeGameSettings(settings);
    this.input.setSensitivity(toPointerSensitivity(this.settings));
    this.input.setVibrationEnabled(this.settings.vibration);
    this.world.renderer.toneMappingExposure = toExposure(this.settings);
    this.world.lights.cameraLight.intensity = 0.75 + this.settings.brightness * 0.9;
  }
}
