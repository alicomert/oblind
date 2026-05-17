import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { buildRoomGeometry, positionCameraFromMovement } from '../src/core/scene.js';

test('debug room blocks render with unlit double-sided material', () => {
  const scene = new THREE.Scene();

  buildRoomGeometry(scene, [{
    layout: [{
      size: [2, 0.2, 2],
      position: [0, 0, 0],
      color: 0x00ff00,
      material: 'debug-basic',
    }],
    decor: [],
  }]);

  const roomGroup = scene.getObjectByName('rooms');
  assert.equal(roomGroup.children[0].material.type, 'MeshBasicMaterial');
  assert.equal(roomGroup.children[0].material.color.getHex(), 0x00ff00);
  assert.equal(roomGroup.children[0].material.side, THREE.DoubleSide);
});

test('gameplay camera keeps pitch level while look input only changes yaw', () => {
  const camera = new THREE.PerspectiveCamera();
  const euler = new THREE.Euler(0, Math.PI, 0, 'YXZ');

  positionCameraFromMovement(camera, euler, { x: 0, y: 0 }, { x: 1.5, y: 8 }, 1 / 60);

  assert.equal(euler.x, 0);
  assert.equal(camera.rotation.x, 0);
  assert.notEqual(euler.y, Math.PI);
  assert.equal(camera.rotation.y, euler.y);
});

test('gameplay camera movement stays on the horizontal plane', () => {
  const camera = new THREE.PerspectiveCamera();
  const euler = new THREE.Euler(0, Math.PI, 0, 'YXZ');
  camera.position.set(0, 1.7, 0);

  positionCameraFromMovement(camera, euler, { x: 1, y: -1 }, { x: 0, y: 0 }, 1);

  assert.equal(camera.position.y, 1.7);
});
