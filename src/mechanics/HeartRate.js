export class HeartRate {
  constructor() {
    this.base = 65;
    this.value = this.base;
    this.target = this.base;
    this.timer = 0;
    this.max = 180;
    this.min = 40;
  }

  setStress(level = 0) {
    const clamped = Math.max(0, Math.min(1, level / 100));
    this.target = Math.round(this.base + clamped * 70);
  }

  tick(delta) {
    const diff = this.target - this.value;
    this.value += diff * Math.min(1, delta * 2.2);
    this.timer += delta;
    if (this.timer > 4) {
      this.timer = 0;
      this.target = this.base + (this.target > this.base ? -5 : 3);
    }
    this.value = Math.max(this.min, Math.min(this.max, this.value));
    return Math.round(this.value);
  }

  reset() {
    this.value = this.base;
    this.target = this.base;
    this.timer = 0;
  }
}
