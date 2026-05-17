export default {
  id: 'bedroom',
  name: 'Loş Yatak Odası',
  bounds: {
    minX: -6,
    maxX: 6,
    minZ: -9,
    maxZ: 4,
    minY: 0,
    maxY: 3,
  },
  playerStart: { x: -4, y: 1.7, z: 3.2 },
  layout: [
    { size: [12, 3, 8], position: [0, 1.5, -2], color: 0x0d1118, roughness: 0.94, metalness: 0.02 },
    { size: [1.2, 0.6, 1.4], position: [-2.5, 0.7, -3.6], color: 0x222a37, roughness: 0.72, metalness: 0.1 },
    { size: [3, 0.2, 1.6], position: [0.8, 1.2, -3.8], color: 0x11181f, roughness: 0.85, metalness: 0.0 },
  ],
  decor: [
    { radiusTop: 0.18, radiusBottom: 0.18, height: 0.4, position: [-2.2, 0.2, -1.2], color: 0x222222 },
    { radiusTop: 0.08, radiusBottom: 0.08, height: 1.0, position: [2.3, 0.5, -0.8], color: 0x5a3f2a },
  ],
  portals: [
    { id: 'to-corridor', to: 'corridor', position: { x: 0, y: 1.4, z: -7 }, radius: 1.5 },
  ],
  interactives: [
    {
      id: 'bedroom-photo',
      name: 'Eski Bir Fotoğraf',
      storyNode: 'photo',
      position: { x: -2.5, y: 1.2, z: -3.6 },
    },
  ],
};
