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
            PixelCanvas.undo();
        });

        document.getElementById('btn-redo').addEventListener('click', function() {
            PixelCanvas.redo();
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
            if (!_confirmResizeInAnimMode()) { this.value = PixelCanvas.getWidth(); return; }
            document.getElementById('size-preset').value = '';
            _resizeCanvas();
        });
        document.getElementById('canvas-h').addEventListener('change', function() {
            if (!_confirmResizeInAnimMode()) { this.value = PixelCanvas.getHeight(); return; }
            document.getElementById('size-preset').value = '';
            _resizeCanvas();
        });

        // Dimension presets
        document.getElementById('size-preset').addEventListener('change', function() {
            var val = this.value;
            if (!val) return;
            if (!_confirmResizeInAnimMode()) { this.value = ''; return; }
            var parts = val.split('x');
            var w = parseInt(parts[0]);
            var h = parseInt(parts[1]);
            document.getElementById('canvas-w').value = w;
            document.getElementById('canvas-h').value = h;
            PixelCanvas.resize(w, h);
        });

        refreshColorSwatch();
    }

    // Resize guard (O6-4 Activity 4.16): warn if resizing would destroy animation frames.
    // Returns true if resize should proceed, false to cancel.
    function _confirmResizeInAnimMode() {
        if (AppState.animationMode && window.AnimFrames && AnimFrames.getFrameCount() > 1) {
            return confirm(
                'Resizing the canvas will destroy all ' + AnimFrames.getFrameCount() +
                ' animation frames.\n\nAre you sure you want to resize?'
            );
        }
        return true;
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
