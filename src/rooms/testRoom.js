const DEBUG_MATERIAL = 'debug-basic';
const FLOOR_GREEN = 0x00ff00;
const ROOM_RED = 0xff0000;
const CORNER_WHITE = 0xffffff;

export default {
  id: 'test-room',
  name: 'Test Odası',
  bounds: {
    minX: -5.6,
    maxX: 5.6,
    minZ: -7.6,
    maxZ: 3.6,
    minY: 0,
    maxY: 3,
  },
  playerStart: { x: 0, y: 1.7, z: 1.8 },
  layout: [
    {
      role: 'floor',
      size: [12, 0.2, 12],
      position: [0, 0, -2],
      color: FLOOR_GREEN,
      material: DEBUG_MATERIAL,
    },
    {
      role: 'ceiling',
      size: [12, 0.2, 12],
      position: [0, 3, -2],
      color: FLOOR_GREEN,
      material: DEBUG_MATERIAL,
    },
    {
      role: 'wall',
      size: [12, 3, 0.25],
      position: [0, 1.5, -8],
      color: ROOM_RED,
      material: DEBUG_MATERIAL,
    },
    {
      role: 'wall',
      size: [12, 3, 0.25],
      position: [0, 1.5, 4],
      color: ROOM_RED,
      material: DEBUG_MATERIAL,
    },
    {
      role: 'wall',
      size: [0.25, 3, 12],
      position: [-6, 1.5, -2],
      color: ROOM_RED,
      material: DEBUG_MATERIAL,
    },
    {
      role: 'wall',
      size: [0.25, 3, 12],
      position: [6, 1.5, -2],
      color: ROOM_RED,
      material: DEBUG_MATERIAL,
    },
    {
      role: 'corner-marker',
      size: [0.35, 3, 0.35],
      position: [-5.85, 1.5, -7.85],
      color: CORNER_WHITE,
      material: DEBUG_MATERIAL,
    },
    {
      role: 'corner-marker',
      size: [0.35, 3, 0.35],
      position: [5.85, 1.5, -7.85],
      color: CORNER_WHITE,
      material: DEBUG_MATERIAL,
    },
    {
      role: 'corner-marker',
      size: [0.35, 3, 0.35],
      position: [-5.85, 1.5, 3.85],
      color: CORNER_WHITE,
      material: DEBUG_MATERIAL,
    },
    {
      role: 'corner-marker',
      size: [0.35, 3, 0.35],
      position: [5.85, 1.5, 3.85],
      color: CORNER_WHITE,
      material: DEBUG_MATERIAL,
    },
  ],
  decor: [],
  portals: [],
  interactives: [],
};
