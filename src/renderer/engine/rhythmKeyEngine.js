/**
 * CyberBeat Keys - Rhythm Keystroke Engine v8.5 (Arcaea Snakes & Pure Tap/Hold Separation)
 * Features:
 * - Pure Single Tap Notes (短按仅为单点Note，干净清爽)
 * - True Long-Press Hold Beams (长按>140ms动态延伸为立体Hold长条光柱)
 * - Authentic Arcaea Snakes (音弧蛇：竖直下落 + 突然侧向折转弯折到相邻键位)
 * - Left Hand Blue Snakes (#00c8ff) & Right Hand Red Snakes (#ff2a6d)
 * - Arcaea Official Sprites (note.png, note_hold.png, arc_cap.png)
 * - 100% Solid Laser Judgment Line & Full-Width Edge-to-Edge Key Stream Bar
 */
class RhythmKeyEngine {
  constructor(canvasW, canvasH) {
    this.width = canvasW || 400;
    this.height = canvasH || 155;
    this.theme = 'arcaea-hikari';
    this.noteDirection = 'downward';
    this.layoutOrientation = 'horizontal';

    // Traveling Beat Notes
    this.notes = [];
    this.maxNotes = 20;

    // Active Keys for Long Press Detection (keyName -> { x, color, hand, startTime, isHoldConfirmed })
    this.activeKeys = new Map();

    // Recent Keystroke Stream (Full Width Packing)
    this.recentKeys = [];
    this.maxRecentKeys = 60;

    // Judgment Line & Impacts
    this.judgmentY = this.height - 40;
    this.judgmentPulse = 0;
    this.hitBeams = [];
    this.hexShields = [];
    this.ambientParticles = [];

    this.initPhysicalKeyMap();
    this.initHandPartition();
    this.initAmbientParticles();
    this.updateJudgmentPos();
    this.loadTextures();
  }

  loadTextures() {
    this.textures = {};
    const loadList = ['note', 'note_hold', 'arc_cap', 'grade_ex', 'clear_pure'];
    loadList.forEach((name) => {
      const img = new Image();
      img.src = `assets/arcaea/${name}.png`;
      img.onload = () => {
        this.textures[name] = img;
      };
    });
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.updateJudgmentPos();
  }

  setTheme(theme) {
    this.theme = theme || 'arcaea-hikari';
    this.initAmbientParticles();
  }

  setDirection(direction) {
    this.noteDirection = direction || 'downward';
    this.updateJudgmentPos();
  }

  setLayoutOrientation(orientation) {
    this.layoutOrientation = orientation || 'horizontal';
    this.updateJudgmentPos();
  }

  updateJudgmentPos() {
    const isDownward = this.noteDirection === 'downward';
    if (this.layoutOrientation === 'vertical') {
      this.judgmentY = isDownward ? this.height - 48 : 48;
    } else {
      this.judgmentY = isDownward ? this.height - 38 : 38;
    }
  }

  initHandPartition() {
    // Left Hand Keys -> Blue Sapphire Snake (#00c8ff)
    this.leftHandKeys = new Set([
      'Q', 'W', 'E', 'R', 'T',
      'A', 'S', 'D', 'F', 'G',
      'Z', 'X', 'C', 'V',
      '1', '2', '3', '4', '5',
      'TAB', 'CAPS', 'CAPSLOCK', 'SHIFT', 'L_SHIFT',
      'CTRL', 'L_CTRL', 'ALT', 'L_ALT', '`', '~', 'ESC'
    ]);

    // Right Hand Keys -> Red Ruby Snake (#ff2a6d)
    this.rightHandKeys = new Set([
      'Y', 'U', 'I', 'O', 'P',
      'H', 'J', 'K', 'L', ';', "'",
      'B', 'N', 'M', ',', '.', '/',
      '6', '7', '8', '9', '0', '-', '=', '[', ']', '\\',
      'ENTER', 'RETURN', 'BACK', 'SPACE',
      'R_SHIFT', 'R_CTRL', 'R_ALT',
      'LEFT', 'RIGHT', 'UP', 'DOWN', 'DEL', 'INS', 'HOME', 'END', 'PGUP', 'PGDN'
    ]);
  }

