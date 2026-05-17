import { getBackgroundAsset, getRoomVisual } from '../assets/imageLibrary.js';

export class BackdropLayer {
  constructor(parent) {
    this.parent = parent;
    this.element = document.createElement('div');
    this.image = document.createElement('div');
    this.overlay = document.createElement('div');
    this.atmosphere = document.createElement('div');

    document.documentElement.style.background = '#020203';
    document.documentElement.style.overflow = 'hidden';
    this.parent.style.margin = '0';
    this.parent.style.minHeight = '100vh';
    this.parent.style.overflow = 'hidden';
    this.parent.style.background = '#020203';

    this.element.id = 'oblind-backdrop';
    this.element.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:0',
      'overflow:hidden',
      'pointer-events:none',
      'background:#020203',
    ].join(';');

    this.image.style.cssText = [
      'position:absolute',
      'inset:0',
      'background-repeat:no-repeat',
      'background-size:cover',
      'background-position:center center',
      'filter:saturate(0.82) contrast(1.08) brightness(0.72)',
      'transform:scale(1.01)',
      'transition:background-image 350ms ease, opacity 350ms ease, background-position 350ms ease',
    ].join(';');

    this.overlay.style.cssText = [
      'position:absolute',
      'inset:0',
      'background:rgba(0,0,0,0.48)',
    ].join(';');

    this.atmosphere.id = 'oblind-atmosphere';
    this.atmosphere.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2',
      'pointer-events:none',
      'background-repeat:no-repeat',
      'background-size:cover',
      'background-position:center center',
      'opacity:0.14',
      'mix-blend-mode:screen',
      'filter:saturate(0.82) contrast(1.05) brightness(0.82)',
      'transition:background-image 350ms ease, opacity 350ms ease, background-position 350ms ease',
    ].join(';');

    this.element.append(this.image, this.overlay);
    this.parent.prepend(this.element);
    this.parent.appendChild(this.atmosphere);
  }

  setRoom(roomId) {
    const visual = getRoomVisual(roomId);
    this.applyBackground(visual.backgroundAsset, roomId);
  }

  setBackground(backgroundId) {
    this.applyBackground(getBackgroundAsset(backgroundId), backgroundId);
  }

  setOverlay(value) {
    this.overlay.style.background = value;
  }

  applyBackground(background, key) {
    this.element.dataset.background = key ?? '';

    this.image.style.backgroundImage = background.src ? `url("${background.src}")` : 'none';
    this.image.style.backgroundSize = background.fit ?? 'cover';
    this.image.style.backgroundPosition = background.position ?? 'center center';
    this.image.style.opacity = `${background.opacity ?? 0.85}`;
    this.overlay.style.background = background.overlay ?? 'rgba(0,0,0,0.48)';
    this.atmosphere.style.backgroundImage = this.image.style.backgroundImage;
    this.atmosphere.style.backgroundSize = this.image.style.backgroundSize;
    this.atmosphere.style.backgroundPosition = this.image.style.backgroundPosition;
    this.atmosphere.style.opacity = `${background.atmosphereOpacity ?? 0.12}`;
  }

  destroy() {
    this.element.remove();
    this.atmosphere.remove();
  }
}
