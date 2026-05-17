import {
  ControllerButtonLatch,
  findGamepad,
  readGamepadState,
} from './controller.js';

const KEY_ACTIONS = {
  moveForward: new Set(['w', 'arrowup']),
  moveBackward: new Set(['s', 'arrowdown']),
  moveLeft: new Set(['a', 'arrowleft']),
  moveRight: new Set(['d', 'arrowright']),
  turnLeft: new Set(['q']),
  turnRight: new Set(['e']),
  interact: new Set(['f', 'enter', ' ']),
  restart: new Set(['r']),
  lookUp: new Set(),
  lookDown: new Set([]),
};

const MOUSE_LOOK_TO_TURN_STEP = 1 / 0.06;

const RUMBLE_MAX = {
  short: 180,
  strong: 0.45,
  weak: 0.35,
};

export class InputController {
  constructor({ sensitivity = 0.0022, vibrationEnabled = true } = {}) {
    this.pressed = new Set();
    this.gamepadIndex = -1;
    this.gamepadButtons = new ControllerButtonLatch();
    this.enabled = true;
    this.vibrationEnabled = vibrationEnabled;
    this.pointer = {
      locked: false,
      sensitivity,
      yaw: 0,
      pitch: 0,
      move: { x: 0, y: 0 },
      rightStick: { x: 0, y: 0 },
    };

    this.onKeyDown = (event) => {
      if (!this.enabled) return;
      const key = String(event.key).toLowerCase();
      if (this.isDefinedKey(key)) this.pressed.add(key);
    };

    this.onKeyUp = (event) => {
      this.pressed.delete(String(event.key).toLowerCase());
    };

    this.onMouseMove = (event) => {
      if (!this.pointer.locked) return;
      this.pointer.yaw += event.movementX * this.pointer.sensitivity * MOUSE_LOOK_TO_TURN_STEP;
      this.pointer.pitch = 0;
    };

    this.onPointerLockChange = () => {
      this.pointer.locked = document.pointerLockElement !== null;
    };

    this.onGamepadConnected = (event) => {
      if (this.gamepadIndex === -1) this.gamepadIndex = event.gamepad.index;
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    this.requestPointerLock = () => {
      if (!this.pointer.locked) {
        document.body.requestPointerLock();
      }
    };
  }

  setSensitivity(sensitivity) {
    this.pointer.sensitivity = sensitivity;
  }

  setVibrationEnabled(enabled) {
    this.vibrationEnabled = Boolean(enabled);
  }

  isDefinedKey(key) {
    return Object.values(KEY_ACTIONS).some((set) => set.has(key));
  }

  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gamepad = findGamepad(pads, this.gamepadIndex);
    if (!gamepad) {
      this.gamepadIndex = -1;
      this.pointer.move.x = 0;
      this.pointer.move.y = 0;
      this.pointer.rightStick.x = 0;
      this.pointer.rightStick.y = 0;
      this.gamepadButtons.update({});
      return;
    }

    const state = readGamepadState(gamepad);
    this.gamepadIndex = state.index;
    this.pointer.move.x = state.move.x;
    this.pointer.move.y = state.move.y;
    this.pointer.rightStick.x = state.look.x;
    this.pointer.rightStick.y = state.look.y;
    this.gamepadButtons.update(state.actions);
  }

  isPressed(action) {
    const keys = KEY_ACTIONS[action];
    if (!keys) return false;
    for (const key of keys) {
      if (this.pressed.has(key)) return true;
    }
    return false;
  }

  getMoveVector() {
    this.pollGamepad();

    const x =
      (this.isPressed('moveRight') ? 1 : 0) -
      (this.isPressed('moveLeft') ? 1 : 0) +
      this.pointer.move.x;
    const y =
      (this.isPressed('moveForward') ? -1 : 0) +
      (this.isPressed('moveBackward') ? 1 : 0) +
      this.pointer.move.y;

    return {
      x,
      y,
    };
  }

  getLookDelta() {
    const keyboardX = (this.isPressed('turnRight') ? 1 : 0) - (this.isPressed('turnLeft') ? 1 : 0);
    const mouseX = this.pointer.yaw;
    this.pointer.yaw = 0;
    this.pointer.pitch = 0;

    const rightX = this.pointer.rightStick.x * 2.2;

    return {
      x: keyboardX + rightX + mouseX,
      y: 0,
    };
  }

  consumeAction(action) {
    const keys = KEY_ACTIONS[action] || new Set();
    for (const key of keys) {
      if (this.pressed.has(key)) {
        this.pressed.delete(key);
        return true;
      }
    }
    return this.gamepadButtons.consume(action);
  }

  vibrate(duration = RUMBLE_MAX.short, strongMagnitude = RUMBLE_MAX.strong, weakMagnitude = RUMBLE_MAX.weak) {
    if (!this.vibrationEnabled) return false;
    if (this.gamepadIndex < 0) return false;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gamepad = findGamepad(pads, this.gamepadIndex);
    const actuator = gamepad?.vibrationActuator;
    if (!actuator?.playEffect) return false;

    actuator.playEffect('dual-rumble', {
      duration,
      startDelay: 0,
      strongMagnitude,
      weakMagnitude,
    });
    return true;
  }

  requestControl() {
    this.requestPointerLock();
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('gamepadconnected', this.onGamepadConnected);
    this.enabled = false;
    this.pressed.clear();
  }
}
