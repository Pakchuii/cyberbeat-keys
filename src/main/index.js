const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const ConfigStore = require('./configStore');
const HookManager = require('./hookManager');

// Enable GPU Hardware Acceleration & Optimize Compositor
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

let widgetWin = null;
let settingsWin = null;
let tray = null;
let configStore = null;
let hookManager = null;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const isVisible = configStore ? (configStore.get('widgetVisible') !== false) : true;
    if (widgetWin) {
      if (isVisible) {
        widgetWin.show();
        widgetWin.setAlwaysOnTop(true, 'screen-saver');
        const bounds = getDockBounds(configStore.getAll());
        widgetWin.setBounds(bounds);
      }
    } else if (isVisible) {
      createWidgetWindow();
    }
    if (settingsWin) {
      if (settingsWin.isMinimized()) settingsWin.restore();
      settingsWin.focus();
    } else {
      createSettingsWindow();
    }
  });
}

function createTrayIcon() {
  const iconPath = path.join(__dirname, '..', 'renderer', 'assets', 'icons', 'tray.png');
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="6" fill="#0b0e14"/>
    <circle cx="16" cy="16" r="11" stroke="#39c5bb" stroke-width="2.5" fill="none"/>
    <polygon points="16,9 22,21 10,21" fill="#ff358b"/>
    <circle cx="16" cy="16" r="3" fill="#39c5bb"/>
  </svg>`;
  return nativeImage.createFromBuffer(Buffer.from(svg), { width: 32, height: 32 });
}

function getDockDimensions(config) {
  // If user previously manually dragged to resize, prioritize customWidth & customHeight!
  if (config.customWidth && config.customHeight) {
    return {
      width: Math.max(140, Math.min(1920, config.customWidth)),
      height: Math.max(120, Math.min(1080, config.customHeight))
    };
  }

  const orientation = config.layoutOrientation || 'horizontal';
  const size = config.dockSize || 'standard';

  if (orientation === 'vertical') {
    switch (size) {
      case 'vertical-compact': return { width: 180, height: 480 };
      case 'vertical-tall': return { width: 220, height: 680 };
      case 'vertical-standard':
      default:
        return { width: 195, height: 560 }; // Wider default vertical lane
    }
  }

  switch (size) {
    case 'compact': return { width: 350, height: 135 };
    case 'wide': return { width: 480, height: 160 };
    case 'large': return { width: 520, height: 180 };
    case 'standard':
    default:
      return { width: 400, height: 155 };
  }
}

function getDockBounds(config) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;
  const { width: winW, height: winH } = getDockDimensions(config);

  if (config.widgetX !== undefined && config.widgetY !== undefined && config.widgetX !== null && config.widgetY !== null) {
    const safeX = Math.max(workArea.x + 10, Math.min(workArea.x + workArea.width - winW - 10, config.widgetX));
    const safeY = Math.max(workArea.y + 10, Math.min(workArea.y + workArea.height - winH - 10, config.widgetY));
    return { x: safeX, y: safeY, width: winW, height: winH };
  }

  const pos = config.dockPosition || 'bottom-right';
  const margin = 24;

  let x = workArea.x + Math.round((workArea.width - winW) / 2);
  let y = workArea.y + workArea.height - winH - margin;

  switch (pos) {
    case 'top-center':
      x = workArea.x + Math.round((workArea.width - winW) / 2);
      y = workArea.y + margin;
      break;
    case 'bottom-right':
      x = workArea.x + workArea.width - winW - margin;
      y = workArea.y + workArea.height - winH - margin;
      break;
    case 'bottom-left':
      x = workArea.x + margin;
      y = workArea.y + workArea.height - winH - margin;
      break;
    case 'bottom-center':
    default:
      x = workArea.x + Math.round((workArea.width - winW) / 2);
      y = workArea.y + workArea.height - winH - margin;
      break;
  }

  return { x, y, width: winW, height: winH };
}

function createWidgetWindow() {
  const config = configStore.getAll();
  const targetBounds = getDockBounds(config);

  const isVisible = config.widgetVisible !== false;
  widgetWin = new BrowserWindow({
    x: targetBounds.x,
    y: targetBounds.y,
    width: targetBounds.width,
    height: targetBounds.height,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: true,
    resizable: true,
    focusable: false,
    type: 'toolbar',
    show: isVisible,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false
    }
  });

  widgetWin.setAlwaysOnTop(true, 'screen-saver', 1);
  widgetWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (config.clickThrough) {
    widgetWin.setIgnoreMouseEvents(true, { forward: true });
  }

  widgetWin.loadFile(path.join(__dirname, '..', 'renderer', 'overlay.html'));
  if (isVisible) {
    widgetWin.showInactive();
  }

  widgetWin.on('blur', () => {
    if (widgetWin && !widgetWin.isDestroyed() && configStore && configStore.get('widgetVisible') !== false) {
      widgetWin.setAlwaysOnTop(true, 'screen-saver', 1);
    }
  });

  widgetWin.on('closed', () => {
    widgetWin = null;
  });
}

function createSettingsWindow() {
  if (settingsWin) {
    settingsWin.show();
    settingsWin.focus();
    return;
  }

  settingsWin = new BrowserWindow({
    width: 860,
    height: 730,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  settingsWin.loadFile(path.join(__dirname, '..', 'renderer', 'settings.html'));

  settingsWin.once('ready-to-show', () => {
    settingsWin.show();
  });

  settingsWin.on('closed', () => {
    settingsWin = null;
  });
}

function setupTray() {
  const trayIcon = createTrayIcon();
  tray = new Tray(trayIcon);
  tray.setToolTip('CyberBeat Keys - 二次元音游打击感 · 实时按键可视化');

  const updateContextMenu = () => {
    const config = configStore.getAll();
    const contextMenu = Menu.buildFromTemplate([
      { label: '⚡ CyberBeat Keys v7.0', enabled: false },
      { type: 'separator' },
      {
        label: '⚙️ 打开设置中心...',
        click: () => createSettingsWindow()
      },
      {
        label: '👁️ 显示桌面挂件 (Show Widget)',
        type: 'checkbox',
        checked: config.widgetVisible !== false,
        click: (item) => updateConfigItem('widgetVisible', item.checked)
      },
      {
        label: '📐 挂件形态选择',
        submenu: [
          {
            label: '📱 横向长条 (经典横版桌搭)',
            type: 'radio',
            checked: config.layoutOrientation === 'horizontal',
            click: () => {
              configStore.save({ layoutOrientation: 'horizontal', customWidth: 400, customHeight: 155, dockSize: 'standard' });
              broadcastConfig();
            }
          },
          {
            label: '🖥️ 竖向长条 (侧边音游瀑布流)',
            type: 'radio',
            checked: config.layoutOrientation === 'vertical',
            click: () => {
              configStore.save({ layoutOrientation: 'vertical', customWidth: 195, customHeight: 560, dockSize: 'vertical-standard' });
              broadcastConfig();
            }
          }
        ]
      },
      {
        label: '🎵 音符打击流方向',
        submenu: [
          {
            label: '⬇️ 经典下落流 (osu!mania / DJMAX)',
            type: 'radio',
            checked: config.noteDirection === 'downward',
            click: () => updateConfigItem('noteDirection', 'downward')
          },
          {
            label: '⬆️ 经典上升流 (Phigros 律动)',
            type: 'radio',
            checked: config.noteDirection === 'upward',
            click: () => updateConfigItem('noteDirection', 'upward')
          }
        ]
      },
      {
        label: '🎨 10 大二次元主题',
        submenu: [
          {
            label: '🌟 初音未来 · 苍绿赛博',
            type: 'radio',
            checked: config.theme === 'miku-teal',
            click: () => updateConfigItem('theme', 'miku-teal')
          },
          {
            label: '🌸 魔法少女 · 樱粉流光',
            type: 'radio',
            checked: config.theme === 'sakura-pink',
            click: () => updateConfigItem('theme', 'sakura-pink')
          },
          {
            label: '⚔️ 明日方舟 · 机能工业',
            type: 'radio',
            checked: config.theme === 'arknights-tech',
            click: () => updateConfigItem('theme', 'arknights-tech')
          },
          {
            label: '🌌 蔚蓝档案 · 圣三一蓝',
            type: 'radio',
            checked: config.theme === 'blue-archive',
            click: () => updateConfigItem('theme', 'blue-archive')
          },
          {
            label: '💜 EVA 初号机 · 暴走紫',
            type: 'radio',
            checked: config.theme === 'eva-purple',
            click: () => updateConfigItem('theme', 'eva-purple')
          },
          {
            label: '🔥 原神 · 炽热火神',
            type: 'radio',
            checked: config.theme === 'pyro-flame',
            click: () => updateConfigItem('theme', 'pyro-flame')
          },
          {
            label: '⚡ Phigros · 官方霓虹',
            type: 'radio',
            checked: config.theme === 'phigros-neon',
            click: () => updateConfigItem('theme', 'phigros-neon')
          },
          {
            label: '🌊 鬼灭之刃 · 水之呼吸',
            type: 'radio',
            checked: config.theme === 'water-wave',
            click: () => updateConfigItem('theme', 'water-wave')
          },
          {
            label: '🪐 崩坏：星穹铁道 · 银河漫游',
            type: 'radio',
            checked: config.theme === 'star-rail',
            click: () => updateConfigItem('theme', 'star-rail')
          },
          {
            label: '🦇 东方 Project · 红魔馆',
            type: 'radio',
            checked: config.theme === 'touhou-scarlet',
            click: () => updateConfigItem('theme', 'touhou-scarlet')
          }
        ]
      },
      {
        label: '🔊 开启敲击音效',
        type: 'checkbox',
        checked: config.audioEnabled,
        click: (item) => updateConfigItem('audioEnabled', item.checked)
      },
      {
        label: '🎮 游戏置顶增强守护 (Topmost Guard)',
        type: 'checkbox',
        checked: config.topmostGuard !== false,
        click: (item) => updateConfigItem('topmostGuard', item.checked)
      },
      {
        label: '🔒 鼠标完全穿透 (Click-Through)',
        type: 'checkbox',
        checked: config.clickThrough,
        click: (item) => {
          updateConfigItem('clickThrough', item.checked);
          if (widgetWin) {
            widgetWin.setIgnoreMouseEvents(item.checked, { forward: true });
          }
        }
      },
      { type: 'separator' },
      {
        label: '🚪 退出 CyberBeat Keys',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
  };

  updateContextMenu();
  tray.on('double-click', () => createSettingsWindow());
  return updateContextMenu;
}

let refreshTrayMenu = null;

function updateConfigItem(key, value) {
  configStore.save({ [key]: value });
  broadcastConfig();
  if (refreshTrayMenu) refreshTrayMenu();
}

let topmostGuardTimer = null;
function refreshTopmostGuard() {
  const cfg = configStore ? configStore.getAll() : {};
  const enabled = cfg.topmostGuard !== false && cfg.widgetVisible !== false;
  if (!enabled) {
    if (topmostGuardTimer) {
      clearInterval(topmostGuardTimer);
      topmostGuardTimer = null;
    }
    return;
  }
  if (!topmostGuardTimer) {
    topmostGuardTimer = setInterval(() => {
      if (widgetWin && !widgetWin.isDestroyed() && widgetWin.isVisible()) {
        widgetWin.setAlwaysOnTop(true, 'screen-saver', 1);
      }
    }, 1200);
  }
}

function broadcastConfig() {
  const config = configStore.getAll();
  if (widgetWin && !widgetWin.isDestroyed()) {
    if (config.widgetVisible === false) {
      if (widgetWin.isVisible()) {
        widgetWin.hide();
      }
    } else {
      if (!widgetWin.isVisible()) {
        widgetWin.showInactive();
      }
      widgetWin.setAlwaysOnTop(true, 'screen-saver', 1);
    }
    widgetWin.webContents.send('config-updated', config);
    widgetWin.setIgnoreMouseEvents(config.clickThrough, { forward: true });
    const bounds = getDockBounds(config);
    widgetWin.setBounds(bounds);
  }
  refreshTopmostGuard();
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.webContents.send('config-updated', config);
  }
}

function applyAutoStart(enable) {
  try {
    const startupDir = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const shortcutPath = path.join(startupDir, 'CyberBeat Keys.lnk');
    const exePath = process.execPath;

    // 1. Native Electron Login Item
    app.setLoginItemSettings({
      openAtLogin: Boolean(enable),
      path: exePath,
      args: ['--autostart']
    });

    // 2. Windows Startup Folder Shortcut fallback
    const cp = require('child_process');
    if (enable) {
      const psCmd = `$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('${shortcutPath.replace(/'/g, "''")}'); $Shortcut.TargetPath = '${exePath.replace(/'/g, "''")}'; $Shortcut.WorkingDirectory = '${path.dirname(exePath).replace(/'/g, "''")}'; $Shortcut.Description = 'CyberBeat Keys Auto-Start'; $Shortcut.Save();`;
      cp.exec(`powershell.exe -NoProfile -Command "${psCmd}"`, (err) => {
        if (err) console.error('[AutoStart] Error creating startup shortcut:', err);
      });
    } else {
      if (fs.existsSync(shortcutPath)) {
        try { fs.unlinkSync(shortcutPath); } catch (e) {}
      }
    }
  } catch (err) {
    console.error('[AutoStart] Failed to update auto-start setting:', err);
  }
}

