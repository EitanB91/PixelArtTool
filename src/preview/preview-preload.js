'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose a scoped, receive-only API to the preview renderer (security: contextIsolation=true)
contextBridge.exposeInMainWorld('previewApi', {
    // Receive full frame data from editor (via main relay)
    onReceiveFrames: function(cb) {
        ipcRenderer.on('preview:receive-frames', function(event, data) { cb(data); });
    },

    // Receive single active frame update
    onReceiveActive: function(cb) {
        ipcRenderer.on('preview:receive-active', function(event, data) { cb(data); });
    },

    // Receive FPS change from editor
    onReceiveFps: function(cb) {
        ipcRenderer.on('preview:receive-fps', function(event, data) { cb(data); });
    },

    // Send always-on-top toggle to main process
    setAlwaysOnTop: function(onTop) {
        return ipcRenderer.invoke('preview:set-on-top', { onTop: onTop });
    },

    // Notify main process that FPS was changed in preview (for reverse sync to editor)
    sendFpsChanged: function(fps) {
        ipcRenderer.send('preview:fps-changed', { fps: fps });
    }
});