  getKeyHand(keyName) {
    const upper = keyName.toUpperCase();
    if (this.leftHandKeys.has(upper)) return 'left';
    if (this.rightHandKeys.has(upper)) return 'right';
    return this.getLaneX(keyName) < this.width / 2 ? 'left' : 'right';
  }

  initPhysicalKeyMap() {
    this.physicalKeyRatio = {
      'ESC': 0.05, 'F1': 0.12, 'F2': 0.18, 'F3': 0.24, 'F4': 0.30,
      'F5': 0.38, 'F6': 0.44, 'F7': 0.50, 'F8': 0.56,
      'F9': 0.64, 'F10': 0.70, 'F11': 0.76, 'F12': 0.82,

      '`': 0.05, '1': 0.11, '2': 0.18, '3': 0.25, '4': 0.32, '5': 0.39,
      '6': 0.46, '7': 0.53, '8': 0.60, '9': 0.67, '0': 0.74, '-': 0.81, '=': 0.88, 'BACK': 0.95,

      'TAB': 0.08, 'Q': 0.15, 'W': 0.22, 'E': 0.29, 'R': 0.36, 'T': 0.43,
      'Y': 0.50, 'U': 0.57, 'I': 0.64, 'O': 0.71, 'P': 0.78, '[': 0.84, ']': 0.90, '\\': 0.94,

      'CAPS': 0.09, 'CAPSLOCK': 0.09, 'A': 0.16, 'S': 0.23, 'D': 0.30, 'F': 0.37, 'G': 0.44,
      'H': 0.51, 'J': 0.58, 'K': 0.65, 'L': 0.72, ';': 0.79, "'": 0.85, 'ENTER': 0.92, 'RETURN': 0.92,

      'SHIFT': 0.10, 'L_SHIFT': 0.10, 'Z': 0.18, 'X': 0.25, 'C': 0.32, 'V': 0.39, 'B': 0.46,
      'N': 0.53, 'M': 0.60, ',': 0.67, '.': 0.74, '/': 0.81, 'R_SHIFT': 0.90,

      'CTRL': 0.08, 'L_CTRL': 0.08, 'WIN': 0.15, 'ALT': 0.22, 'L_ALT': 0.22,
      'SPACE': 0.50, 'R_ALT': 0.75, 'R_CTRL': 0.92,

      'LEFT': 0.78, 'UP': 0.84, 'DOWN': 0.84, 'RIGHT': 0.90
    };
  }