function isRunningAsAdmin() {
  if (process.platform !== 'win32') return true;
  try {
    require('child_process').execSync('net session', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function setupIPC() {
  ipcMain.handle('get-admin-status', () => isRunningAsAdmin());
  ipcMain.handle('get-config', () => configStore.getAll());
  ipcMain.handle('save-config', (event, newConfig) => {
    if (newConfig.autoStart !== undefined) {
      applyAutoStart(newConfig.autoStart);
    }
    configStore.save(newConfig);
    broadcastConfig();
    if (refreshTrayMenu) refreshTrayMenu();
    return { success: true };
  });

  ipcMain.handle('reset-config', () => {
    const config = configStore.reset();
    broadcastConfig();
    if (refreshTrayMenu) refreshTrayMenu();
    return config;
  });

  // Desktop Window Dragging Support
  ipcMain.handle('move-window', (event, delta) => {
    if (widgetWin && !widgetWin.isDestroyed()) {
      const [curX, curY] = widgetWin.getPosition();
      widgetWin.setPosition(curX + delta.dx, curY + delta.dy);
    }
    return true;
  });

  // Desktop Window Resizing Support
  ipcMain.handle('resize-window', (event, delta) => {
    if (widgetWin && !widgetWin.isDestroyed()) {
      const [curW, curH] = widgetWin.getSize();
      const newW = Math.max(140, Math.min(1920, curW + delta.dw));
      const newH = Math.max(120, Math.min(1080, curH + delta.dh));
      widgetWin.setSize(newW, newH);
    }
    return true;
  });

  ipcMain.handle('save-window-bounds', () => {
    if (widgetWin && !widgetWin.isDestroyed()) {
      const [curX, curY] = widgetWin.getPosition();
      const [curW, curH] = widgetWin.getSize();
      configStore.save({
        widgetX: curX,
        widgetY: curY,
        customWidth: curW,
        customHeight: curH
      });
    }
    return true;
  });

  // Custom Background Image File Picker
  ipcMain.handle('select-bg-image', async () => {
    const result = await dialog.showOpenDialog(settingsWin || widgetWin, {
      title: '选择自定义二次元壁纸/插画',
      filters: [
        { name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      configStore.save({ customBgPath: filePath, bgPreset: 'custom' });
      broadcastConfig();
      return filePath;
    }
    return null;
  });

  // Custom Audio File Picker
  ipcMain.handle('select-audio-file', async () => {
    const result = await dialog.showOpenDialog(settingsWin || widgetWin, {
      title: '导入自定义击键音效文件',
      filters: [
        { name: '音频文件', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      configStore.save({ customAudioPath: filePath, soundPack: 'custom-audio' });
      broadcastConfig();
      return filePath;
    }
    return null;
  });

  ipcMain.handle('set-clickthrough', (event, enabled) => {
    configStore.save({ clickThrough: enabled });
    if (widgetWin && !widgetWin.isDestroyed()) {
      widgetWin.setIgnoreMouseEvents(enabled, { forward: true });
    }
    broadcastConfig();
    if (refreshTrayMenu) refreshTrayMenu();
    return true;
  });

  ipcMain.handle('open-settings', () => createSettingsWindow());
  ipcMain.handle('close-settings', () => {
    if (settingsWin && !settingsWin.isDestroyed()) {
      settingsWin.close();
    }
  });

  ipcMain.handle('quit-app', () => {
    app.isQuitting = true;
    app.quit();
  });
}

app.whenReady().then(() => {
  configStore = new ConfigStore();
  setupIPC();
  createWidgetWindow();
  refreshTrayMenu = setupTray();

  const cfg = configStore.getAll();
  if (cfg.autoStart) {
    applyAutoStart(true);
  }

  refreshTopmostGuard();

  hookManager = new HookManager();
  let lastTopmostGuardPoke = 0;
  hookManager.on('key', (keyData) => {
    if (widgetWin && !widgetWin.isDestroyed()) {
      widgetWin.webContents.send('key-event', keyData);
      const now = Date.now();
      if (now - lastTopmostGuardPoke > 2500) {
        lastTopmostGuardPoke = now;
        const currentCfg = configStore ? configStore.getAll() : {};
        if (currentCfg.topmostGuard !== false && currentCfg.widgetVisible !== false && widgetWin.isVisible()) {
          widgetWin.setAlwaysOnTop(true, 'screen-saver', 1);
        }
      }
    }
  });
  hookManager.start();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWidgetWindow();
    }
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (hookManager) {
    hookManager.stop();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && app.isQuitting) {
    app.quit();
  }
});
