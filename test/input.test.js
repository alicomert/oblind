import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { InputController } from '../src/core/input.js';

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;

beforeEach(() => {
  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.document = {
    pointerLockElement: null,
    body: {
      requestPointerLock() {},
    },
    addEventListener() {},
    removeEventListener() {},
  };
});

afterEach(() => {
  globalThis.window = originalWindow;
  globalThis.document = originalDocument;
});

test('mouse look contributes horizontal look only while pointer locked', () => {
  const input = new InputController({ sensitivity: 0.006 });
  input.pointer.locked = true;

  input.onMouseMove({ movementX: 10, movementY: 80 });
  const look = input.getLookDelta();
  const consumed = input.getLookDelta();

  assert.notEqual(look.x, 0);
  assert.equal(look.y, 0);
  assert.equal(input.pointer.pitch, 0);
  assert.equal(consumed.x, 0);

  input.destroy();
});

test('mouse movement right matches keyboard turn right direction', () => {
  const keyboard = new InputController({ sensitivity: 0.006 });
  keyboard.onKeyDown({ key: 'e' });
  const keyboardLook = keyboard.getLookDelta();
  keyboard.destroy();

  const mouse = new InputController({ sensitivity: 0.006 });
  mouse.pointer.locked = true;
  mouse.onMouseMove({ movementX: 10, movementY: 0 });
  const mouseLook = mouse.getLookDelta();
  mouse.destroy();

  assert.ok(keyboardLook.x > 0);
  assert.ok(mouseLook.x > 0);
});
