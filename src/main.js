'use strict';

const { app, BrowserWindow, ipcMain, dialog, clipboard, nativeImage } = require('electron');
const PNG = require('pngjs').PNG;
const path = require('path');
const fs   = require('fs');

// Load .env if present
try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        fs.readFileSync(envPath, 'utf8')
            .split('\n')
            .forEach(function(line) {
                var m = line.match(/^([^=]+)=(.*)$/);
                if (m) process.env[m[1].trim()] = m[2].trim();
            });
    }
} catch(e) {}

var mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        backgroundColor: '#1A1A1A',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        title: 'Pixel Art Tool'
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ── IPC: File system ──────────────────────────────────────────────────────────

ipcMain.handle('open-image', async function() {
    var result = await dialog.showOpenDialog(mainWindow, {
        title: 'Open Reference Image',
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }],
        properties: ['openFile']
    });
    if (result.canceled || !result.filePaths.length) return null;
    var data = fs.readFileSync(result.filePaths[0]);
    return {
        path: result.filePaths[0],
        base64: data.toString('base64'),
        ext: path.extname(result.filePaths[0]).slice(1).toLowerCase()
    };
});

ipcMain.handle('save-png', async function(event, base64Data, defaultName) {
    var result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Sprite PNG',
        defaultPath: defaultName || 'sprite.png',
        filters: [{ name: 'PNG', extensions: ['png'] }]
    });
    if (result.canceled || !result.filePath) return false;
    var buf = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(result.filePath, buf);
    return result.filePath;
});

ipcMain.handle('copy-to-clipboard', function(event, text) {
    clipboard.writeText(text);
    return true;
});

// ── IPC: Claude API (key never leaves main process) ───────────────────────────

var CLAUDE_MODEL   = 'claude-sonnet-4-6';
var ANTHROPIC_VER  = '2023-06-01';

ipcMain.handle('check-api-key', function() {
    return !!process.env.ANTHROPIC_API_KEY;
});

ipcMain.handle('call-claude', async function(event, messages, maxTokens, system) {
    var apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('No ANTHROPIC_API_KEY. Add it to .env');

    var body = {
        model:      CLAUDE_MODEL,
        max_tokens: maxTokens || 1024,
        messages:   messages
    };
    if (system) body.system = system;

    var response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type':      'application/json',
            'x-api-key':         apiKey,
            'anthropic-version': ANTHROPIC_VER
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        var err = await response.text();
        throw new Error('API error ' + response.status + ': ' + err);
    }

    var data = await response.json();
    return data.content[0].text;
});

// ── IPC: Reference image tracing (algorithmic, no AI) ─────────────────────────

ipcMain.handle('trace-reference', function(event, base64, ext) {
    // Decode via nativeImage (handles PNG, JPEG, GIF) then export to PNG for pngjs
    var mime   = (ext === 'jpg') ? 'jpeg' : ext;
    var img    = nativeImage.createFromDataURL('data:image/' + mime + ';base64,' + base64);
    var size   = img.getSize();
    var srcW   = size.width;
    var srcH   = size.height;

    // Auto-size: use native dimensions, clamped to 128×128 preserving aspect ratio
    var scale = Math.min(1, Math.min(128 / srcW, 128 / srcH));
    var dstW  = Math.max(1, Math.round(srcW * scale));
    var dstH  = Math.max(1, Math.round(srcH * scale));

    var parsed = PNG.sync.read(img.toPNG());
    var src    = parsed.data; // RGBA Buffer

    // Nearest-neighbor resize → preserves hard pixel edges (no blur)
    var dst = new Array(dstW * dstH * 4);
    for (var y = 0; y < dstH; y++) {
        for (var x = 0; x < dstW; x++) {
            var sx = Math.floor(x * srcW / dstW);
            var sy = Math.floor(y * srcH / dstH);
            var si = (sy * srcW + sx) * 4;
            var di = (y  * dstW + x)  * 4;
            dst[di]     = src[si];
            dst[di + 1] = src[si + 1];
            dst[di + 2] = src[si + 2];
            dst[di + 3] = src[si + 3];
        }
    }
    return { pixels: dst, w: dstW, h: dstH };
});
