export class Minimap {
  constructor(parent) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 180;
    this.canvas.height = 96;
    this.canvas.style.cssText = 'position:fixed; left:16px; bottom:16px; border:1px solid rgba(170,180,225,0.32); background:rgba(5,7,9,0.48); border-radius:6px;';
    this.ctx = this.canvas.getContext('2d');
    parent.appendChild(this.canvas);
  }

  renderRoomLabel(name) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const pad = 8;
    const width = this.canvas.width - pad * 2;
    const height = this.canvas.height - pad * 2;
    const third = width / 3;

    this.ctx.fillStyle = 'rgba(22,24,31,0.9)';
    this.ctx.fillRect(pad, pad, width, height);
    this.ctx.strokeStyle = 'rgba(180,190,255,0.52)';
    this.ctx.strokeRect(pad, pad, width, height);

    this.ctx.strokeStyle = 'rgba(180,190,255,0.24)';
    this.ctx.beginPath();
    this.ctx.moveTo(pad + third, pad);
    this.ctx.lineTo(pad + third, pad + height);
    this.ctx.moveTo(pad + third * 2, pad);
    this.ctx.lineTo(pad + third * 2, pad + height);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(105,130,255,0.16)';
    this.ctx.fillRect(pad, pad, third, height);

    this.ctx.fillStyle = '#a0a8ff';
    this.ctx.beginPath();
    this.ctx.arc(pad + third * 0.5, pad + height - 12, 5, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
