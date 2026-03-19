'use strict';

// App — main renderer entry point. Initialises all modules, wires AI panel.

var AppState = {
    tool:            'pencil',
    referenceBase64: null,
    referenceExt:    null,
    // ── Animation fields (O6) ──────────────────────────────────────────────────
    animationMode:        false,   // true when Animation tab is active
    activeFrameIndex:     0,       // index of the currently displayed frame
    activeRegionId:       null,    // id of the selected region (null = none)
    animBackgroundFill:   'transparent' // 'transparent' | hex color string
};

window.addEventListener('DOMContentLoaded', async function() {
    // Init core
    PixelCanvas.init(document.getElementById('drawCanvas'));
    // Note: canvas.js pushes the initial blank state to its own history in init()

    // Init UI
    Toolbar.init();
    PalettePanel.init();
    ReferencePanel.init();
    OutputPanel.init();
    AnimationPanel.init();

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
        btnTrace.disabled = true;
        try {
            await AIGenerate.trace(AppState.referenceBase64, AppState.referenceExt, aiStatus);
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
                    if (e.shiftKey) { PixelCanvas.redo(); }
                    else            { PixelCanvas.undo(); }
                }
                break;
            case 'y':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    PixelCanvas.redo();
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
