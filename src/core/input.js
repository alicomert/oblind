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

const GAMEPAD_AXIS = {
  leftX: 0,
  leftY: 1,
  rightX: 2,
  rightY: 3,
};

const RUMBLE_MAX = {
  short: 180,
  strong: 0.45,
  weak: 0.35,
};

export class InputController {
  constructor() {
    this.pressed = new Set();
    this.gamepadIndex = -1;
    this.enabled = true;
    this.pointer = {
      locked: false,
      sensitivity: 0.0022,
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
      this.pointer.yaw -= event.movementX * this.pointer.sensitivity;
      this.pointer.pitch -= event.movementY * this.pointer.sensitivity;
      this.pointer.pitch = Math.max(-1.2, Math.min(1.2, this.pointer.pitch));
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

  isDefinedKey(key) {
    return Object.values(KEY_ACTIONS).some((set) => set.has(key));
  }

  pollGamepad() {
    if (this.gamepadIndex < 0) return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gamepad = pads[this.gamepadIndex];
    if (!gamepad) return;

    const dead = 0.16;
    const lx = gamepad.axes[GAMEPAD_AXIS.leftX] ?? 0;
    const ly = gamepad.axes[GAMEPAD_AXIS.leftY] ?? 0;
    const rx = gamepad.axes[GAMEPAD_AXIS.rightX] ?? 0;
    const ry = gamepad.axes[GAMEPAD_AXIS.rightY] ?? 0;

    const clean = (v) => (Math.abs(v) < dead ? 0 : v);

    this.pointer.move.x = clean(lx);
    this.pointer.move.y = clean(ly);
    this.pointer.rightStick.x = clean(rx);
    this.pointer.rightStick.y = clean(ry);

    if (Math.abs(gamepad.buttons[0]?.value) > 0.4) this.pressed.add('f');
    else this.pressed.delete('f');
    if (Math.abs(gamepad.buttons[1]?.value) > 0.4) this.pressed.add(' ') ;
    else this.pressed.delete(' ');

    if (gamepad.buttons[9]?.pressed) this.pressed.add('r');
    else this.pressed.delete('r');
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
    const keyboardY = (this.isPressed('lookDown') ? 1 : 0) - (this.isPressed('lookUp') ? 1 : 0);

    const rightX = this.pointer.rightStick.x * 2.2;
    const rightY = this.pointer.rightStick.y * 2.2;

    return {
      x: keyboardX + rightX,
      y: keyboardY + rightY,
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
    return false;
  }

  vibrate(duration = RUMBLE_MAX.short, strongMagnitude = RUMBLE_MAX.strong, weakMagnitude = RUMBLE_MAX.weak) {
    if (this.gamepadIndex < 0) return false;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gamepad = pads[this.gamepadIndex];
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
