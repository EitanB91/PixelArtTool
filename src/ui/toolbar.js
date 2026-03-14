'use strict';

var Toolbar = (function() {
    function init() {
        document.querySelectorAll('.tool-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tool-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                AppState.tool = btn.dataset.tool;
            });
        });

        document.getElementById('btn-clear').addEventListener('click', function() {
            PixelCanvas.clear();
            ReferencePanel.clearReference();
        });

        document.getElementById('btn-undo').addEventListener('click', function() {
            var data = History.undo();
            if (data) PixelCanvas.applyHistory(data);
        });

        document.getElementById('btn-redo').addEventListener('click', function() {
            var data = History.redo();
            if (data) PixelCanvas.applyHistory(data);
        });

        // Zoom slider
        var zoomSlider = document.getElementById('zoom-slider');
        var zoomLabel  = document.getElementById('zoom-label');
        zoomSlider.addEventListener('input', function() {
            var z = parseInt(zoomSlider.value);
            zoomLabel.textContent = z + '×';
            PixelCanvas.setZoom(z);
        });

        // Canvas size
        document.getElementById('canvas-w').addEventListener('change', function() {
            document.getElementById('size-preset').value = '';
            _resizeCanvas();
        });
        document.getElementById('canvas-h').addEventListener('change', function() {
            document.getElementById('size-preset').value = '';
            _resizeCanvas();
        });

        // Dimension presets
        document.getElementById('size-preset').addEventListener('change', function() {
            var val = this.value;
            if (!val) return;
            var parts = val.split('x');
            var w = parseInt(parts[0]);
            var h = parseInt(parts[1]);
            document.getElementById('canvas-w').value = w;
            document.getElementById('canvas-h').value = h;
            PixelCanvas.resize(w, h);
        });

        refreshColorSwatch();
    }

    function _resizeCanvas() {
        var w = Math.max(1, Math.min(128, parseInt(document.getElementById('canvas-w').value) || 16));
        var h = Math.max(1, Math.min(128, parseInt(document.getElementById('canvas-h').value) || 22));
        PixelCanvas.resize(w, h);
    }

    function refreshColorSwatch() {
        document.getElementById('current-color-swatch').style.background = Palette.getActive();
    }

    return { init, refreshColorSwatch };
})();