  getLaneX(keyName) {
    const key = keyName.toUpperCase();
    const margin = 20;
    const usableW = this.width - margin * 2;

    if (this.physicalKeyRatio[key] !== undefined) {
      return margin + this.physicalKeyRatio[key] * usableW;
    }

    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
    }
    const ratio = Math.abs(hash % 100) / 100;
    return margin + ratio * usableW;
  }

  isKeyActive(keyName) {
    return this.activeKeys.has(keyName);
  }

  onKeyRepeat(keyName) {
    if (!this.activeKeys.has(keyName)) return;
    const active = this.activeKeys.get(keyName);
    const now = Date.now();

    // Confirm hold state if held > 140ms
    if (!active.isHoldConfirmed && now - active.startTime > 140) {
      active.isHoldConfirmed = true;
    }

    // Keep the existing keycap fresh/highlighted in recentKeys without spamming new duplicates
    const rk = this.recentKeys.find((k) => k.name === keyName);
    if (rk) {
      rk.time = now;
      rk.scale = Math.max(rk.scale, 1.12);
    }
    this.judgmentPulse = Math.max(this.judgmentPulse, 0.4);
  }

  onKeyDown(keyName, combo = 0) {
    // If key is already pressed, handle as repeat and avoid duplicate notes/keycaps
    if (this.activeKeys.has(keyName)) {
      this.onKeyRepeat(keyName);
      return;
    }

    const laneX = this.getLaneX(keyName);
    const hand = this.getKeyHand(keyName);
    const now = Date.now();

    let color = this.getThemePrimaryColor(combo);
    if (this.theme.startsWith('arcaea-')) {
      color = hand === 'left' ? '#00c8ff' : '#ff2a6d';
    }

    // 1. Track Key State for Long Press Detection (starts as false)
    this.activeKeys.set(keyName, {
      name: keyName,
      x: laneX,
      color,
      hand,
      startTime: now,
      isHoldConfirmed: false
    });

    // 2. Recent Keys Stream (Only one entry per distinct key press!)
    this.recentKeys.unshift({
      name: keyName,
      time: now,
      color,
      scale: 1.25
    });
    if (this.recentKeys.length > this.maxRecentKeys) {
      this.recentKeys.pop();
    }

    // 3. Single Tap Traveling Beat Note (Pristine clean single note on normal press)
    if (this.notes.length >= this.maxNotes) {
      this.notes.shift();
    }

    const isDownward = this.noteDirection === 'downward';
    const startY = isDownward ? 18 : this.height - 34;
    const speed = (this.layoutOrientation === 'vertical' ? 14 : 10.5) + Math.min(combo * 0.08, 6);
    const vy = isDownward ? speed : -speed;

    const note = {
      keyName,
      x: laneX,
      y: startY,
      vy,
      width: this.layoutOrientation === 'vertical' ? 32 : 28,
      height: 8,
      color,
      alpha: 1.0,
      trail: [],
      combo,
      hit: false,
      hand
    };
    this.notes.push(note);

    // 4. Impact Beams
    this.judgmentPulse = 1.0;
    this.hitBeams.push({
      x: laneX,
      width: 20,
      alpha: 0.65,
      color
    });
  }

  onKeyUp(keyName) {
    if (this.activeKeys.has(keyName)) {
      const active = this.activeKeys.get(keyName);
      if (active.isHoldConfirmed) {
        // Hold Note Release Impact
        this.judgmentPulse = Math.max(this.judgmentPulse, 0.7);
        this.hitBeams.push({
          x: active.x,
          width: 26,
          alpha: 0.8,
          color: active.color
        });
      }
      this.activeKeys.delete(keyName);
    }
  }

  getThemePrimaryColor(combo = 0) {
    switch (this.theme) {
      case 'arcaea-hikari': return '#40a9ff';
      case 'arcaea-tairitsu': return '#ff4d4f';
      case 'miku-teal': return '#39c5bb';
      case 'sakura-pink': return '#ff66a3';
      case 'arknights-tech': return '#ffb700';
      case 'blue-archive': return '#4db8ff';
      case 'eva-purple': return '#a855f7';
      case 'pyro-flame': return '#ff3d00';
      case 'phigros-neon': return '#00f3ff';
      case 'water-wave': return '#00d2ff';
      case 'star-rail': return '#d4af37';
      case 'touhou-scarlet': return '#ff0055';
      default: return '#39c5bb';
    }
  }

  getThemeSecondaryColor() {
    switch (this.theme) {
      case 'arcaea-hikari': return '#ffffff';
      case 'arcaea-tairitsu': return '#9254de';
      case 'miku-teal': return '#ff358b';
      case 'sakura-pink': return '#ffffff';
      case 'arknights-tech': return '#00f3ff';
      case 'blue-archive': return '#ffe600';
      case 'eva-purple': return '#76ff03';
      case 'pyro-flame': return '#ff9100';
      case 'phigros-neon': return '#ff007f';
      case 'water-wave': return '#ffffff';
      case 'star-rail': return '#8a2be2';
      case 'touhou-scarlet': return '#ffe600';
      default: return '#ff358b';
    }
  }

  initAmbientParticles() {
    this.ambientParticles = [];
    const count = this.layoutOrientation === 'vertical' ? 14 : 10;

    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.25 - Math.random() * 0.45,
        size: Math.random() * 3 + 2,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        alpha: Math.random() * 0.6 + 0.25,
        char: this.getAmbientParticleChar(i)
      });
    }
  }

  getAmbientParticleChar(index) {
    switch (this.theme) {
      case 'arcaea-hikari': return ['✦', '✧', '💎', '◈'][index % 4];
      case 'arcaea-tairitsu': return ['♦', '❖', '✧', '✦'][index % 4];
      case 'miku-teal': return ['♪', '♫', '♩', '✦'][index % 4];
      case 'sakura-pink': return '🌸';
      case 'blue-archive': return ['🪶', '✦', '✧', '★'][index % 4];
      case 'arknights-tech': return ['◆', '◇', '◈', '✦'][index % 4];
      case 'eva-purple': return ['⬡', '⬢', '✦', '▲'][index % 4];
      case 'pyro-flame': return ['🔥', '✦', '✧', '▲'][index % 4];
      case 'phigros-neon': return ['▲', '◆', '✦', '●'][index % 4];
      case 'water-wave': return ['🌊', '💧', '✦', '✧'][index % 4];
      case 'star-rail': return ['✦', '★', '✧', '🚂'][index % 4];
      case 'touhou-scarlet': return ['🦇', '✧', '♦', '♠'][index % 4];
      default: return '✦';
    }
  }

  update(dt, onNoteHit) {
    const isDownward = this.noteDirection === 'downward';
    const targetY = this.judgmentY;
    const now = Date.now();

    // 1. Confirm Long-Press Hold State (only if held > 140ms) & Safety Timeout (20s)
    this.activeKeys.forEach((keyState, kName) => {
      if (now - keyState.startTime > 20000) {
        this.activeKeys.delete(kName);
        return;
      }
      if (!keyState.isHoldConfirmed && now - keyState.startTime > 140) {
        keyState.isHoldConfirmed = true;
      }
    });

    // 2. Update Traveling Beat Notes
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const note = this.notes[i];
      note.trail.unshift({ x: note.x, y: note.y });
      if (note.trail.length > 5) note.trail.pop();

      note.y += note.vy;

      const reached = isDownward ? note.y >= targetY : note.y <= targetY;
      if (reached && !note.hit) {
        note.hit = true;
        if (onNoteHit) {
          onNoteHit(note.x, targetY, note.keyName, note.combo);
        }
      }

      if (reached || note.y < -30 || note.y > this.height + 30) {
        this.notes.splice(i, 1);
      }
    }

    // 3. Judgment Line Pulse
    this.judgmentPulse += (0 - this.judgmentPulse) * (dt * 10);

    // 4. Hit Beams Decay
    for (let i = this.hitBeams.length - 1; i >= 0; i--) {
      const hb = this.hitBeams[i];
      hb.alpha -= dt * 3.5;
      if (hb.alpha <= 0.02) this.hitBeams.splice(i, 1);
    }

    // 5. Recent Keys Scale Decay
    for (const rk of this.recentKeys) {
      rk.scale += (1.0 - rk.scale) * (dt * 10);
    }

    // 6. Ambient Particles
    for (const p of this.ambientParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotSpeed;

      if (p.y < -15) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      }
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
    }
  }

  render(ctx) {
    const w = this.width;
    const h = this.height;
    const themeColor = this.getThemePrimaryColor();

    // 1. Tracks
    this.renderTracks(ctx, w, h, themeColor);

    // 2. Real Long-Press Hold Beams (Only for confirmed >140ms holds)
    this.renderConfirmedHoldBeams(ctx, w, h);

    // 4. Ambient Floating Particles
    this.renderAmbientParticles(ctx);

    // 5. Hit Beams
    this.renderHitBeams(ctx, h);

    // 6. Solid Laser Judgment Line
    this.renderSolidJudgmentLine(ctx, w, themeColor);

    // 7. Traveling Beat Notes (Single Tap Notes)
    this.renderNotes(ctx);

    // 8. Translucent Frosted Glass Keycap Stream (Edge-to-Edge Full Width)
    this.renderTranslucentKeyStream(ctx, w, h, themeColor);
  }

  renderTracks(ctx, w, h, themeColor) {
    ctx.save();
    ctx.strokeStyle = `rgba(${this.hexToRgb(themeColor)}, 0.08)`;
    ctx.lineWidth = 1;

    const lanes = [0.15, 0.32, 0.50, 0.68, 0.85];
    for (const ratio of lanes) {
      const lx = ratio * w;
      ctx.beginPath();
      ctx.moveTo(lx, 10);
      ctx.lineTo(lx, h - 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 🛸 Confirmed Long-Press Hold Note Beams (Only renders when held > 140ms!)
  renderConfirmedHoldBeams(ctx, w, h) {
    let hasConfirmedHold = false;
    this.activeKeys.forEach((k) => {
      if (k.isHoldConfirmed) hasConfirmedHold = true;
    });
    if (!hasConfirmedHold) return;

    const isDownward = this.noteDirection === 'downward';
    const startY = isDownward ? 18 : this.height - 34;
    const targetY = this.judgmentY;
    const topY = Math.min(startY, targetY);
    const bottomY = Math.max(startY, targetY);
    const beamH = bottomY - topY;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    this.activeKeys.forEach((hold) => {
      if (!hold.isHoldConfirmed) return; // Ignore quick single taps!

      const x = hold.x;
      const color = hold.color;

      // 1. Arcaea Hold Note Body
      if (this.textures && this.textures['note_hold']) {
        ctx.globalAlpha = 0.85;
        ctx.drawImage(this.textures['note_hold'], x - 13, topY, 26, beamH);
      } else {
        ctx.beginPath();
        ctx.rect(x - 12, topY, 24, beamH);
        ctx.fillStyle = `rgba(${this.hexToRgb(color)}, 0.3)`;
        ctx.fill();
      }

      // 2. Core Laser Beam
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = 0.95;
      ctx.stroke();

      // 3. Side Rails
      ctx.beginPath();
      ctx.moveTo(x - 12, topY);
      ctx.lineTo(x - 12, bottomY);
      ctx.moveTo(x + 12, topY);
      ctx.lineTo(x + 12, bottomY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.8;
      ctx.stroke();

      // 4. Hold Impact Sparkle
      ctx.beginPath();
      ctx.arc(x, targetY, 5 + Math.sin(Date.now() * 0.02) * 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    ctx.restore();
  }

  renderAmbientParticles(ctx) {
    ctx.save();
    for (const p of this.ambientParticles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;

      ctx.font = `bold ${p.size * 2.8}px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = this.getThemeSecondaryColor();
      ctx.fillText(p.char, 0, 0);

      ctx.restore();
    }
    ctx.restore();
  }

  renderHitBeams(ctx, h) {
    if (this.hitBeams.length === 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const hb of this.hitBeams) {
      ctx.beginPath();
      ctx.rect(hb.x - hb.width / 2, 0, hb.width, h);
      ctx.fillStyle = `rgba(${this.hexToRgb(hb.color)}, ${hb.alpha * 0.35})`;
      ctx.fill();
    }
    ctx.restore();
  }

  // 100% Solid Laser Judgment Line
  renderSolidJudgmentLine(ctx, w, themeColor) {
    const jY = this.judgmentY;
    const pulse = this.judgmentPulse;
    const secondaryColor = this.getThemeSecondaryColor();
    const lineColor = pulse > 0.1 ? secondaryColor : themeColor;

    ctx.save();

    // 1. Wide Ambient Halo
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.moveTo(12, jY);
    ctx.lineTo(w - 12, jY);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 8.0 + pulse * 6.0;
    ctx.globalAlpha = 0.15 + pulse * 0.25;
    ctx.stroke();

    // 2. Medium Laser Glow Beam
    ctx.beginPath();
    ctx.moveTo(12, jY);
    ctx.lineTo(w - 12, jY);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3.5 + pulse * 2.0;
    ctx.globalAlpha = 0.55 + pulse * 0.35;
    ctx.stroke();

    // 3. Crisp Inner Core Line
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.moveTo(12, jY);
    ctx.lineTo(w - 12, jY);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 1.0;
    ctx.stroke();

    // 4. Center Diamond Reticle
    ctx.save();
    ctx.translate(w / 2, jY);
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.rect(-4, -4, 8, 8);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.8;
    ctx.fillStyle = 'rgba(10, 14, 24, 0.9)';
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  renderNotes(ctx) {
    ctx.save();
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
        ctx.globalAlpha = note.alpha * 0.35;
        ctx.stroke();
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, note.alpha);
      const halfW = note.width / 2;
      const halfH = note.height / 2;

      if (this.theme.startsWith('arcaea-') && this.textures && this.textures['note']) {
        // Authentic Arcaea Sprite Note
        ctx.drawImage(this.textures['note'], note.x - halfW, note.y - halfH, note.width, note.height);

        ctx.beginPath();
        ctx.roundRect(note.x - halfW, note.y - halfH, note.width, note.height, 2);
        ctx.strokeStyle = note.color;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else {
        // Note Pill Body
        ctx.beginPath();
        ctx.roundRect(note.x - halfW, note.y - halfH, note.width, note.height, 4);
        ctx.fillStyle = 'rgba(14, 18, 28, 0.9)';
        ctx.fill();

        ctx.strokeStyle = note.color;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(note.x - halfW + 2, note.y - halfH + 2, note.width - 4, note.height - 4, 2);
        ctx.fillStyle = note.color;
        ctx.fill();
      }

      // Note Key Text
      ctx.font = 'bold 7px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(note.keyName, note.x, note.y + 0.5);
      ctx.restore();
    }

    ctx.restore();
  }

  renderTranslucentKeyStream(ctx, w, h, themeColor) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';

    const isDownward = this.noteDirection === 'downward';
    const barX = 10;
    const barY = isDownward ? h - 24 : h - 28;
    const barW = w - 20;
    const barH = 18;

    // Translucent Frosted Glass Bar
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fillStyle = 'rgba(10, 14, 24, 0.35)';
    ctx.fill();
    ctx.strokeStyle = `rgba(${this.hexToRgb(themeColor)}, 0.5)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    if (this.recentKeys.length > 0) {
      let curX = barX + barW - 6;

      for (let i = 0; i < this.recentKeys.length; i++) {
        const rk = this.recentKeys[i];
        const age = (Date.now() - rk.time) / 1000;
        const alpha = Math.max(0.15, 1.0 - age / 4.0);

        const keyW = Math.max(18, rk.name.length * 6.0 + 7);
        curX -= (keyW + 3);
        if (curX < barX + 3) break;

        ctx.save();
        ctx.translate(curX + keyW / 2, barY + barH / 2);
        ctx.scale(rk.scale, rk.scale);
        ctx.globalAlpha = alpha;

        const isHeld = this.activeKeys.has(rk.name);

        // Keycap Frosted Capsule
        ctx.beginPath();
        ctx.roundRect(-keyW / 2, -6.5, keyW, 13, 3);
        ctx.fillStyle = isHeld ? `rgba(${this.hexToRgb(rk.color)}, 0.45)` : 'rgba(18, 24, 38, 0.75)';
        ctx.fill();
        ctx.strokeStyle = isHeld ? '#ffffff' : rk.color;
        ctx.lineWidth = isHeld ? 1.6 : 1.2;
        ctx.stroke();

        ctx.font = 'bold 8px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(rk.name, 0, 0.5);

        ctx.restore();
      }
    } else {
      ctx.font = 'italic 8px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡ 敲击键盘按键即刻映射物理键位打击流', w / 2, barY + barH / 2);
    }

    ctx.restore();
  }

  hasActiveAnimations() {
    return (
      this.notes.length > 0 ||
      this.activeKeys.size > 0 ||
      this.hitBeams.length > 0 ||
      this.judgmentPulse > 0.02 ||
      this.recentKeys.some((rk) => Date.now() - rk.time < 2000)
    );
  }

  hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
  }
}

if (typeof module !== 'undefined') {
  module.exports = RhythmKeyEngine;
}
