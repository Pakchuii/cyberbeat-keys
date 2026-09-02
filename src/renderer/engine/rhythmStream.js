/**
 * CyberBeat Keys - Rhythm Game Beat Track Engine
 * Renders an osu!mania / Phigros style rhythm stream inside the island widget.
 */
class RhythmStream {
  constructor(canvasW, canvasH) {
    this.width = canvasW || 360;
    this.height = canvasH || 150;
    this.notes = [];
    this.recentKeys = [];
    this.maxRecentKeys = 5;
    this.maxNotes = 8;
    this.theme = 'phigros-neon';
    this.judgmentPulse = 0;
    this.judgmentY = 46;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
  }

  setTheme(theme) {
    this.theme = theme;
  }

  getLaneX(keyName) {
    const key = keyName.toUpperCase();
    const margin = 35;
    const usableW = this.width - margin * 2;

    if (key === 'SPACE') return this.width / 2;
    if (key === 'ENTER') return this.width - margin - 15;
    if (key === 'BACK' || key === 'BACKSPACE') return this.width - margin;
    if (key === 'TAB' || key === 'ESC') return margin + 10;
    if (key === 'CTRL' || key === 'SHIFT') return margin + 25;

    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
    }
    const ratio = Math.abs(hash % 100) / 100;
    return margin + ratio * usableW;
  }

  spawnNote(keyName, combo = 0) {
    const startX = this.getLaneX(keyName);
    const startY = this.height - 36;
    const targetY = this.judgmentY;

    if (this.notes.length >= this.maxNotes) {
      this.notes.shift();
    }

    const note = {
      keyName,
      x: startX,
      y: startY,
      targetY,
      vy: -10 - Math.min(combo * 0.08, 6),
      trail: [],
      maxTrail: 4,
      width: Math.max(28, keyName.length * 7 + 12),
      height: 16,
      alpha: 1.0,
      color: this.getNoteColor(combo),
      combo,
      hitDone: false
    };

    this.notes.push(note);

    // Push into recent keycaps
    this.recentKeys.unshift({
      name: keyName,
      time: Date.now(),
      color: note.color,
      scale: 1.2
    });
    if (this.recentKeys.length > this.maxRecentKeys) {
      this.recentKeys.pop();
    }

    return { x: startX, y: startY };
  }

  getNoteColor(combo) {
    if (combo >= 100) return '#ffe600';
    if (combo >= 50) return '#b026ff';
    if (combo >= 20) return '#ff007f';

    switch (this.theme) {
      case 'phigros-neon': return '#00f3ff';
      case 'cyber-blade': return '#00ffcc';
      case 'anime-sakura': return '#ff7597';
      case 'retro-arcade': return '#39ff14';
      case 'minimal-glow': return '#ffffff';
      default: return '#00f3ff';
    }
  }

  triggerJudgmentImpact() {
    this.judgmentPulse = 1.0;
  }

  update(dt, onNoteHit) {
    if (this.judgmentPulse > 0) {
      this.judgmentPulse = Math.max(0, this.judgmentPulse - dt * 6.0);
    }

    for (let i = this.notes.length - 1; i >= 0; i--) {
      const note = this.notes[i];
      note.trail.unshift({ x: note.x, y: note.y, alpha: note.alpha });
      if (note.trail.length > note.maxTrail) note.trail.pop();

      note.y += note.vy;

      if (note.y <= this.judgmentY && !note.hitDone) {
        note.hitDone = true;
        this.triggerJudgmentImpact();
        if (onNoteHit) {
          onNoteHit(note.x, this.judgmentY, note.keyName, note.combo);
        }
      }

      if (note.hitDone) {
        note.alpha -= dt * 8.0;
        if (note.alpha <= 0.05) {
          this.notes.splice(i, 1);
        }
      }
    }

    for (const rk of this.recentKeys) {
      rk.scale += (1.0 - rk.scale) * (dt * 16);
    }
  }

  render(ctx) {
    ctx.save();

    const w = this.width;
    const h = this.height;
    const themeColor = this.getNoteColor(0);

    // 1. Rhythm Track Lane Guides
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 60; x < w - 40; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, this.judgmentY - 10);
      ctx.lineTo(x, h - 36);
      ctx.stroke();
    }

    // 2. Judgment Line (Phigros Style glowing laser bar)
    const jY = this.judgmentY;
    const pulse = this.judgmentPulse;

    ctx.beginPath();
    ctx.moveTo(20, jY);
    ctx.lineTo(w - 20, jY);
    ctx.strokeStyle = pulse > 0.2 ? '#ffe600' : themeColor;
    ctx.lineWidth = 1.5 + pulse * 2.5;
    ctx.stroke();

    // Center Judgment Target Diamond
    ctx.save();
    ctx.translate(w / 2, jY);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = pulse > 0.2 ? '#ffe600' : themeColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-4, -4, 8, 8);
    ctx.restore();

    // 3. Render Traveling Beat Notes (Additive Blending)
    ctx.globalCompositeOperation = 'lighter';
    for (const note of this.notes) {
      if (note.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(note.trail[0].x, note.trail[0].y);
        for (let t = 1; t < note.trail.length; t++) {
          ctx.lineTo(note.trail[t].x, note.trail[t].y);
        }
        ctx.strokeStyle = note.color;
        ctx.lineWidth = note.width * 0.45;
        ctx.globalAlpha = note.alpha * 0.25;
        ctx.stroke();
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, note.alpha);
      const halfW = note.width / 2;
      const halfH = note.height / 2;

      ctx.beginPath();
      ctx.roundRect(note.x - halfW, note.y - halfH, note.width, note.height, 4);
      ctx.fillStyle = 'rgba(15, 20, 32, 0.92)';
      ctx.fill();
      ctx.strokeStyle = note.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = 'bold 9px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(note.keyName, note.x, note.y + 0.5);
      ctx.restore();
    }

    // 4. Render Live Key History Bar at Bottom
    this.renderKeyHistoryBar(ctx, 16, h - 26, w - 32);

    ctx.restore();
  }

  renderKeyHistoryBar(ctx, barX, barY, barW) {
    if (this.recentKeys.length === 0) return;

    ctx.save();
    let curX = barX + barW - 10;

    for (let i = 0; i < this.recentKeys.length; i++) {
      const rk = this.recentKeys[i];
      const age = (Date.now() - rk.time) / 1000;
      const alpha = Math.max(0, 1.0 - age / 1.8);
      if (alpha <= 0.05) continue;

      const keyW = Math.max(26, rk.name.length * 7 + 12);
      curX -= keyW + 6;

      ctx.save();
      ctx.translate(curX + keyW / 2, barY + 10);
      ctx.scale(rk.scale, rk.scale);
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.roundRect(-keyW / 2, -8, keyW, 16, 4);
      ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
      ctx.fill();
      ctx.strokeStyle = rk.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.font = 'bold 9px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(rk.name, 0, 0.5);

      ctx.restore();
    }
    ctx.restore();
  }
}

if (typeof module !== 'undefined') {
  module.exports = RhythmStream;
}
