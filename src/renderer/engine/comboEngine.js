/**
 * CyberBeat Keys - Clean Header HUD (Theme text removed)
 */
class ComboEngine {
  constructor() {
    this.combo = 0;
    this.maxCombo = 0;
    this.totalKeys = 0;
    this.wpm = 0;
    this.kpm = 0;
    this.lastHitTime = 0;
    this.comboTimeout = 3000;
    this.keyTimestamps = [];

    this.comboScale = 1.0;
    this.frenzyPulse = 0;
  }

  updateConfig(config) {
    if (config.comboTimeout !== undefined) this.comboTimeout = config.comboTimeout;
  }

  reset() {
    this.combo = 0;
    this.maxCombo = 0;
    this.totalKeys = 0;
    this.wpm = 0;
    this.kpm = 0;
    this.keyTimestamps.length = 0;
  }

  registerKeyHit() {
    const now = Date.now();
    this.totalKeys++;
    this.lastHitTime = now;
    this.keyTimestamps.push(now);

    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    this.comboScale = Math.min(1.4, 1.1 + this.combo * 0.003);
    return this.combo;
  }

  update(dt) {
    const now = Date.now();

    const windowStart = now - 5000;
    this.keyTimestamps = this.keyTimestamps.filter((t) => t >= windowStart);
    this.kpm = Math.round(this.keyTimestamps.length * 12);
    this.wpm = Math.round(this.kpm / 5);

    // Clean combo reset
    if (this.combo > 0) {
      const elapsed = now - this.lastHitTime;
      if (elapsed > this.comboTimeout) {
        this.combo = 0;
      }
    }

    this.comboScale += (1.0 - this.comboScale) * (dt * 14);

    if (this.combo >= 100) {
      this.frenzyPulse = (Math.sin(now * 0.008) + 1) * 0.5;
    } else {
      this.frenzyPulse = 0;
    }
  }

  renderHeaderHUD(ctx, width, height, theme = 'miku-teal') {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';

    const isFrenzy = this.combo >= 100;
    const isSuper = this.combo >= 50;
    const themeColor = isFrenzy ? '#ffe600' : isSuper ? '#ff358b' : '#39c5bb';

    // Left: Live Combo Counter
    ctx.save();
    ctx.translate(18, 16);
    ctx.scale(this.comboScale, this.comboScale);

    ctx.font = '900 italic 14px "Segoe UI", "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Shadow pass
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillText(`${this.combo}x COMBO`, 1, 1);

    // Glow pass
    ctx.fillStyle = themeColor;
    ctx.fillText(`${this.combo}x COMBO`, 0, 0);
    ctx.restore();

    // Right: WPM Hand Speed Meter
    ctx.font = 'bold 11px "Segoe UI", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillText(`${this.wpm} WPM`, width - 17, 17);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${this.wpm} WPM`, width - 18, 16);

    ctx.restore();
  }

  hasActiveCombo() {
    return this.combo > 0 || Math.abs(this.comboScale - 1.0) > 0.01 || this.wpm > 0;
  }
}

if (typeof module !== 'undefined') {
  module.exports = ComboEngine;
}
