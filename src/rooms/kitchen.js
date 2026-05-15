export default {
  id: 'kitchen',
  name: 'Paslı Mutfak',
  bounds: {
    minX: -5,
    maxX: 2,
    minZ: -7,
    maxZ: 3,
    minY: 0,
    maxY: 3,
  },
  playerStart: { x: -1.6, y: 1.7, z: 0.5 },
  layout: [
    { size: [7.2, 3, 10], position: [-1.4, 1.5, -2], color: 0x0f1116, roughness: 0.95, metalness: 0.04 },
    { size: [1, 1.6, 1], position: [0.5, 1, -2], color: 0x30394a, roughness: 0.45, metalness: 0.22 },
  ],
  decor: [
    { radiusTop: 0.45, radiusBottom: 0.45, height: 0.8, position: [-3.8, 0.4, -2.1], color: 0x7a6c2b },
    { radiusTop: 0.3, radiusBottom: 0.3, height: 0.75, position: [1.1, 0.38, -0.5], color: 0x404f6a },
  ],
  portals: [
    { to: 'corridor', position: { x: -5, y: 1.4, z: -2 }, radius: 1.2 },
  ],
  interactives: [
    {
      id: 'kitchen-fridge',
      name: 'Donmuş Buzdolabı',
      storyNode: 'fridge',
      position: { x: 0.5, y: 1.2, z: -2.4 },
    },
  ],
};
