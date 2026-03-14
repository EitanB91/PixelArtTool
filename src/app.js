'use strict';

// App — main renderer entry point. Initialises all modules, wires AI panel.

var AppState = {
    tool:            'pencil',
    referenceBase64: null,
    referenceExt:    null
};

window.addEventListener('DOMContentLoaded', async function() {
    // Init core
    PixelCanvas.init(document.getElementById('drawCanvas'));
    History.push(PixelCanvas.getPixels()); // initial empty state

    // Init UI
    Toolbar.init();
    PalettePanel.init();
    ReferencePanel.init();
    OutputPanel.init();

    // Init AI
    var hasKey = await AIClient.init();
    var aiStatus = document.getElementById('ai-status');
    aiStatus.textContent = hasKey ? 'API key loaded' : 'No API key (.env)';

    // AI generate button
    var btnGenerate = document.getElementById('btn-ai-generate');
    btnGenerate.addEventListener('click', async function() {
        var prompt = document.getElementById('ai-prompt').value.trim();
        if (!prompt) { aiStatus.textContent = 'Enter a description first'; return; }
        var w = PixelCanvas.getWidth();
        var h = PixelCanvas.getHeight();
        btnGenerate.disabled = true;
        try {
            await AIGenerate.run(
                prompt, w, h,
                AppState.referenceBase64,
                AppState.referenceExt,
                aiStatus
            );
        } finally {
            btnGenerate.disabled = false;
        }
    });

    // Trace reference button
    var btnTrace = document.getElementById('btn-trace-ref');
    btnTrace.addEventListener('click', async function() {
        var w = PixelCanvas.getWidth();
        var h = PixelCanvas.getHeight();
        btnTrace.disabled = true;
        try {
            await AIGenerate.trace(w, h, AppState.referenceBase64, AppState.referenceExt, aiStatus);
        } finally {
            btnTrace.disabled = false;
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        var tool = null;
        switch(e.key.toLowerCase()) {
            case 'b': tool = 'pencil';  break;
            case 'e': tool = 'eraser';  break;
            case 'g': tool = 'fill';    break;
            case 'i': tool = 'eyedrop'; break;
            case 'z':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    if (e.shiftKey) { var rd = History.redo();  if (rd) PixelCanvas.applyHistory(rd); }
                    else            { var ud = History.undo();  if (ud) PixelCanvas.applyHistory(ud); }
                }
                break;
            case 'y':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    var yd = History.redo(); if (yd) PixelCanvas.applyHistory(yd);
                }
                break;
        }
        if (tool) {
            AppState.tool = tool;
            document.querySelectorAll('.tool-btn').forEach(function(btn) {
                btn.classList.toggle('active', btn.dataset.tool === tool);
            });
        }
    });
});
