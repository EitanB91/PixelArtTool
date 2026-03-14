'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose only specific IPC channels to the renderer (security: contextIsolation=true)
contextBridge.exposeInMainWorld('api', {
    openImage:       () => ipcRenderer.invoke('open-image'),
    savePng:         (b64, name) => ipcRenderer.invoke('save-png', b64, name),
    copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
    checkApiKey:     () => ipcRenderer.invoke('check-api-key'),
    callClaude:      (messages, maxTokens, system) => ipcRenderer.invoke('call-claude', messages, maxTokens, system),
    traceReference:  (base64, ext) => ipcRenderer.invoke('trace-reference', base64, ext)
});
