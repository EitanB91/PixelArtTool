'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose only specific IPC channels to the renderer (security: contextIsolation=true)
contextBridge.exposeInMainWorld('api', {
    openImage:       () => ipcRenderer.invoke('open-image'),
    savePng:         (b64, name) => ipcRenderer.invoke('save-png', b64, name),
    copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
    checkApiKey:     () => ipcRenderer.invoke('check-api-key'),
    callClaude:      (messages, maxTokens, system) => ipcRenderer.invoke('call-claude', messages, maxTokens, system),
    traceReference:  (base64, ext, w, h) => ipcRenderer.invoke('trace-reference', base64, ext, w, h),
    extractPalette:  (base64, ext) => ipcRenderer.invoke('extract-palette', base64, ext),

    // Preview window channels
    openPreviewWindow:        () => ipcRenderer.invoke('preview:open'),
    pushFramesToPreview:      (data) => ipcRenderer.send('preview:push-frames', data),
    pushActiveFrameToPreview: (data) => ipcRenderer.send('preview:push-active', data),
    setPreviewFps:            (fps) => ipcRenderer.send('preview:set-fps', { fps: fps }),
    onPreviewFpsChanged:      (cb) => ipcRenderer.on('editor:receive-preview-fps', (event, data) => cb(data))
});
