# Start Screen Game Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the website-like opening screen with a minimal horror-game main menu placed at the start of the middle vertical third.

**Architecture:** Keep `StartScreen` as the owner of the opening screen DOM. Add a small exported menu config helper so the menu content and layout intent are testable without a browser DOM dependency. Use the existing `BackdropLayer` and background asset path; the logo remains part of the background image.

**Tech Stack:** Vite, vanilla JavaScript modules, Node built-in test runner, existing DOM APIs.

---

### Task 1: Testable Menu Contract

**Files:**
- Modify: `package.json`
- Create: `test/startScreen.test.js`
- Modify: `src/ui/StartScreen.js`

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as StartScreenModule from '../src/ui/StartScreen.js';

test('start screen menu uses a centered game-menu contract without duplicate logo text', () => {
  assert.equal(typeof StartScreenModule.getStartMenuConfig, 'function');

  const config = StartScreenModule.getStartMenuConfig();

  assert.deepEqual(
    config.actions.map((action) => action.label),
    ['NEW GAME', 'CONTINUE', 'SETTINGS', 'CREDITS'],
  );
  assert.equal(config.showInlineTitle, false);
  assert.equal(config.menuTop, 'calc(33.333vh + 8px)');
  assert.equal(config.menuAlign, 'center');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/startScreen.test.js`
Expected: FAIL because `getStartMenuConfig` is not exported yet.

- [ ] **Step 3: Write minimal implementation**

```js
export function getStartMenuConfig() {
  return {
    showInlineTitle: false,
    menuTop: 'calc(33.333vh + 8px)',
    menuAlign: 'center',
    actions: [
      { label: 'NEW GAME', command: 'start' },
      { label: 'CONTINUE', command: 'continue' },
      { label: 'SETTINGS', command: 'settings' },
      { label: 'CREDITS', command: 'credits' },
    ],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/startScreen.test.js`
Expected: PASS with 1 passing test.

### Task 2: Minimal Game Menu UI

**Files:**
- Modify: `src/ui/StartScreen.js`

- [ ] **Step 1: Replace the landing-page panel**

Use fixed full-screen overlay, no inline `h1`, no subtitle, and a centered menu positioned at `top: calc(33.333vh + 8px)`.

- [ ] **Step 2: Wire actions**

`NEW GAME` starts the game. `CONTINUE` is disabled visually for now because no save system exists. `SETTINGS` toggles a compact settings row with fullscreen action. `CREDITS` toggles the existing credits text.

- [ ] **Step 3: Verify**

Run: `npm test`
Run: `npm run build`
Open the local Vite URL and confirm the menu sits centered below the image logo area.
