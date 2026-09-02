/**
 * CyberBeat Keys - Settings Window Controller v8.0 (Arcaea Edition)
 */
(() => {
  const audioPreview = new AudioEngine();
  let currentConfig = {};

  // DOM Elements
  const tabItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const themeCards = document.querySelectorAll('[data-theme]');
  const bgCards = document.querySelectorAll('[data-bg]');
  const soundCards = document.querySelectorAll('[data-sound]');

  // Background Controls
  const btnSelectBg = document.getElementById('btn-select-bg');
  const labelCustomBg = document.getElementById('label-custom-bg');
  const rangeBgPosX = document.getElementById('range-bg-pos-x');
  const rangeBgPosY = document.getElementById('range-bg-pos-y');
  const rangeBgScale = document.getElementById('range-bg-scale');
  const rangeBgOpacity = document.getElementById('range-bg-opacity');

  // Dock & Rhythm Controls
  const selectOrientation = document.getElementById('select-orientation');
  const selectDockSize = document.getElementById('select-dock-size');
  const selectNoteDir = document.getElementById('select-note-dir');
  const selectDockPos = document.getElementById('select-dock-pos');
  const checkClickthrough = document.getElementById('check-clickthrough');
  const checkWidgetVisible = document.getElementById('check-widget-visible');
  const checkShowJudgment = document.getElementById('check-show-judgment');
  const checkAutoStart = document.getElementById('check-auto-start');

  // Audio Controls
  const btnSelectAudio = document.getElementById('btn-select-audio');
  const labelCustomAudio = document.getElementById('label-custom-audio');
  const descCustomAudio = document.getElementById('desc-custom-audio');
  const checkAudioEnabled = document.getElementById('check-audio-enabled');
  const checkPitchMod = document.getElementById('check-pitch-mod');
  const rangeVolume = document.getElementById('range-volume');
  const btnClose = document.getElementById('btn-close');

  // Test Typing Area
  const inputTestTyping = document.getElementById('input-test-typing');
  const statCombo = document.getElementById('stat-combo');
  const statWpm = document.getElementById('stat-wpm');
  const statRank = document.getElementById('stat-rank');

  let testCombo = 0;
  let testTimestamps = [];
  let testTimer = null;

  // Tab Navigation
  tabItems.forEach((item) => {
    item.addEventListener('click', () => {
      tabItems.forEach((i) => i.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      item.classList.add('active');
      const tabId = item.getAttribute('data-tab');
      document.getElementById(tabId)?.classList.add('active');
    });
  });

  // Load configuration
  if (window.electronAPI) {
    window.electronAPI.getConfig().then((cfg) => {
      currentConfig = cfg;
      applyToUI(cfg);
    });

    window.electronAPI.onConfigUpdated((newCfg) => {
      currentConfig = newCfg;
      applyToUI(newCfg);
    });
  }

  function updateSizeOptions(orientation, selectedSize) {
    if (!selectDockSize) return;
    selectDockSize.innerHTML = '';

    if (orientation === 'vertical') {
      const opt1 = new Option('📱 侧边紧凑 (180 × 480)', 'vertical-compact');
      const opt2 = new Option('🖥️ 侧边标准 (195 × 560)', 'vertical-standard');
      const opt3 = new Option('🎮 巨幕长瀑布流 (220 × 680)', 'vertical-tall');
      selectDockSize.add(opt1);
      selectDockSize.add(opt2);
      selectDockSize.add(opt3);
      selectDockSize.value = selectedSize && selectedSize.startsWith('vertical-') ? selectedSize : 'vertical-standard';
    } else {
      const opt1 = new Option('📱 极简紧凑 (350 × 135)', 'compact');
      const opt2 = new Option('💻 标准精致 (400 × 155)', 'standard');
      const opt3 = new Option('🖥️ 宽屏沉浸 (480 × 160)', 'wide');
      const opt4 = new Option('🎮 巨幕震撼 (520 × 180)', 'large');
      selectDockSize.add(opt1);
      selectDockSize.add(opt2);
      selectDockSize.add(opt3);
      selectDockSize.add(opt4);
      selectDockSize.value = selectedSize && !selectedSize.startsWith('vertical-') ? selectedSize : 'standard';
    }
  }

  function applyToUI(cfg) {
    audioPreview.updateConfig(cfg);

    // 1. Themes (12 Themes)
    themeCards.forEach((card) => {
      if (card.getAttribute('data-theme') === (cfg.theme || 'arcaea-hikari')) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // 2. Background
    bgCards.forEach((card) => {
      if (card.getAttribute('data-bg') === (cfg.bgPreset || 'preset-miku')) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    if (rangeBgPosX) rangeBgPosX.value = cfg.bgPosX !== undefined ? cfg.bgPosX : 50;
    if (rangeBgPosY) rangeBgPosY.value = cfg.bgPosY !== undefined ? cfg.bgPosY : 50;
    if (rangeBgScale) rangeBgScale.value = cfg.bgScale !== undefined ? cfg.bgScale : 100;
    if (rangeBgOpacity) rangeBgOpacity.value = cfg.bgOpacity !== undefined ? cfg.bgOpacity : 0.35;
    if (labelCustomBg) {
      labelCustomBg.textContent = cfg.customBgPath ? `当前: ${cfg.customBgPath.split(/[\\/]/).pop()}` : '支持 PNG / JPG / WEBP / GIF 图片';
    }

    // 3. Layout & Dock
    if (selectOrientation) {
      selectOrientation.value = cfg.layoutOrientation || 'horizontal';
      updateSizeOptions(selectOrientation.value, cfg.dockSize);
    }
    if (selectNoteDir) selectNoteDir.value = cfg.noteDirection || 'downward';
    if (selectDockPos) selectDockPos.value = cfg.dockPosition || 'bottom-right';
    if (checkClickthrough) checkClickthrough.checked = Boolean(cfg.clickThrough);
    if (checkWidgetVisible) checkWidgetVisible.checked = cfg.widgetVisible !== false;
    if (checkShowJudgment) checkShowJudgment.checked = Boolean(cfg.showJudgmentText);
    if (checkAutoStart) checkAutoStart.checked = Boolean(cfg.autoStart);

    // 4. Audio (17 Soundpacks)
    soundCards.forEach((card) => {
      if (card.getAttribute('data-sound') === (cfg.soundPack || 'arcaea-pure')) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    if (labelCustomAudio && descCustomAudio) {
      if (cfg.customAudioPath) {
        const name = cfg.customAudioPath.split(/[\\/]/).pop();
        labelCustomAudio.textContent = `已加载: ${name}`;
        descCustomAudio.textContent = name;
      }
    }

    if (checkAudioEnabled) checkAudioEnabled.checked = cfg.audioEnabled !== false;
    if (checkPitchMod) checkPitchMod.checked = cfg.pitchModulation !== false;
    if (rangeVolume) rangeVolume.value = cfg.audioVolume !== undefined ? cfg.audioVolume : 0.75;
  }

  function saveOption(key, value) {
    currentConfig[key] = value;
    if (window.electronAPI) {
      window.electronAPI.saveConfig({ [key]: value });
    }
  }

  // --- Theme Selection ---
  themeCards.forEach((card) => {
    card.addEventListener('click', () => {
      themeCards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      const selected = card.getAttribute('data-theme');
      saveOption('theme', selected);
      audioPreview.playKey('ENTER', 10, true);
    });
  });

  // --- Background Presets ---
  bgCards.forEach((card) => {
    card.addEventListener('click', () => {
      bgCards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      const selected = card.getAttribute('data-bg');
      saveOption('bgPreset', selected);
      saveOption('customBgPath', '');
      if (labelCustomBg) labelCustomBg.textContent = '已启用预设背景';
    });
  });

  // --- Custom Background Image File Picker ---
  if (btnSelectBg && window.electronAPI) {
    btnSelectBg.addEventListener('click', async () => {
      const filePath = await window.electronAPI.selectBgImage();
      if (filePath && labelCustomBg) {
        labelCustomBg.textContent = `当前: ${filePath.split(/[\\/]/).pop()}`;
        bgCards.forEach((c) => c.classList.remove('active'));
      }
    });
  }

  if (rangeBgPosX) {
    rangeBgPosX.addEventListener('input', (e) => {
      saveOption('bgPosX', parseInt(e.target.value, 10));
    });
  }

  if (rangeBgPosY) {
    rangeBgPosY.addEventListener('input', (e) => {
      saveOption('bgPosY', parseInt(e.target.value, 10));
    });
  }

  if (rangeBgScale) {
    rangeBgScale.addEventListener('input', (e) => {
      saveOption('bgScale', parseInt(e.target.value, 10));
    });
  }

  if (rangeBgOpacity) {
    rangeBgOpacity.addEventListener('input', (e) => {
      saveOption('bgOpacity', parseFloat(e.target.value));
    });
  }

  // --- Orientation & Sizes ---
  if (selectOrientation) {
    selectOrientation.addEventListener('change', (e) => {
      const orient = e.target.value;
      const defaultSize = orient === 'vertical' ? 'vertical-standard' : 'standard';
      updateSizeOptions(orient, defaultSize);
      saveOption('layoutOrientation', orient);
      saveOption('dockSize', defaultSize);
      saveOption('customWidth', null);
      saveOption('customHeight', null);
    });
  }

  if (selectDockSize) {
    selectDockSize.addEventListener('change', (e) => {
      saveOption('dockSize', e.target.value);
      saveOption('customWidth', null);
      saveOption('customHeight', null);
    });
  }

  if (selectNoteDir) {
    selectNoteDir.addEventListener('change', (e) => {
      saveOption('noteDirection', e.target.value);
    });
  }

  if (selectDockPos) {
    selectDockPos.addEventListener('change', (e) => {
      saveOption('dockPosition', e.target.value);
      saveOption('widgetX', null);
      saveOption('widgetY', null);
    });
  }

  if (checkClickthrough) {
    checkClickthrough.addEventListener('change', (e) => {
      saveOption('clickThrough', e.target.checked);
    });
  }

  if (checkWidgetVisible) {
    checkWidgetVisible.addEventListener('change', (e) => {
      saveOption('widgetVisible', e.target.checked);
    });
  }

  if (checkShowJudgment) {
    checkShowJudgment.addEventListener('change', (e) => {
      saveOption('showJudgmentText', e.target.checked);
    });
  }

  if (checkAutoStart) {
    checkAutoStart.addEventListener('change', (e) => {
      saveOption('autoStart', e.target.checked);
    });
  }

  // --- Sound Cards Selection ---
  soundCards.forEach((card) => {
    card.addEventListener('click', () => {
      soundCards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      const selected = card.getAttribute('data-sound');
      saveOption('soundPack', selected);
      audioPreview.updateConfig({ soundPack: selected });
      audioPreview.playKey('SPACE', 30, true);
    });
  });

  // --- Custom Audio File Picker ---
  if (btnSelectAudio && window.electronAPI) {
    btnSelectAudio.addEventListener('click', async () => {
      const filePath = await window.electronAPI.selectAudioFile();
      if (filePath) {
        const name = filePath.split(/[\\/]/).pop();
        if (labelCustomAudio) labelCustomAudio.textContent = `已加载: ${name}`;
        if (descCustomAudio) descCustomAudio.textContent = name;
        soundCards.forEach((c) => c.classList.remove('active'));
        const cardCustom = document.getElementById('card-custom-audio');
        if (cardCustom) cardCustom.classList.add('active');
        audioPreview.updateConfig({ customAudioPath: filePath, soundPack: 'custom-audio' });
        setTimeout(() => audioPreview.playKey('SPACE', 10, true), 200);
      }
    });
  }

  if (checkAudioEnabled) {
    checkAudioEnabled.addEventListener('change', (e) => {
      saveOption('audioEnabled', e.target.checked);
      audioPreview.updateConfig({ audioEnabled: e.target.checked });
    });
  }

  if (checkPitchMod) {
    checkPitchMod.addEventListener('change', (e) => {
      saveOption('pitchModulation', e.target.checked);
      audioPreview.updateConfig({ pitchModulation: e.target.checked });
    });
  }

  if (rangeVolume) {
    rangeVolume.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      saveOption('audioVolume', vol);
      audioPreview.updateConfig({ audioVolume: vol });
    });
  }

  // Close Button
  if (btnClose && window.electronAPI) {
    btnClose.addEventListener('click', () => {
      window.electronAPI.closeSettings();
    });
  }

  // --- Test Typing Range ---
  if (inputTestTyping) {
    inputTestTyping.addEventListener('keydown', (e) => {
      testCombo++;
      const now = Date.now();
      testTimestamps.push(now);

      const windowStart = now - 5000;
      testTimestamps = testTimestamps.filter((t) => t >= windowStart);
      const kpm = Math.round(testTimestamps.length * 12);
      const wpm = Math.round(kpm / 5);

      if (statCombo) statCombo.textContent = `${testCombo}x`;
      if (statWpm) statWpm.textContent = `${wpm}`;
      if (statRank) {
        if (testCombo >= 100 || wpm >= 100) statRank.textContent = 'PURE (SHINY)';
        else if (testCombo >= 25 || wpm >= 50) statRank.textContent = 'PURE';
        else statRank.textContent = 'FAR';
      }

      audioPreview.playKey(e.key.toUpperCase(), testCombo, true);

      clearTimeout(testTimer);
      testTimer = setTimeout(() => {
        testCombo = 0;
        if (statCombo) statCombo.textContent = '0x';
      }, currentConfig.comboTimeout || 3000);
    });
  }
})();
