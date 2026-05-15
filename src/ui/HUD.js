export class HUD {
  constructor(element, container) {
    this.element = element;
    this.container = container;
    this.heartRateEl = this.createLine('Kalp: --');
    this.sceneEl = this.createLine('Bölge: --');
    this.controlEl = this.createLine('İpucu: --');
    this.element.append(this.heartRateEl, this.sceneEl, this.controlEl);

    const title = document.createElement('div');
    title.textContent = 'OBLIND • 3D Karanlık Hikâye Oyunu';
    title.style.cssText = 'position:absolute;left:16px;top:12px;font-size:16px;letter-spacing:0.09em';
    this.container.appendChild(title);

    const footer = document.createElement('div');
    footer.textContent = 'WASD veya Sol Analog ile dolaş • Mouse / sağ analog ile bakış • F veya A ile etkileşim • R ile başlangıçta yeniden başlat';
    footer.style.cssText = 'position:absolute;left:12px;bottom:12px;right:12px;opacity:.7;font-size:12px';
    this.container.appendChild(footer);
  }

  createLine(label) {
    const el = document.createElement('div');
    el.textContent = label;
    el.style.cssText = 'margin:2px 0';
    return el;
  }

  setHeartRate(value) {
    this.heartRateEl.textContent = `Nabız: ${Math.round(value)} BPM`;
  }

  setSceneLabel(name, prompt) {
    this.sceneEl.textContent = `${name} ${prompt ? `• ${prompt}` : ''}`;
  }

  setInteractHint(value) {
    this.controlEl.textContent = value ? `İnteraktif: ${value} (F ile etkileşim)` : 'Etrafı dinle';
  }
}
