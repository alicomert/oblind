export class CrisisSystem {
  constructor({ onPulse } = {}) {
    this.intensity = 0;
    this.cooldown = 0;
    this.maxCooldown = 1.1;
    this.onPulse = onPulse;
  }

  tick(delta, dangerLevel) {
    const target = Math.max(0, Math.min(1, dangerLevel));
    this.intensity += (target - this.intensity) * Math.min(1, delta * 2.6);
    this.cooldown = Math.max(0, this.cooldown - delta);

    if (this.intensity > 0.65 && this.cooldown === 0) {
      this.cooldown = this.maxCooldown;
      this.onPulse?.();
      return true;
    }

    return false;
  }

  getIntensity() {
    return this.intensity;
  }

  reset() {
    this.intensity = 0;
    this.cooldown = 0;
  }
}
