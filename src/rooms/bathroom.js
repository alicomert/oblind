export default {
  id: 'bathroom',
  name: 'Nemli Banyo',
  bounds: {
    minX: -4,
    maxX: 3,
    minZ: -6,
    maxZ: 2,
    minY: 0,
    maxY: 3,
  },
  playerStart: { x: 0.2, y: 1.7, z: 0.2 },
  layout: [
    { size: [7, 3, 8], position: [-0.4, 1.5, -2], color: 0x0d1217, roughness: 0.97, metalness: 0.04 },
    { size: [1.8, 0.5, 0.8], position: [1.6, 0.25, -1.8], color: 0x273244, roughness: 0.5, metalness: 0.7 },
  ],
  decor: [
    { radiusTop: 0.25, radiusBottom: 0.25, height: 0.9, position: [-1.9, 0.45, -2.2], color: 0x5c95aa },
  ],
  portals: [
    { to: 'corridor', position: { x: 3, y: 1.4, z: -2 }, radius: 1.2 },
  ],
  interactives: [
    {
      id: 'bathroom-vent',
      name: 'Tıkırdayan Havalandırma',
      storyNode: 'vent',
      position: { x: -0.2, y: 1.6, z: -4.9 },
    },
  ],
};
