export class WavePulse {
  constructor(parent) {
    this.el = document.createElement('div');
    this.el.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'mix-blend-mode:screen',
      'z-index:1',
    ].join(';');
    parent.appendChild(this.el);
    this.progress = 0;
  }

  pulse(intensity = 1) {
    this.progress = Math.max(this.progress, intensity);
  }

  update() {
    if (this.progress <= 0) return;
    this.progress *= 0.9;
    const alpha = Math.min(0.35, this.progress * 0.4);
    this.el.style.background = `radial-gradient(circle at center, rgba(255, 120, 120, ${alpha}) 0%, rgba(0,0,0,0) 55%)`;
    if (this.progress < 0.02) {
      this.progress = 0;
      this.el.style.background = 'none';
    }
  }
}
