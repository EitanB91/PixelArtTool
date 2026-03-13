'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose only specific IPC channels to the renderer (security: contextIsolation=true)
contextBridge.exposeInMainWorld('api', {
    openImage:       () => ipcRenderer.invoke('open-image'),
    savePng:         (b64, name) => ipcRenderer.invoke('save-png', b64, name),
    copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
    getApiKey:       () => ipcRenderer.invoke('get-api-key')
});
