export default {
  id: 'corridor',
  name: 'Kararmış Koridor',
  bounds: {
    minX: -7,
    maxX: 7,
    minZ: -10,
    maxZ: 8,
    minY: 0,
    maxY: 3,
  },
  playerStart: { x: 0, y: 1.7, z: 0 },
  layout: [
    { size: [14, 3, 4], position: [0, 1.5, -2], color: 0x0d0f13, roughness: 0.96, metalness: 0.01 },
    { size: [2.3, 3, 0.5], position: [-3.8, 1.5, -2], color: 0x14191f, roughness: 0.7, metalness: 0.05 },
    { size: [2.1, 3, 0.5], position: [3.8, 1.5, -2], color: 0x14191f, roughness: 0.7, metalness: 0.05 },
  ],
  decor: [
    { radiusTop: 0.4, radiusBottom: 0.4, height: 1.2, position: [0.0, 0.6, -0.1], color: 0x1b232f },
  ],
  portals: [
    { id: 'to-bedroom', to: 'bedroom', position: { x: 0, y: 1.4, z: 3 }, radius: 1.8 },
    { id: 'to-kitchen', to: 'kitchen', position: { x: -6, y: 1.4, z: -2 }, radius: 1.5 },
    { id: 'to-bathroom', to: 'bathroom', position: { x: 6, y: 1.4, z: -2 }, radius: 1.5 },
  ],
  interactives: [
    {
      id: 'corridor-noise',
      name: 'Karanlıkten Gelen Çıtırtı',
      storyNode: 'noise',
      position: { x: 0, y: 1, z: -1.8 },
    },
  ],
};
