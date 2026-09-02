const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULT_CONFIG = {
  // Theme & Appearance (12 Anime & Rhythm Themes)
  // 'arcaea-hikari' | 'arcaea-tairitsu' | 'miku-teal' | 'sakura-pink' | 'arknights-tech' | 'blue-archive' | 'eva-purple' | 'pyro-flame' | 'phigros-neon' | 'water-wave' | 'star-rail' | 'touhou-scarlet'
  theme: 'arcaea-hikari',
  
  // Layout & Orientation
  layoutOrientation: 'horizontal', // 'horizontal' (横向长条) | 'vertical' (竖向长条瀑布流)
  dockSize: 'standard', // horizontal: 'compact'|'standard'|'wide'|'large' ; vertical: 'vertical-compact'|'vertical-standard'|'vertical-tall'
  customWidth: 400,
  customHeight: 155,
  dockPosition: 'bottom-right',
  widgetX: null,
  widgetY: null,
  clickThrough: false,

  // Rhythm Mode & Direction
  noteDirection: 'downward', // 'downward' (Arcaea/osu!mania) | 'upward' (Phigros)
  comboTimeout: 3000,
  showCombo: true,
  showWpm: true,

  // Custom Anime Background & Crop
  bgPreset: 'preset-arcaea-hikari',
  customBgPath: '',
  bgOpacity: 0.35,
  bgPosX: 50,
  bgPosY: 50,
  bgScale: 100,

  // Audio Engine (17 Soundpacks + Custom Audio)
  audioEnabled: true,
  audioVolume: 0.75,
  soundPack: 'arcaea-pure',
  customAudioPath: '',
  pitchModulation: true,

  // System
  autoStart: false,
  widgetVisible: true
};

class ConfigStore {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.configFilePath = path.join(this.userDataPath, 'config.json');
    this.config = { ...DEFAULT_CONFIG };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const data = fs.readFileSync(this.configFilePath, 'utf8');
        const parsed = JSON.parse(data);
        this.config = { ...DEFAULT_CONFIG, ...parsed };
      } else {
        this.save(this.config);
      }
    } catch (err) {
      console.error('[ConfigStore] Failed to load config, using defaults:', err);
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  save(newConfig = {}) {
    try {
      this.config = { ...this.config, ...newConfig };
      fs.writeFileSync(this.configFilePath, JSON.stringify(this.config, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[ConfigStore] Failed to save config:', err);
      return false;
    }
  }

  get(key) {
    return this.config[key];
  }

  getAll() {
    return { ...this.config };
  }

  reset() {
    this.config = { ...DEFAULT_CONFIG };
    this.save(this.config);
    return this.getAll();
  }
}

module.exports = ConfigStore;
