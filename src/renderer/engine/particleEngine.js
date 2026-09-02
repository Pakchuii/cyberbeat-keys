/**
 * CyberBeat Keys - Rhythm Hit Particle Engine
 * High-performance lightweight bloom effects inside the island widget.
 */
class ParticleEngine {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.slashes = [];
    this.theme = 'phigros-neon';
    this.maxParticles = 30;
    this.maxShockwaves = 4;
    this.maxSlashes = 3;
  }

  setTheme(theme) {
    this.theme = theme;
  }

  clear() {
    this.particles.length = 0;
    this.shockwaves.length = 0;
    this.slashes.length = 0;
  }

  emitHit(x, y, combo = 0, keyName = '', style = 'spark-slash') {
    if (!x && !y) return;

    const isFrenzy = combo >= 100;
    const isSuper = combo >= 50;
    const color = this.getThemePrimaryColor(combo);

    // 1. Shockwave ring
    if (this.shockwaves.length < this.maxShockwaves) {
      this.shockwaves.push({
        x,
        y,
        radius: 3,
        maxRadius: isFrenzy ? 28 : isSuper ? 22 : 16,
        alpha: 1.0,
        color,
        width: 1.8
      });
    }

    // 2. Sparks
    const count = isFrenzy ? 6 : 4;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) this.particles.shift();
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 3.5 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.0,
        size: Math.random() * 2.5 + 1.5,
        color: this.getThemeParticleColor(i, combo),
        life: 0.3,
        maxLife: 0.3,
        drag: 0.92,
        gravity: 0.15
      });
    }

    // 3. Mini Slash
    if (this.slashes.length < this.maxSlashes) {
      this.slashes.push({
        x,
        y,
        angle: (Math.random() - 0.5) * 1.2,
        length: isFrenzy ? 40 : 28,
        width: 2.5,
        alpha: 1.0,
        color: isFrenzy ? '#ffe600' : color
      });
    }
  }

  getThemePrimaryColor(combo) {
    if (combo >= 100) return '#ffe600';
    if (combo >= 50) return '#b026ff';
    if (combo >= 20) return '#ff007f';

    switch (this.theme) {
      case 'phigros-neon': return '#00f3ff';
      case 'cyber-blade': return '#00ffcc';
      case 'anime-sakura': return '#ff85b3';
      case 'retro-arcade': return '#39ff14';
      case 'minimal-glow': return '#ffffff';
      default: return '#00f3ff';
    }
  }

  getThemeParticleColor(index, combo) {
    const colorsMap = {
      'phigros-neon': ['#00f3ff', '#ff007f', '#ffffff'],
      'cyber-blade': ['#00ffcc', '#00a8ff', '#ffe600'],
      'anime-sakura': ['#ff7597', '#ffb6c1', '#ffffff'],
      'retro-arcade': ['#39ff14', '#ffe600', '#ff0055'],
      'minimal-glow': ['#ffffff', '#e0e0e0', '#90caf9']
    };

    if (combo >= 100) {
      const frenzyColors = ['#ffe600', '#ff3d00', '#ff007f', '#ffffff'];
      return frenzyColors[index % frenzyColors.length];
    }

    const palette = colorsMap[this.theme] || colorsMap['phigros-neon'];
    return palette[index % palette.length];
  }

  update(dt) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * (dt * 18);
      sw.alpha -= dt * 5.0;
      if (sw.alpha <= 0.02 || sw.radius >= sw.maxRadius - 1) {
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const sl = this.slashes[i];
      sl.alpha -= dt * 7.0;
      if (sl.alpha <= 0.02) {
        this.slashes.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. Shockwaves
    for (const sw of this.shockwaves) {
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, Math.max(0, sw.radius), 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.width;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.stroke();
    }

    // 2. Slashes
    for (const sl of this.slashes) {
      ctx.save();
      ctx.translate(sl.x, sl.y);
      ctx.rotate(sl.angle);
      ctx.beginPath();
      ctx.moveTo(-sl.length / 2, 0);
      ctx.quadraticCurveTo(0, -sl.width * 2, sl.length / 2, 0);
      ctx.quadraticCurveTo(0, sl.width * 2, -sl.length / 2, 0);
      ctx.fillStyle = sl.color;
      ctx.globalAlpha = Math.max(0, sl.alpha);
      ctx.fill();
      ctx.restore();
    }

    // 3. Sparks
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.translate(p.x, p.y);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }
  hasActiveParticles() {
    return (
      this.particles.length > 0 ||
      this.shockwaves.length > 0 ||
      this.slashes.length > 0
    );
  }
}

if (typeof module !== 'undefined') {
  module.exports = ParticleEngine;
}
