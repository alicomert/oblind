const MODES = {
  calm: {
    ambient: 0.22,
    fogDensity: 0.05,
    color: '#2f2f6a',
  },
  tension: {
    ambient: 0.4,
    fogDensity: 0.12,
    color: '#4a2f4a',
  },
  panic: {
    ambient: 0.58,
    fogDensity: 0.2,
    color: '#5e2929',
  },
};

export class EchoLocation {
  constructor() {
    this.mode = 'calm';
    this.history = [];
  }

  setLevel(mode = 'calm') {
    this.mode = MODES[mode] ? mode : 'calm';
    this.history.push(this.mode);
    if (this.history.length > 30) this.history.shift();
    return MODES[this.mode];
  }

  getMode() {
    return this.mode;
  }
}
