(() => {
  const canvas = document.getElementById('cursor-canvas');
  const ctx = canvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;
  let particles = [];
  let enabled = true;
  let theme = 'arcaea-hikari';
  let isAnimating = false;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resize);
  resize();

  function getThemeColors() {
    switch (theme) {
      case 'arcaea-hikari': return ['#40a9ff', '#ffffff', '#69c0ff', '#bae7ff'];
      case 'arcaea-tairitsu': return ['#ff4d4f', '#ff7875', '#9254de', '#ff1a53'];
      case 'miku-teal': return ['#39c5bb', '#ff358b', '#7efff5', '#ffffff'];
      case 'sakura-pink': return ['#ff66a3', '#ffb6c1', '#ffffff', '#ff99c8'];
      case 'arknights-tech': return ['#ffb700', '#00f3ff', '#ffffff', '#ffa000'];
      case 'blue-archive': return ['#4db8ff', '#ffe600', '#ffffff', '#91d5ff'];
      case 'eva-purple': return ['#a855f7', '#76ff03', '#ffffff', '#c084fc'];
      case 'pyro-flame': return ['#ff3d00', '#ff9100', '#ffea00', '#ffffff'];
      default: return ['#40a9ff', '#ffffff', '#69c0ff'];
    }
  }

  function emitSparks(screenX, screenY, keyName) {
    if (!enabled) return;
    const colors = getThemeColors();
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 2.8 + 1.2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        size: Math.random() * 3.5 + 2.0,
        alpha: 1.0,
        color,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        decay: Math.random() * 0.04 + 0.035,
        shape: Math.random() > 0.4 ? 'shard' : 'circle'
      });
    }

    if (!isAnimating) {
      isAnimating = true;
      requestAnimationFrame(loop);
    }
  }

  function loop() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // subtle gravity
      p.rot += p.rotSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0.02) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.shape === 'shard') {
        // Arcaea glass crystal diamond shard
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 1.5);
        ctx.lineTo(p.size, 0);
        ctx.lineTo(0, p.size * 1.5);
        ctx.lineTo(-p.size, 0);
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();

    if (particles.length > 0) {
      requestAnimationFrame(loop);
    } else {
      isAnimating = false;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  if (window.electronAPI) {
    window.electronAPI.getConfig().then((cfg) => {
      enabled = cfg.cursorSparks !== false;
      theme = cfg.theme || 'arcaea-hikari';
    });

    window.electronAPI.onConfigUpdated((newCfg) => {
      if (newCfg.cursorSparks !== undefined) enabled = newCfg.cursorSparks !== false;
      if (newCfg.theme) theme = newCfg.theme;
    });

    window.electronAPI.onKeyEvent((keyData) => {
      if (keyData.event === 'keydown' && enabled) {
        // screenX and screenY provided by main process
        if (keyData.cursorX !== undefined && keyData.cursorY !== undefined) {
          emitSparks(keyData.cursorX, keyData.cursorY, keyData.name);
        }
      }
    });
  }
})();