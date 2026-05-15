export default {
  id: 'basement',
  name: 'Alt Bodrum',
  bounds: {
    minX: -7,
    maxX: 6,
    minZ: -8,
    maxZ: 8,
    minY: 0,
    maxY: 3,
  },
  playerStart: { x: 0, y: 1.7, z: 0 },
  layout: [
    { size: [14, 3, 16], position: [0, 1.5, 0], color: 0x07080a, roughness: 0.97, metalness: 0.0 },
    { size: [1.7, 2.4, 2.7], position: [-4.8, 1.2, -2.7], color: 0x211e17, roughness: 0.6, metalness: 0.25 },
  ],
  decor: [
    { radiusTop: 0.2, radiusBottom: 0.2, height: 2.4, position: [3.5, 1.2, 1.3], color: 0x1f1b17 },
  ],
  portals: [
    { to: 'kitchen', position: { x: 0, y: 1.4, z: -6.9 }, radius: 1.3 },
  ],
  interactives: [
    {
      id: 'basement-tray',
      name: 'Kırık Metal Tepsi',
      storyNode: 'basement',
      position: { x: -4.5, y: 1.2, z: -2.9 },
    },
  ],
};
