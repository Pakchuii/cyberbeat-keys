/**
 * CyberBeat Keys - Bongo Cat Character Animation Engine
 * Full vector-drawn animated cat avatar with left/right reactive paws, facial expressions, and RGB keyboard.
 */
class BongoCatEngine {
  constructor(canvasW, canvasH) {
    this.width = canvasW || 380;
    this.height = canvasH || 185;
    
    // Paw Animation States (0 = up, 1 = pressed down)
    this.leftPawDown = 0;
    this.rightPawDown = 0;
    this.leftPawTarget = 0;
    this.rightPawTarget = 0;
    
    // Facial States
    this.blinkTimer = 0;
    this.isBlinking = false;
    this.mouthOpen = 0;
    this.headBob = 0;

    // Hit particle notes
    this.hitNotes = [];
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
  }

  onKeyHit(keyName, combo = 0) {
    const key = keyName.toUpperCase();
    const leftKeys = new Set(['Q', 'W', 'E', 'R', 'T', 'A', 'S', 'D', 'F', 'G', 'Z', 'X', 'C', 'V', 'SPACE', 'L_SHIFT', 'SHIFT', 'CTRL', 'TAB', '1', '2', '3', '4', '5']);
    
    if (leftKeys.has(key)) {
      this.leftPawDown = 1.0;
      this.leftPawTarget = 0;
    } else {
      this.rightPawDown = 1.0;
      this.rightPawTarget = 0;
    }

    this.mouthOpen = 1.0;
    this.headBob = 1.0;

    // Spawn cute floating music note / star above cat
    const isLeft = leftKeys.has(key);
    const spawnX = isLeft ? this.width / 2 - 45 : this.width / 2 + 45;
    const spawnY = this.height / 2 + 10;
    const symbols = ['♪', '♫', '★', '✨', '⚡'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const color = combo >= 100 ? '#ffe600' : combo >= 50 ? '#ff007f' : '#00f3ff';

    this.hitNotes.push({
      x: spawnX + (Math.random() - 0.5) * 20,
      y: spawnY,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -2.5 - Math.random() * 1.5,
      symbol,
      color,
      alpha: 1.0,
      scale: 1.0,
      life: 0.6,
      maxLife: 0.6
    });
    if (this.hitNotes.length > 8) this.hitNotes.shift();
  }

  update(dt) {
    // Smooth paw decay
    this.leftPawDown += (0 - this.leftPawDown) * (dt * 18);
    this.rightPawDown += (0 - this.rightPawDown) * (dt * 18);
    this.mouthOpen += (0 - this.mouthOpen) * (dt * 12);
    this.headBob += (0 - this.headBob) * (dt * 10);

    // Natural Eye Blink Cycle
    this.blinkTimer += dt;
    if (this.blinkTimer > 3.5) {
      this.isBlinking = true;
      if (this.blinkTimer > 3.65) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    }

    // Update floating music notes
    for (let i = this.hitNotes.length - 1; i >= 0; i--) {
      const n = this.hitNotes[i];
      n.life -= dt;
      if (n.life <= 0) {
        this.hitNotes.splice(i, 1);
        continue;
      }
      n.x += n.vx;
      n.y += n.vy;
      n.scale += dt * 0.8;
      n.alpha = Math.max(0, n.life / n.maxLife);
    }
  }

  render(ctx, combo = 0, wpm = 0, theme = 'phigros-neon') {
    ctx.save();

    const cx = this.width / 2;
    const cy = this.height / 2 + 10 + this.headBob * 2.5;

    // 1. Draw Desk / Table
    this.renderDesk(ctx);

    // 2. Draw Cat Body, Ears, Face
    this.renderCatBody(ctx, cx, cy, combo);

    // 3. Draw RGB Mechanical Keyboard
    this.renderKeyboard(ctx, cx, this.height - 40);

    // 4. Draw Animated Paws
    this.renderPaws(ctx, cx, this.height - 40);

    // 5. Draw Floating Hit Notes
    this.renderHitNotes(ctx);

    ctx.restore();
  }

  renderDesk(ctx) {
    const deskY = this.height - 46;
    ctx.beginPath();
    ctx.rect(14, deskY, this.width - 28, 38);
    ctx.fillStyle = 'rgba(18, 24, 38, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  renderCatBody(ctx, cx, cy, combo) {
    ctx.save();

    // Cat Fur Color
    const furColor = '#ffffff';
    const outlineColor = '#0b0e14';

    // Body (White half-oval)
    ctx.beginPath();
    ctx.ellipse(cx, cy + 20, 60, 48, 0, 0, Math.PI * 2);
    ctx.fillStyle = furColor;
    ctx.fill();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Left Ear
    ctx.beginPath();
    ctx.moveTo(cx - 45, cy - 25);
    ctx.lineTo(cx - 30, cy - 55);
    ctx.lineTo(cx - 10, cy - 35);
    ctx.closePath();
    ctx.fillStyle = furColor;
    ctx.fill();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Left Ear Pink Inside
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy - 27);
    ctx.lineTo(cx - 30, cy - 48);
    ctx.lineTo(cx - 16, cy - 34);
    ctx.closePath();
    ctx.fillStyle = '#ffb6c1';
    ctx.fill();

    // Right Ear
    ctx.beginPath();
    ctx.moveTo(cx + 10, cy - 35);
    ctx.lineTo(cx + 30, cy - 55);
    ctx.lineTo(cx + 45, cy - 25);
    ctx.closePath();
    ctx.fillStyle = furColor;
    ctx.fill();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Right Ear Pink Inside
    ctx.beginPath();
    ctx.moveTo(cx + 16, cy - 34);
    ctx.lineTo(cx + 30, cy - 48);
    ctx.lineTo(cx + 40, cy - 27);
    ctx.closePath();
    ctx.fillStyle = '#ffb6c1';
    ctx.fill();

    // Head Oval
    ctx.beginPath();
    ctx.ellipse(cx, cy - 15, 48, 36, 0, 0, Math.PI * 2);
    ctx.fillStyle = furColor;
    ctx.fill();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Eyes & Expressions
    if (combo >= 80) {
      // 🕶️ Thug Life Cool Sunglasses on High Combo
      this.renderSunglasses(ctx, cx, cy - 16);
    } else if (combo >= 20) {
      // Happy Smiling Eyes (> <)
      ctx.lineWidth = 3;
      ctx.strokeStyle = outlineColor;
      // Left >
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy - 20);
      ctx.lineTo(cx - 16, cy - 15);
      ctx.lineTo(cx - 24, cy - 10);
      ctx.stroke();
      // Right <
      ctx.beginPath();
      ctx.moveTo(cx + 24, cy - 20);
      ctx.lineTo(cx + 16, cy - 15);
      ctx.lineTo(cx + 24, cy - 10);
      ctx.stroke();
    } else if (this.isBlinking) {
      // Blinking Eyes (-)
      ctx.lineWidth = 3;
      ctx.strokeStyle = outlineColor;
      ctx.beginPath();
      ctx.moveTo(cx - 25, cy - 15);
      ctx.lineTo(cx - 13, cy - 15);
      ctx.moveTo(cx + 13, cy - 15);
      ctx.lineTo(cx + 25, cy - 15);
      ctx.stroke();
    } else {
      // Normal Big Anime Eyes (●  ●)
      ctx.fillStyle = outlineColor;
      ctx.beginPath();
      ctx.arc(cx - 19, cy - 16, 5, 0, Math.PI * 2);
      ctx.arc(cx + 19, cy - 16, 5, 0, Math.PI * 2);
      ctx.fill();

      // Eye White Sparkle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 21, cy - 18, 2, 0, Math.PI * 2);
      ctx.arc(cx + 17, cy - 18, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Blush Cheeks (✿)
    ctx.fillStyle = 'rgba(255, 130, 160, 0.55)';
    ctx.beginPath();
    ctx.ellipse(cx - 30, cy - 8, 8, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 30, cy - 8, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute Cat Mouth (:3 or :O)
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (this.mouthOpen > 0.3) {
      // Open mouth :O
      ctx.arc(cx, cy - 5, 5 + this.mouthOpen * 3, 0, Math.PI);
      ctx.fillStyle = '#ff7597';
      ctx.fill();
      ctx.stroke();
    } else {
      // Cat :3 mouth
      ctx.arc(cx - 4, cy - 8, 4, 0.2, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 4, cy - 8, 4, 0.1, Math.PI * 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderSunglasses(ctx, cx, cy) {
    ctx.save();
    ctx.fillStyle = '#111111';
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 1.5;

    // Left lens
    ctx.beginPath();
    ctx.roundRect(cx - 36, cy - 6, 30, 14, 2);
    ctx.fill();
    ctx.stroke();

    // Right lens
    ctx.beginPath();
    ctx.roundRect(cx + 6, cy - 6, 30, 14, 2);
    ctx.fill();
    ctx.stroke();

    // Bridge
    ctx.fillStyle = '#111111';
    ctx.fillRect(cx - 6, cy - 2, 12, 4);

    // Pixel glint
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 30, cy - 3, 4, 4);
    ctx.fillRect(cx - 24, cy, 4, 4);
    ctx.fillRect(cx + 12, cy - 3, 4, 4);
    ctx.fillRect(cx + 18, cy, 4, 4);

    ctx.restore();
  }

  renderKeyboard(ctx, cx, ky) {
    const kw = 170;
    const kh = 32;
    const kx = cx - kw / 2;

    ctx.save();
    // Keyboard frame
    ctx.beginPath();
    ctx.roundRect(kx, ky, kw, kh, 6);
    ctx.fillStyle = '#10141e';
    ctx.fill();
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Keycaps grid with RGB glow
    const cols = 8;
    const rows = 2;
    const keySize = 15;
    const pad = 4;
    const startX = kx + 10;
    const startY = ky + 5;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isLeftHalf = c < 4;
        const isPressed = isLeftHalf ? (this.leftPawDown > 0.4) : (this.rightPawDown > 0.4);

        ctx.beginPath();
        ctx.roundRect(startX + c * (keySize + pad), startY + r * (keySize - 3), keySize, keySize - 4, 2);
        ctx.fillStyle = isPressed ? '#00f3ff' : '#1e2638';
        ctx.fill();
        ctx.strokeStyle = isPressed ? '#ffffff' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  renderPaws(ctx, cx, ky) {
    const outlineColor = '#0b0e14';
    const furColor = '#ffffff';

    // Left Paw
    const lPawY = ky + 6 + this.leftPawDown * 10;
    const lPawX = cx - 45;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(lPawX, lPawY, 14, 18, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = furColor;
    ctx.fill();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Left Paw Pink Pads
    ctx.fillStyle = '#ff85b3';
    ctx.beginPath();
    ctx.arc(lPawX - 2, lPawY + 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right Paw
    const rPawY = ky + 6 + this.rightPawDown * 10;
    const rPawX = cx + 45;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(rPawX, rPawY, 14, 18, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = furColor;
    ctx.fill();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Right Paw Pink Pads
    ctx.fillStyle = '#ff85b3';
    ctx.beginPath();
    ctx.arc(rPawX + 2, rPawY + 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderHitNotes(ctx) {
    ctx.save();
    for (const n of this.hitNotes) {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.scale(n.scale, n.scale);
      ctx.globalAlpha = Math.max(0, n.alpha);
      ctx.font = 'bold 16px "Segoe UI Symbol", sans-serif';
      ctx.fillStyle = n.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.symbol, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
}

if (typeof module !== 'undefined') {
  module.exports = BongoCatEngine;
}
