/**
 * CyberBeat Keys - Desktop System Music Audio Visualizer Engine v9.0
 * Features:
 * - Ultra-low latency Electron loopback system audio capture
 * - 64-band FFT Frequency & Waveform analysis
 * - Dynamic Bass energy detection for judgment line & background pulsing
 * - Zero feedback loop guarantee
 */
class VisualizerEngine {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.analyser = null;
    this.stream = null;
    this.freqData = new Uint8Array(64);
    this.timeData = new Uint8Array(64);
    this.energy = 0;
    this.bassEnergy = 0;
    this.isCapturing = false;
  }

  async start() {
    if (this.isCapturing || !this.enabled) return;
    try {
      let sourceId = null;
      if (window.electronAPI && window.electronAPI.getDesktopAudioSource) {
        sourceId = await window.electronAPI.getDesktopAudioSource();
      }

      const constraints = {
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            ...(sourceId ? { chromeMediaSourceId: sourceId } : {})
          }
        },
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            ...(sourceId ? { chromeMediaSourceId: sourceId } : {}),
            maxWidth: 1,
            maxHeight: 1
          }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      const sourceNode = this.ctx.createMediaStreamSource(this.stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.75;
      sourceNode.connect(this.analyser);
      // NOTE: Do not connect to destination to avoid loopback audio echo!

      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
      this.isCapturing = true;
    } catch (err) {
      // Audio capture gracefully falls back if permission is disabled
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.ctx) {
      try { this.ctx.close(); } catch (e) {}
      this.ctx = null;
    }
    this.isCapturing = false;
  }

  setEnabled(enable) {
    this.enabled = Boolean(enable);
    if (!this.enabled && this.isCapturing) {
      this.stop();
    } else if (this.enabled && !this.isCapturing) {
      this.start();
    }
  }

  update(dt) {
    if (!this.isCapturing || !this.analyser || !this.enabled) {
      this.energy = Math.max(0, this.energy - dt * 2.0);
      this.bassEnergy = Math.max(0, this.bassEnergy - dt * 2.0);
      return;
    }

    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getByteTimeDomainData(this.timeData);

    let sum = 0;
    let bassSum = 0;
    const len = this.freqData.length;
    for (let i = 0; i < len; i++) {
      const val = this.freqData[i] / 255;
      sum += val;
      if (i < 8) bassSum += val;
    }
    const currentEnergy = sum / len;
    const currentBass = bassSum / Math.min(len, 8);

    this.energy += (currentEnergy - this.energy) * (dt * 12);
    this.bassEnergy += (currentBass - this.bassEnergy) * (dt * 14);
  }

  getFrequencyData() {
    return this.freqData;
  }

  getWaveformData() {
    return this.timeData;
  }

  getBassEnergy() {
    return this.bassEnergy;
  }

  getOverallEnergy() {
    return this.energy;
  }
}

if (typeof module !== 'undefined') {
  module.exports = VisualizerEngine;
}
