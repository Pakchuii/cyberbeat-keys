const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

class HookManager extends EventEmitter {
  constructor() {
    super();
    this.child = null;
    this.buffer = '';
    this.isStopping = false;
    this.restartAttempts = 0;
    this.maxRestartAttempts = 5;
  }

  getExecutablePath() {
    const candidates = [
      // 1. Packaged resources path
      process.resourcesPath ? path.join(process.resourcesPath, 'native', 'hook.exe') : null,
      process.resourcesPath ? path.join(process.resourcesPath, 'app.asar.unpacked', 'native', 'hook.exe') : null,
      // 2. Relative dev path
      path.join(__dirname, '..', '..', 'native', 'hook.exe'),
      path.join(__dirname, '..', 'native', 'hook.exe'),
      // 3. Alongside current working directory
      path.join(process.cwd(), 'native', 'hook.exe'),
      // 4. Executable dir
      process.execPath ? path.join(path.dirname(process.execPath), 'native', 'hook.exe') : null,
      process.execPath ? path.join(path.dirname(process.execPath), 'resources', 'native', 'hook.exe') : null
    ];

    for (const p of candidates) {
      if (p && fs.existsSync(p)) {
        return p;
      }
    }

    return path.join(__dirname, '..', '..', 'native', 'hook.exe');
  }

  start() {
    if (this.child) return;
    this.isStopping = false;

    const hookExePath = this.getExecutablePath();
    console.log('[HookManager] Launching hook daemon from:', hookExePath);

    if (!fs.existsSync(hookExePath)) {
      console.error('[HookManager] Error: hook.exe not found at', hookExePath);
      this.emit('error', new Error(`hook.exe not found at ${hookExePath}`));
      return;
    }

    try {
      this.child = spawn(hookExePath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
      });

      this.child.stdout.on('data', (chunk) => {
        this.buffer += chunk.toString();
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const data = JSON.parse(trimmed);
            if (data.event === 'keydown' || data.event === 'keyup') {
              this.emit(data.event, data);
              this.emit('key', data);
            } else if (data.event === 'ready') {
              console.log('[HookManager] Hook daemon ready:', data);
              this.restartAttempts = 0;
              this.emit('ready', data);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      });

      this.child.stderr.on('data', (errData) => {
        console.warn('[HookManager Stderr]:', errData.toString());
      });

      this.child.on('error', (err) => {
        console.error('[HookManager] Child process error:', err);
        this.emit('error', err);
      });

      this.child.on('close', (code) => {
        console.log(`[HookManager] Hook daemon exited with code ${code}`);
        this.child = null;
        if (!this.isStopping && this.restartAttempts < this.maxRestartAttempts) {
          this.restartAttempts++;
          console.log(`[HookManager] Attempting restart (${this.restartAttempts}/${this.maxRestartAttempts})...`);
          setTimeout(() => this.start(), 1000);
        }
      });
    } catch (err) {
      console.error('[HookManager] Failed to spawn hook process:', err);
    }
  }

  stop() {
    this.isStopping = true;
    if (this.child) {
      try {
        this.child.stdin.write('quit\n');
      } catch (e) {}
      setTimeout(() => {
        if (this.child) {
          try {
            this.child.kill('SIGTERM');
          } catch (e) {}
          this.child = null;
        }
      }, 500);
    }
  }
}

module.exports = HookManager;
