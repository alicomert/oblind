# Image structure

Use this folder for browser-served visual files. Vite exposes everything here from `/images/...`.

- `backgrounds/`: full-screen or room background images.
- `items/`: interactable item images. Prefer names matching interactive ids, for example `bedroom-photo.png`.
- `rooms/`: room-specific textures, posters, wall/floor images, or mood panels.
- `ui/`: HUD icons, cursor/crosshair art, and interface images.

After adding a file, register it in `src/assets/imageLibrary.js` so the game can load it from one central place.
