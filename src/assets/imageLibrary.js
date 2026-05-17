const imagePath = (...segments) => `/images/${segments.join('/')}`;

export const IMAGE_ASSETS = {
  backgrounds: {
    hauntedCabin: {
      id: 'hauntedCabin',
      name: 'Haunted cabin exterior',
      src: imagePath('backgrounds', 'background.png'),
      fit: 'cover',
      position: 'center center',
      opacity: 1,
      overlay: 'transparent',
      atmosphereOpacity: 0.08,
    },
  },
  rooms: {
    bedroom: { background: 'hauntedCabin' },
    corridor: { background: 'hauntedCabin' },
    kitchen: { background: 'hauntedCabin' },
    bathroom: { background: 'hauntedCabin' },
    basement: { background: 'hauntedCabin' },
  },
  items: {
    'bedroom-photo': {
      id: 'bedroom-photo',
      name: 'Old photo',
      src: null,
      recommendedSrc: imagePath('items', 'bedroom-photo.png'),
      accent: '#8f7358',
    },
    'corridor-noise': {
      id: 'corridor-noise',
      name: 'Corridor noise',
      src: null,
      recommendedSrc: imagePath('items', 'corridor-noise.png'),
      accent: '#5c6887',
    },
    'kitchen-fridge': {
      id: 'kitchen-fridge',
      name: 'Frozen fridge',
      src: null,
      recommendedSrc: imagePath('items', 'kitchen-fridge.png'),
      accent: '#7894ad',
    },
    'bathroom-vent': {
      id: 'bathroom-vent',
      name: 'Rattling vent',
      src: null,
      recommendedSrc: imagePath('items', 'bathroom-vent.png'),
      accent: '#5c95aa',
    },
    'basement-tray': {
      id: 'basement-tray',
      name: 'Broken metal tray',
      src: null,
      recommendedSrc: imagePath('items', 'basement-tray.png'),
      accent: '#7e7568',
    },
  },
  ui: {
    crosshair: {
      id: 'crosshair',
      src: null,
      recommendedSrc: imagePath('ui', 'crosshair.svg'),
    },
  },
};

const DEFAULT_BACKGROUND = IMAGE_ASSETS.backgrounds.hauntedCabin;

export function getBackgroundAsset(backgroundId) {
  return IMAGE_ASSETS.backgrounds[backgroundId] ?? DEFAULT_BACKGROUND;
}

export function getRoomVisual(roomId) {
  const roomVisual = IMAGE_ASSETS.rooms[roomId] ?? IMAGE_ASSETS.rooms.bedroom;
  return {
    ...roomVisual,
    backgroundAsset: getBackgroundAsset(roomVisual.background),
  };
}

export function getItemAsset(itemId) {
  return IMAGE_ASSETS.items[itemId] ?? null;
}

export function getImagePath(category, fileName) {
  return imagePath(category, fileName);
}
