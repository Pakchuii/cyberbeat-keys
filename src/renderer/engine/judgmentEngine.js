/**
 * CyberBeat Keys - Theme-Harmonized Floating Judgment Engine v5.0 (Clean Minimal Mode)
 */
class JudgmentEngine {
  constructor() {
    this.popups = [];
    this.maxPopups = 4;
    this.theme = 'arcaea-hikari';
    this.showJudgmentText = false; // Default FALSE: keeps screen pure, clean, and unblocked!
  }

  setTheme(theme) {
    this.theme = theme || 'arcaea-hikari';
  }

  updateConfig(config) {
    if (config.theme) this.setTheme(config.theme);
    if (config.showJudgmentText !== undefined) {
      this.showJudgmentText = Boolean(config.showJudgmentText);
    }
  }

  getThemeColors() {
    switch (this.theme) {
      case 'arcaea-hikari': return { primary: '#40a9ff', secondary: '#ffffff', glow: '#69c0ff' };
      case 'arcaea-tairitsu': return { primary: '#ff4d4f', secondary: '#9254de', glow: '#ff7875' };
      case 'miku-teal': return { primary: '#39c5bb', secondary: '#ffffff', glow: '#39c5bb' };
      case 'sakura-pink': return { primary: '#ff66a3', secondary: '#ffb3d9', glow: '#ff66a3' };
      case 'arknights-tech': return { primary: '#ffb700', secondary: '#00f3ff', glow: '#ffb700' };
      case 'blue-archive': return { primary: '#4db8ff', secondary: '#ffe600', glow: '#4db8ff' };
      case 'eva-purple': return { primary: '#a855f7', secondary: '#76ff03', glow: '#a855f7' };
      case 'pyro-flame': return { primary: '#ff3d00', secondary: '#ff9100', glow: '#ff3d00' };
      case 'phigros-neon': return { primary: '#00f3ff', secondary: '#ff007f', glow: '#00f3ff' };
      case 'water-wave': return { primary: '#00d2ff', secondary: '#3a7bd5', glow: '#00d2ff' };
      case 'star-rail': return { primary: '#d4af37', secondary: '#8a2be2', glow: '#d4af37' };
      case 'touhou-scarlet': return { primary: '#ff0055', secondary: '#ffe600', glow: '#ff0055' };
      default: return { primary: '#39c5bb', secondary: '#ffffff', glow: '#39c5bb' };
    }
  }

  spawnJudgment(x, y, wpm = 0, combo = 0) {
    if (!this.showJudgmentText) return; // Clean & pure when disabled!

    if (this.popups.length >= this.maxPopups) {
      this.popups.shift();
    }

    const colors = this.getThemeColors();
    const isArcaea = this.theme === 'arcaea-hikari' || this.theme === 'arcaea-tairitsu';

    let text = 'PURE';
    let color = colors.primary;

    if (isArcaea) {
      if (combo >= 100 || wpm >= 100) {
        text = '✦ PURE ✦';
        color = '#ffe600';
      } else if (combo >= 25 || wpm >= 60) {
        text = 'PURE';
        color = this.theme === 'arcaea-hikari' ? '#40a9ff' : '#ff4d4f';
      } else {
        text = 'FAR';
        color = '#ff9c6e';
      }
    } else {
      if (combo >= 100 || wpm >= 110) {
        text = 'CRITICAL!';
        color = '#ffe600';
      } else if (combo >= 50 || wpm >= 75) {
        text = 'PERFECT!';
        color = colors.primary;
      } else {
        text = 'GREAT!';
        color = colors.secondary;
      }
    }

    this.popups.push({
      x,
      y: y - 6,
      text,
      color,
      alpha: 1.0,
      scale: 1.2,
      vy: -1.0,
      life: 0.35,
      maxLife: 0.35
    });
  }

  update(dt) {
    if (!this.showJudgmentText) {
      this.popups = [];
      return;
    }
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.popups.splice(i, 1);
        continue;
      }
      p.y += p.vy;
      p.scale += (1.0 - p.scale) * (dt * 12);
      p.alpha = Math.max(0, p.life / p.maxLife);
    }
  }

  render(ctx) {
    if (!this.showJudgmentText || this.popups.length === 0) return;

    ctx.save();
    for (const p of this.popups) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(p.scale, p.scale);
      ctx.globalAlpha = Math.max(0, p.alpha);

      // Crisp Text Label
      ctx.font = '900 10px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, 0, 0);

      ctx.restore();
    }
    ctx.restore();
  }

  hasActivePopups() {
    return this.showJudgmentText && this.popups.length > 0;
  }
}

if (typeof module !== 'undefined') {
  module.exports = JudgmentEngine;
}
