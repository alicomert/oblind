# Repository Guidelines

## Project Structure & Module Organization

This is a Vite-based JavaScript game prototype. Runtime code lives in `src/`, organized by domain: `core/` for game setup, settings, input, and scene logic; `ui/` for start screen, HUD, minimap, and overlays; `rooms/` for room definitions; `mechanics/` for gameplay systems; `story/` for narrative flow; `audio/` for sound helpers; and `assets/` for imported image references. Static browser assets live in `public/`, with image folders under `public/images/`. Tests are in `test/` and use the `*.test.js` naming pattern. Build output in `dist/`, logs, and `node_modules/` are generated and should not be committed.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite development server for local playtesting.
- `npm test`: run the Node built-in test suite (`node --test`).
- `npm run build`: create a production bundle in `dist/`.
- `npm run preview`: serve the built bundle locally for verification.

Run commands from the repository root.

## Coding Style & Naming Conventions

Use modern ES modules with explicit relative imports, including `.js` extensions. Match the existing style: two-space indentation, semicolons, single quotes, and descriptive class or function names such as `StartScreen`, `StoryManager`, and `normalizeGameSettings`. Keep modules focused by domain and prefer named exports for shared helpers. Place new tests beside related behavior in `test/`, not inside `src/`.

## Testing Guidelines

The project uses Node's built-in test runner with `node:assert/strict`. Name test files `featureName.test.js` and write behavior-focused test names, for example `test('controller mapping filters deadzone...', () => { ... })`. Add or update tests when changing settings normalization, input/controller handling, UI start flow, story progression, or reusable gameplay mechanics. Run `npm test` before handing off changes; run `npm run build` for changes that touch browser rendering or imports.

## Commit & Pull Request Guidelines

Git history currently uses a scoped, imperative style such as `oblind: add dark 3D playable story prototype scaffold`. Prefer concise messages in that form, for example `oblind: fix controller repeat timing`. Pull requests should describe the user-visible change, list verification commands run, link any relevant issue, and include screenshots or short clips for visual UI/gameplay changes.

## Agent-Specific Instructions

Keep generated artifacts out of commits unless explicitly requested. Do not overwrite user changes; inspect the worktree first when editing files that may already be modified.
