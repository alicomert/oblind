import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ControllerActionRepeater,
  ControllerButtonLatch,
  CONTROLLER_REPEAT,
  findGamepad,
  readGamepadState,
} from '../src/core/controller.js';

function button(pressed, value = pressed ? 1 : 0) {
  return { pressed, value };
}

test('controller mapping reads standard gamepad axes and buttons for UI and gameplay', () => {
  const state = readGamepadState({
    index: 2,
    connected: true,
    axes: [0.7, -0.8, -0.4, 0.3],
    buttons: [
      button(true),
      button(false),
      button(false),
      button(false),
      button(false),
      button(false),
      button(false),
      button(false),
      button(false),
      button(true),
      button(false),
      button(false),
      button(false),
      button(false),
      button(true),
      button(false),
    ],
  });

  assert.equal(state.connected, true);
  assert.equal(state.index, 2);
  assert.deepEqual(state.move, { x: 0.7, y: -0.8 });
  assert.deepEqual(state.look, { x: -0.4, y: 0.3 });
  assert.equal(state.actions.up, true);
  assert.equal(state.actions.left, true);
  assert.equal(state.actions.confirm, true);
  assert.equal(state.actions.interact, true);
  assert.equal(state.actions.restart, true);
});

test('controller mapping filters deadzone and falls back to disconnected state', () => {
  assert.deepEqual(readGamepadState(null), {
    connected: false,
    index: -1,
    move: { x: 0, y: 0 },
    look: { x: 0, y: 0 },
    actions: {
      up: false,
      down: false,
      left: false,
      right: false,
      confirm: false,
      back: false,
      interact: false,
      restart: false,
      pause: false,
    },
  });

  const state = readGamepadState({
    index: 0,
    connected: true,
    axes: [0.05, -0.1, 0.16, -0.17],
    buttons: [],
  });

  assert.deepEqual(state.move, { x: 0, y: 0 });
  assert.deepEqual(state.look, { x: 0, y: 0 });
  assert.equal(state.actions.up, false);
});

test('controller mapping reads non-standard d-pad axes used by some browsers', () => {
  const axisDpad = readGamepadState({
    index: 0,
    connected: true,
    axes: [0, 0, 0, 0, 0, 0, 0, 1],
    buttons: [],
  });

  assert.equal(axisDpad.actions.down, true);
  assert.equal(axisDpad.actions.up, false);

  const hatDpad = readGamepadState({
    index: 0,
    connected: true,
    axes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0.142857],
    buttons: [],
  });

  assert.equal(hatDpad.actions.down, true);
  assert.equal(hatDpad.actions.up, false);
});

test('controller helpers choose preferred gamepad or first connected fallback', () => {
  const pads = [
    null,
    { index: 1, connected: true },
    { index: 2, connected: true },
  ];

  assert.equal(findGamepad(pads, 2).index, 2);
  assert.equal(findGamepad(pads, 7).index, 1);
  assert.equal(findGamepad([], 0), null);
});

test('controller button latch returns one gameplay action per physical press', () => {
  const latch = new ControllerButtonLatch();

  latch.update({ interact: true, restart: false });
  assert.equal(latch.consume('interact'), true);
  assert.equal(latch.consume('interact'), false);

  latch.update({ interact: true, restart: false });
  assert.equal(latch.consume('interact'), false);

  latch.update({ interact: false, restart: false });
  latch.update({ interact: true, restart: false });
  assert.equal(latch.consume('interact'), true);
});

test('controller action repeater emits immediate UI action then delayed repeats', () => {
  const repeater = new ControllerActionRepeater(CONTROLLER_REPEAT);

  assert.deepEqual(repeater.next({ down: true }, 1000), ['down']);
  assert.deepEqual(repeater.next({ down: true }, 1000 + CONTROLLER_REPEAT.initialDelayMs - 1), []);
  assert.deepEqual(repeater.next({ down: true }, 1000 + CONTROLLER_REPEAT.initialDelayMs), ['down']);
  assert.deepEqual(repeater.next({ down: true }, 1000 + CONTROLLER_REPEAT.initialDelayMs + CONTROLLER_REPEAT.repeatMs), ['down']);
  assert.deepEqual(repeater.next({ down: false }, 2000), []);
  assert.deepEqual(repeater.next({ down: true }, 2010), ['down']);
});

test('controller action repeater does not repeat one-shot confirm and back actions while held', () => {
  const repeater = new ControllerActionRepeater(CONTROLLER_REPEAT);

  assert.deepEqual(repeater.next({ confirm: true, back: true }, 1000), ['confirm', 'back']);
  assert.deepEqual(repeater.next({ confirm: true, back: true }, 2000), []);
  assert.deepEqual(repeater.next({ confirm: false, back: false }, 2010), []);
  assert.deepEqual(repeater.next({ confirm: true, back: true }, 2020), ['confirm', 'back']);
});
