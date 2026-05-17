export const CONTROLLER_REPEAT = Object.freeze({
  initialDelayMs: 280,
  repeatMs: 110,
});

export const CONTROLLER_ACTIONS = Object.freeze([
  'up',
  'down',
  'left',
  'right',
  'confirm',
  'back',
  'interact',
  'restart',
  'pause',
]);

const REPEATING_ACTIONS = new Set(['up', 'down', 'left', 'right']);

const GAMEPAD_BUTTONS = Object.freeze({
  confirm: 0,
  back: 1,
  menu: 9,
  dpadUp: 12,
  dpadDown: 13,
  dpadLeft: 14,
  dpadRight: 15,
});

const GAMEPAD_AXES = Object.freeze({
  leftX: 0,
  leftY: 1,
  rightX: 2,
  rightY: 3,
  dpadX: 6,
  dpadY: 7,
  hat: 9,
});

const EMPTY_ACTIONS = Object.freeze({
  up: false,
  down: false,
  left: false,
  right: false,
  confirm: false,
  back: false,
  interact: false,
  restart: false,
  pause: false,
});

export function cleanAxis(value, deadzone = 0.18) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  if (Math.abs(numeric) < deadzone) return 0;
  return Number(Math.max(-1, Math.min(1, numeric)).toFixed(3));
}

function isButtonPressed(button) {
  return Boolean(button?.pressed || Number(button?.value ?? 0) > 0.45);
}

const HAT_AXIS_DIRECTIONS = Object.freeze([
  { value: -1, up: true },
  { value: -0.714, up: true, right: true },
  { value: -0.429, right: true },
  { value: -0.143, down: true, right: true },
  { value: 0.143, down: true },
  { value: 0.429, down: true, left: true },
  { value: 0.714, left: true },
  { value: 1, up: true, left: true },
]);

function readHatAxis(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < -1.1 || numeric > 1.1) {
    return { up: false, down: false, left: false, right: false };
  }

  let closest = null;
  let closestDistance = Infinity;
  for (const direction of HAT_AXIS_DIRECTIONS) {
    const distance = Math.abs(numeric - direction.value);
    if (distance < closestDistance) {
      closest = direction;
      closestDistance = distance;
    }
  }

  if (closestDistance > 0.18 || !closest) {
    return { up: false, down: false, left: false, right: false };
  }

  return {
    up: Boolean(closest.up),
    down: Boolean(closest.down),
    left: Boolean(closest.left),
    right: Boolean(closest.right),
  };
}

export function readGamepadState(gamepad, { deadzone = 0.18, uiThreshold = 0.55 } = {}) {
  if (!gamepad) {
    return {
      connected: false,
      index: -1,
      move: { x: 0, y: 0 },
      look: { x: 0, y: 0 },
      actions: { ...EMPTY_ACTIONS },
    };
  }

  const axes = gamepad.axes ?? [];
  const buttons = gamepad.buttons ?? [];
  const move = {
    x: cleanAxis(axes[GAMEPAD_AXES.leftX] ?? 0, deadzone),
    y: cleanAxis(axes[GAMEPAD_AXES.leftY] ?? 0, deadzone),
  };
  const look = {
    x: cleanAxis(axes[GAMEPAD_AXES.rightX] ?? 0, deadzone),
    y: cleanAxis(axes[GAMEPAD_AXES.rightY] ?? 0, deadzone),
  };
  const dpadAxis = {
    x: cleanAxis(axes[GAMEPAD_AXES.dpadX] ?? 0, deadzone),
    y: cleanAxis(axes[GAMEPAD_AXES.dpadY] ?? 0, deadzone),
  };
  const hat = readHatAxis(axes[GAMEPAD_AXES.hat]);

  const confirm = isButtonPressed(buttons[GAMEPAD_BUTTONS.confirm]);
  const menu = isButtonPressed(buttons[GAMEPAD_BUTTONS.menu]);

  return {
    connected: Boolean(gamepad.connected ?? true),
    index: Number.isInteger(gamepad.index) ? gamepad.index : -1,
    move,
    look,
    actions: {
      up: isButtonPressed(buttons[GAMEPAD_BUTTONS.dpadUp]) || move.y <= -uiThreshold || dpadAxis.y <= -uiThreshold || hat.up,
      down: isButtonPressed(buttons[GAMEPAD_BUTTONS.dpadDown]) || move.y >= uiThreshold || dpadAxis.y >= uiThreshold || hat.down,
      left: isButtonPressed(buttons[GAMEPAD_BUTTONS.dpadLeft]) || move.x <= -uiThreshold || dpadAxis.x <= -uiThreshold || hat.left,
      right: isButtonPressed(buttons[GAMEPAD_BUTTONS.dpadRight]) || move.x >= uiThreshold || dpadAxis.x >= uiThreshold || hat.right,
      confirm,
      back: isButtonPressed(buttons[GAMEPAD_BUTTONS.back]),
      interact: confirm,
      restart: menu,
      pause: menu,
    },
  };
}

export function findGamepad(gamepads = [], preferredIndex = -1) {
  const pads = Array.from(gamepads ?? []);
  if (preferredIndex >= 0) {
    const preferred = pads.find((pad) => pad && pad.index === preferredIndex && pad.connected !== false);
    if (preferred) return preferred;
  }

  return pads.find((pad) => pad && pad.connected !== false) ?? null;
}

export class ControllerButtonLatch {
  constructor() {
    this.held = new Set();
    this.justPressed = new Set();
  }

  update(actions = {}) {
    const nextHeld = new Set();
    const nextPressed = new Set();

    for (const action of CONTROLLER_ACTIONS) {
      if (!actions[action]) continue;
      nextHeld.add(action);
      if (!this.held.has(action)) nextPressed.add(action);
    }

    this.held = nextHeld;
    this.justPressed = nextPressed;
  }

  consume(action) {
    if (!this.justPressed.has(action)) return false;
    this.justPressed.delete(action);
    return true;
  }

  isHeld(action) {
    return this.held.has(action);
  }
}

export class ControllerActionRepeater {
  constructor({ initialDelayMs = CONTROLLER_REPEAT.initialDelayMs, repeatMs = CONTROLLER_REPEAT.repeatMs } = {}) {
    this.initialDelayMs = initialDelayMs;
    this.repeatMs = repeatMs;
    this.held = new Set();
    this.nextRepeatAt = new Map();
  }

  next(actions = {}, now = 0) {
    const emitted = [];
    const nextHeld = new Set();

    for (const action of CONTROLLER_ACTIONS) {
      if (!actions[action]) continue;
      nextHeld.add(action);

      if (!this.held.has(action)) {
        emitted.push(action);
        if (REPEATING_ACTIONS.has(action)) {
          this.nextRepeatAt.set(action, now + this.initialDelayMs);
        }
        continue;
      }

      if (!REPEATING_ACTIONS.has(action)) continue;

      const nextAt = this.nextRepeatAt.get(action) ?? now + this.initialDelayMs;
      if (now >= nextAt) {
        emitted.push(action);
        this.nextRepeatAt.set(action, now + this.repeatMs);
      }
    }

    for (const action of this.held) {
      if (!nextHeld.has(action)) this.nextRepeatAt.delete(action);
    }

    this.held = nextHeld;
    return emitted;
  }

  reset() {
    this.held.clear();
    this.nextRepeatAt.clear();
  }
}
