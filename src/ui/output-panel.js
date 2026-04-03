'use strict';

var OutputPanel = (function() {

    var _els = {};
    var _copyTimer = null;
    var _saveTimer = null;

    function init() {
        _els.panelTitle   = document.getElementById('export-panel-title');
        _els.funcLabel    = document.getElementById('func-name-label');
        _els.funcInput    = document.getElementById('func-name');
        _els.funcHint     = document.getElementById('func-name-hint');
        _els.btnExport    = document.getElementById('btn-export');
        _els.btnCopy      = document.getElementById('btn-copy-code');
        _els.btnSavePng   = document.getElementById('btn-save-png');
        _els.exportOutput = document.getElementById('export-output');
        _els.useLoff      = document.getElementById('use-loff');

        _els.btnExport.addEventListener('click', _handleExport);
        _els.btnCopy.addEventListener('click', _handleCopy);
        _els.btnSavePng.addEventListener('click', _handleSavePng);
    }

    // ── Export code ──────────────────────────────────────────────────────────

    function _handleExport() {
        var funcName = _els.funcInput.value.trim() || '_drawSprite';
        var useLoff  = _els.useLoff.checked;
        var code;

        if (AppState.animationMode) {
            // Save current canvas to active frame before exporting
            AnimFrames.setCurrentPixels(PixelCanvas.getPixels());
            var frames = AnimFrames.getAll();
            var pixelArrays = [];
            for (var i = 0; i < frames.length; i++) {
                pixelArrays.push(frames[i].pixels);
            }
            code = Exporter.generateMultiFrame(
                funcName, useLoff, pixelArrays,
                AnimFrames.getWidth(), AnimFrames.getHeight()
            );
        } else {
            code = Exporter.generate(funcName, useLoff);
        }

        _els.exportOutput.value = code;
        _els.btnCopy.style.display = 'inline-block';
    }

    // ── Copy to clipboard ───────────────────────────────────────────────────

    async function _handleCopy() {
        var code = _els.exportOutput.value;
        await window.api.copyToClipboard(code);
        _els.btnCopy.textContent = 'Copied!';
        clearTimeout(_copyTimer);
        _copyTimer = setTimeout(function() { _els.btnCopy.textContent = 'Copy to Clipboard'; }, 1500);
    }

    // ── Save PNG / Spritesheet ──────────────────────────────────────────────

    async function _handleSavePng() {
        var funcName = _els.funcInput.value.trim() || 'sprite';
        var b64, filename;

        if (AppState.animationMode) {
            // Save current canvas to active frame before spritesheet export
            AnimFrames.setCurrentPixels(PixelCanvas.getPixels());
            var frames = AnimFrames.getAll();
            var pixelArrays = [];
            for (var i = 0; i < frames.length; i++) {
                pixelArrays.push(frames[i].pixels);
            }
            b64 = Exporter.toSpritesheetBase64(
                pixelArrays,
                AnimFrames.getWidth(), AnimFrames.getHeight()
            );
            filename = funcName + '_spritesheet.png';
        } else {
            b64 = PixelCanvas.toPngBase64();
            filename = funcName + '.png';
        }

        var saved = await window.api.savePng(b64, filename);
        if (saved) {
            var label = AppState.animationMode ? 'Save Spritesheet PNG' : 'Save PNG';
            _els.btnSavePng.textContent = 'Saved!';
            var btn = _els.btnSavePng;
            clearTimeout(_saveTimer);
            _saveTimer = setTimeout(function() { btn.textContent = label; }, 1500);
        }
    }

    // ── Mode switch: update labels and button text ──────────────────────────

    function updateMode(isAnim) {
        if (isAnim) {
            _els.panelTitle.textContent  = 'EXPORT ANIMATION';
            _els.btnExport.textContent   = 'Export Animation Code';
            _els.btnSavePng.textContent  = 'Save Spritesheet PNG';
            _els.funcHint.style.display  = '';
            _els.exportOutput.placeholder = 'Animation pxAt() code will appear here...';
        } else {
            _els.panelTitle.textContent  = 'EXPORT CODE';
            _els.btnExport.textContent   = 'Generate pxAt() Code';
            _els.btnSavePng.textContent  = 'Save PNG';
            _els.funcHint.style.display  = 'none';
            _els.exportOutput.placeholder = 'pxAt() code will appear here...';
        }
        // Cancel any pending "Saved!" / "Copied!" flash timers so they don't
        // overwrite the freshly-set labels after a mode switch (Viktor A1)
        clearTimeout(_saveTimer);
        clearTimeout(_copyTimer);
        // Clear previous output on mode switch
        _els.exportOutput.value = '';
        _els.btnCopy.style.display = 'none';
    }

    return { init, updateMode };
})();
