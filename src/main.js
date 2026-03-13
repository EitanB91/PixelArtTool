'use strict';

const { app, BrowserWindow, ipcMain, dialog, clipboard } = require('electron');
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

// ── IPC: API key ──────────────────────────────────────────────────────────────

ipcMain.handle('get-api-key', function() {
    return process.env.ANTHROPIC_API_KEY || null;
});
