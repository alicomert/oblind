export class Minimap {
  constructor(parent) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 140;
    this.canvas.height = 140;
    this.canvas.style.cssText = 'position:fixed; right:16px; bottom:16px; border:1px solid rgba(170,180,225,0.4); background:rgba(5,7,9,0.6); border-radius:6px;';
    this.ctx = this.canvas.getContext('2d');
    parent.appendChild(this.canvas);
    this.label = document.createElement('div');
    this.label.style.cssText = 'position:fixed; right:16px; bottom:162px; opacity:.8; font-size:12px';
    parent.appendChild(this.label);
  }

  renderRoomLabel(name) {
    this.label.textContent = name ?? 'Unknown';
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'rgba(35,35,45,0.9)';
    this.ctx.fillRect(8, 8, this.canvas.width - 16, this.canvas.height - 16);
    this.ctx.strokeStyle = 'rgba(180,190,255,0.8)';
    this.ctx.strokeRect(14, 14, this.canvas.width - 28, this.canvas.height - 28);
    this.ctx.fillStyle = '#a0a8ff';
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 5, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
