const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Key Events
  onKeyEvent: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('key-event', subscription);
    return () => ipcRenderer.removeListener('key-event', subscription);
  },

  // Configuration
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (newConfig) => ipcRenderer.invoke('save-config', newConfig),
  resetConfig: () => ipcRenderer.invoke('reset-config'),
  onConfigUpdated: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('config-updated', subscription);
    return () => ipcRenderer.removeListener('config-updated', subscription);
  },

  // Custom File Pickers
  selectBgImage: () => ipcRenderer.invoke('select-bg-image'),
  selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),

  // Window Dragging & Resizing
  moveWindow: (delta) => ipcRenderer.invoke('move-window', delta),
  resizeWindow: (delta) => ipcRenderer.invoke('resize-window', delta),
  saveWindowBounds: () => ipcRenderer.invoke('save-window-bounds'),
  saveCurrentWindowPosition: () => ipcRenderer.invoke('save-window-bounds'),

  // Controls
  setClickThrough: (enabled) => ipcRenderer.invoke('set-clickthrough', enabled),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  closeSettings: () => ipcRenderer.invoke('close-settings'),
  quitApp: () => ipcRenderer.invoke('quit-app')
});
