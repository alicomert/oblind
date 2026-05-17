import assert from 'node:assert/strict';
import { test } from 'node:test';
import { attachControlRequest } from '../src/core/game.js';

test('game canvas pointer down requests gameplay control', () => {
  const listeners = new Map();
  const element = {
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
  };
  let requested = 0;

  const detach = attachControlRequest(element, {
    requestControl() {
      requested += 1;
    },
  });

  listeners.get('pointerdown')();
  assert.equal(requested, 1);

  detach();
  assert.equal(listeners.has('pointerdown'), false);
});
