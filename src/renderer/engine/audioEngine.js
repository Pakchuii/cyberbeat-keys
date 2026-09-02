/**
 * CyberBeat Keys - Multi-Instrument & Soundpack Synthesizer v8.0 (Arcaea Glass Engine Included)
 */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.75;
    this.soundPack = 'arcaea-pure';
    this.pitchModulation = true;
    this.customAudioBuffer = null;
    this.loadedCustomPath = '';
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (err) {
      console.warn('[AudioEngine] Web Audio not available:', err);
    }
  }

  updateConfig(config) {
    if (config.audioEnabled !== undefined) this.enabled = config.audioEnabled;
    if (config.audioVolume !== undefined) this.volume = config.audioVolume;
    if (config.soundPack !== undefined) this.soundPack = config.soundPack;
    if (config.pitchModulation !== undefined) this.pitchModulation = config.pitchModulation;

    if (config.customAudioPath && config.customAudioPath !== this.loadedCustomPath) {
      this.loadCustomAudio(config.customAudioPath);
    }
  }

  async loadCustomAudio(filePath) {
    try {
      this.ensureContextRunning();
      this.loadedCustomPath = filePath;
      const response = await fetch(`file://${filePath.replace(/\\/g, '/')}`);
      const arrayBuffer = await response.arrayBuffer();
      this.ctx.decodeAudioData(arrayBuffer, (decoded) => {
        this.customAudioBuffer = decoded;
      });
    } catch (err) {
      console.error('[AudioEngine] Failed to load custom audio:', err);
    }
  }

  ensureContextRunning() {
    if (!this.ctx) this.initAudioContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playKey(keyName, combo = 0, isKeyDown = true) {
    if (!this.enabled || !this.ctx || this.volume <= 0) return;
    this.ensureContextRunning();

    const t = this.ctx.currentTime;
    const microVar = 1.0 + (Math.random() - 0.5) * 0.03;
    const comboFactor = this.pitchModulation ? Math.min(1.4, 1.0 + combo * 0.003) : 1.0;
    const pitchFactor = comboFactor * microVar;

    if (this.soundPack === 'custom-audio' && this.customAudioBuffer) {
      this.playCustomBuffer(t, pitchFactor);
      return;
    }

    switch (this.soundPack) {
      // --- 💎 Arcaea Iconic Glass Chime Hitsound ---
      case 'arcaea-pure':
        this.playArcaeaPure(t, combo, pitchFactor);
        break;

      // --- 🎵 Melodic Musical Instruments ---
      case 'crystal-piano':
        this.playCrystalPiano(t, combo, pitchFactor);
        break;
      case 'guzheng-pluck':
        this.playGuzhengPluck(t, combo, pitchFactor);
        break;
      case 'acoustic-guitar':
        this.playAcousticGuitar(t, combo, pitchFactor);
        break;
      case 'music-box':
        this.playMusicBox(t, combo, pitchFactor);
        break;
      case 'violin-pizz':
        this.playViolinPizz(t, combo, pitchFactor);
        break;
      case 'wooden-fish':
        this.playWoodenFish(t, pitchFactor);
        break;

      // --- 🎮 Rhythm Game & Switch Packs ---
      case 'rhythm-hit':
        this.playRhythmHit(t, pitchFactor);
        break;
      case 'mahjong-thock':
        this.playMahjongThock(t, isKeyDown, microVar);
        break;
      case 'blue-switch':
        this.playBlueSwitch(t, isKeyDown, microVar);
        break;
      case 'water-drop':
        this.playWaterDrop(t, pitchFactor);
        break;
      case 'laser-gun':
        this.playLaserGun(t, pitchFactor);
        break;
      case 'gun-trigger':
        this.playGunTrigger(t, pitchFactor);
        break;
      case 'cyber-blade':
        this.playCyberBlade(t, pitchFactor);
        break;
      case 'arcade-8bit':
        this.playArcade8Bit(t, combo);
        break;
      case 'anime-bell':
        this.playAnimeBell(t, pitchFactor);
        break;
      default:
        this.playArcaeaPure(t, combo, pitchFactor);
        break;
    }
  }

  // 💎 0. Arcaea Signature Pure Tap Hitsound (Ultra-Crisp & Snappy Crystal Transient)
  playArcaeaPure(t, combo, pitchFactor) {
    const scale = [2093.0, 2349.32, 2637.02, 3135.96, 3520.0];
    const highFreq = scale[combo % scale.length] * pitchFactor;

    // 1. Snappy Attack Transient (Micro Pitch Drop)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(2600 * pitchFactor, t);
    osc1.frequency.exponentialRampToValueAtTime(320 * pitchFactor, t + 0.022);

    gain1.gain.setValueAtTime(this.volume * 0.95, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.035);

    // 2. High-Frequency Glass Crystal Resonance
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(highFreq, t);

    gain2.gain.setValueAtTime(this.volume * 0.6, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.045);

    // 3. Crisp Glass Click Tap Noise (5ms)
    this.playNoiseBurst(t, 0.006, 5600 * pitchFactor, this.volume * 0.45);
  }

  playCustomBuffer(t, pitchFactor) {
    const source = this.ctx.createBufferSource();
    source.buffer = this.customAudioBuffer;
    source.playbackRate.setValueAtTime(pitchFactor, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume, t);

    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start(t);
  }

  // 1. 🎹 空灵水晶钢琴 (Crystal Piano)
  playCrystalPiano(t, combo, pitchFactor) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
    const freq = scale[combo % scale.length] * pitchFactor;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.003, t);

    gain.gain.setValueAtTime(this.volume * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.35);
    osc2.stop(t + 0.35);
  }

  // 2. 🪕 古风古筝琵琶 (Guzheng & Pipa Pluck)
  playGuzhengPluck(t, combo, pitchFactor) {
    const pentatonic = [329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
    const freq = pentatonic[combo % pentatonic.length] * pitchFactor;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.05, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.02);

    gain.gain.setValueAtTime(this.volume * 0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.28);

    this.playNoiseBurst(t, 0.02, 3500, this.volume * 0.3);
  }

  // 3. 🎸 清澈原声吉他 (Acoustic Guitar Pluck)
  playAcousticGuitar(t, combo, pitchFactor) {
    const chords = [220.00, 277.18, 329.63, 440.00, 554.37, 659.25];
    const freq = chords[combo % chords.length] * pitchFactor;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, t);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.998, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.25);

    gain.gain.setValueAtTime(this.volume * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.3);
    osc2.stop(t + 0.3);
  }

  // 4. 🔔 梦幻神圣八音盒 (Music Box / Celesta)
  playMusicBox(t, combo, pitchFactor) {
    const scale = [1046.50, 1174.66, 1318.51, 1396.91, 1567.98, 1760.00, 2093.00];
    const freq = scale[combo % scale.length] * pitchFactor;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(this.volume * 0.75, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  // 5. 🎻 幻想小提琴拨弦 (Violin Pizzicato)
  playViolinPizz(t, combo, pitchFactor) {
    const notes = [440.00, 493.88, 554.37, 587.33, 659.25, 739.99, 880.00];
    const freq = notes[combo % notes.length] * pitchFactor;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.08, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.015);

    gain.gain.setValueAtTime(this.volume * 0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // 6. 🪵 解压赛博木鱼 (Wooden Fish)
  playWoodenFish(t, pitchFactor) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(560 * pitchFactor, t);
    osc.frequency.exponentialRampToValueAtTime(210, t + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.95, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);

    this.playNoiseBurst(t, 0.015, 850, this.volume * 0.35);
  }

  playRhythmHit(t, pitchFactor) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(460 * pitchFactor, t);
    osc.frequency.exponentialRampToValueAtTime(110 * pitchFactor, t + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);

    this.playNoiseBurst(t, 0.04, 2900 * pitchFactor, this.volume * 0.38);
  }

  playMahjongThock(t, isKeyDown, microVar) {
    const freq = (isKeyDown ? 180 + Math.random() * 25 : 260 + Math.random() * 25) * microVar;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.06);

    gain.gain.setValueAtTime(this.volume * 0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);

    this.playNoiseBurst(t, 0.02, 1200, this.volume * 0.25);
  }

  playBlueSwitch(t, isKeyDown, microVar) {
    const baseFreq = (isKeyDown ? 3300 : 2800) * microVar;
    this.playNoiseBurst(t, 0.015, baseFreq, this.volume * 0.7);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.02);

    gain.gain.setValueAtTime(this.volume * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.02);
  }

  playWaterDrop(t, pitchFactor) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = (620 + Math.random() * 80) * pitchFactor;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2.3, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, t + 0.12);

    gain.gain.setValueAtTime(this.volume * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playLaserGun(t, pitchFactor) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2800 * pitchFactor, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.07);

    gain.gain.setValueAtTime(this.volume * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  playGunTrigger(t, pitchFactor) {
    this.playNoiseBurst(t, 0.02, 3800 * pitchFactor, this.volume * 0.75);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340 * pitchFactor, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  playCyberBlade(t, pitchFactor) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1450 * pitchFactor, t);
    osc.frequency.exponentialRampToValueAtTime(220 * pitchFactor, t + 0.09);

    gain.gain.setValueAtTime(this.volume * 0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);

    this.playNoiseBurst(t, 0.05, 3400 * pitchFactor, this.volume * 0.45);
  }

  playArcade8Bit(t, combo) {
    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    const noteFreq = pentatonic[combo % pentatonic.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(noteFreq, t);

    gain.gain.setValueAtTime(this.volume * 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  playAnimeBell(t, pitchFactor) {
    const freqs = [1046.50, 1318.51, 1567.98, 2093.00];
    const baseFreq = freqs[Math.floor(Math.random() * freqs.length)] * pitchFactor;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.02, t + 0.18);

    gain.gain.setValueAtTime(this.volume * 0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  playNoiseBurst(t, duration, centerFreq, gainVal) {
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    if (bufferSize <= 0) return;

    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerFreq, t);
    filter.Q.setValueAtTime(1.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(t);
    whiteNoise.stop(t + duration);
  }
}

if (typeof module !== 'undefined') {
  module.exports = AudioEngine;
}
