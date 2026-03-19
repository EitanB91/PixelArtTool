'use strict';

// PixelCanvas — the drawing surface

var PixelCanvas = (function() {
    var _canvas  = null;
    var _ctx     = null;
    var _zoom    = 12;
    var _w       = 16; // game pixels wide
    var _h       = 22; // game pixels tall
    var _pixels  = null; // Uint8ClampedArray [r,g,b,a, ...]
    var _drawing = false;
    var _lastPx  = null; // {x,y} last drawn pixel (for line continuity)

    // Per-instance history — swappable for animation per-frame undo (O6)
    var _history = makeHistory();

    function toHex(r, g, b) {
        return '#' +
            ('0' + r.toString(16)).slice(-2).toUpperCase() +
            ('0' + g.toString(16)).slice(-2).toUpperCase() +
            ('0' + b.toString(16)).slice(-2).toUpperCase();
    }

    function hexToRgb(hex) {
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    }

    function _pixelIdx(x, y) { return (y * _w + x) * 4; }

    function _getPixelHex(x, y) {
        if (x < 0 || y < 0 || x >= _w || y >= _h) return null;
        var i = _pixelIdx(x, y);
        if (_pixels[i + 3] < 128) return null; // transparent
        return toHex(_pixels[i], _pixels[i + 1], _pixels[i + 2]);
    }

    function _setPixel(x, y, hexOrNull) {
        if (x < 0 || y < 0 || x >= _w || y >= _h) return;
        var i = _pixelIdx(x, y);
        if (hexOrNull === null) {
            _pixels[i]     = 0;
            _pixels[i + 1] = 0;
            _pixels[i + 2] = 0;
            _pixels[i + 3] = 0;
        } else {
            var rgb = hexToRgb(hexOrNull);
            _pixels[i]     = rgb[0];
            _pixels[i + 1] = rgb[1];
            _pixels[i + 2] = rgb[2];
            _pixels[i + 3] = 255;
        }
    }

    // Flood fill
    function _fill(startX, startY, targetHex, fillHex) {
        if (targetHex === fillHex) return;
        var stack = [[startX, startY]];
        var visited = new Uint8Array(_w * _h);
        while (stack.length) {
            var pt = stack.pop();
            var x = pt[0], y = pt[1];
            if (x < 0 || y < 0 || x >= _w || y >= _h) continue;
            if (visited[y * _w + x]) continue;
            if (_getPixelHex(x, y) !== targetHex) continue;
            visited[y * _w + x] = 1;
            _setPixel(x, y, fillHex);
            stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
        }
    }

    function _redraw() {
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

        // Draw pixels
        for (var py = 0; py < _h; py++) {
            for (var px = 0; px < _w; px++) {
                var hex = _getPixelHex(px, py);
                if (hex) {
                    _ctx.fillStyle = hex;
                    _ctx.fillRect(px * _zoom, py * _zoom, _zoom, _zoom);
                }
            }
        }

        // Draw grid
        _ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        _ctx.lineWidth   = 1;
        for (var gx = 0; gx <= _w; gx++) {
            _ctx.beginPath();
            _ctx.moveTo(gx * _zoom + 0.5, 0);
            _ctx.lineTo(gx * _zoom + 0.5, _h * _zoom);
            _ctx.stroke();
        }
        for (var gy = 0; gy <= _h; gy++) {
            _ctx.beginPath();
            _ctx.moveTo(0, gy * _zoom + 0.5);
            _ctx.lineTo(_w * _zoom, gy * _zoom + 0.5);
            _ctx.stroke();
        }
    }

    function _eventToPixel(e) {
        var rect = _canvas.getBoundingClientRect();
        var cx = e.clientX - rect.left;
        var cy = e.clientY - rect.top;
        return {
            x: Math.floor(cx / _zoom),
            y: Math.floor(cy / _zoom)
        };
    }

    function init(canvasEl) {
        _canvas = canvasEl;
        _ctx    = canvasEl.getContext('2d');
        resize(_w, _h);
        // Push initial blank state so Ctrl+Z can undo back to blank
        _history.push(_pixels);

        _canvas.addEventListener('mousedown', function(e) {
            _drawing = true;
            _lastPx  = null;
            _handleDraw(e);
            // P3-A2 (known): history is pushed here for all tools including eyedropper,
            // even though eyedropper doesn't modify pixels. Low-priority carry-forward.
            _history.push(_pixels);
        });
        _canvas.addEventListener('mousemove', function(e) {
            if (!_drawing) return;
            _handleDraw(e);
        });
        _canvas.addEventListener('mouseup',   function() {
            _drawing = false; _lastPx = null;
            if (window.AnimationPanel) AnimationPanel.syncAfterDraw();
        });
        _canvas.addEventListener('mouseleave',function() {
            _drawing = false; _lastPx = null;
            if (window.AnimationPanel) AnimationPanel.syncAfterDraw();
        });

        _canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });
    }

    function _handleDraw(e) {
        var pt   = _eventToPixel(e);
        var tool = AppState ? AppState.tool : 'pencil';

        if (pt.x < 0 || pt.y < 0 || pt.x >= _w || pt.y >= _h) return;
        if (_lastPx && _lastPx.x === pt.x && _lastPx.y === pt.y) return;
        _lastPx = pt;

        var color = Palette.getActive();

        if (tool === 'pencil') {
            _setPixel(pt.x, pt.y, color);
            _redraw();
            if (window.PalettePanel) PalettePanel.refresh();
        } else if (tool === 'eraser') {
            _setPixel(pt.x, pt.y, null);
            _redraw();
        } else if (tool === 'fill' && e.type === 'mousedown') {
            var target = _getPixelHex(pt.x, pt.y);
            _fill(pt.x, pt.y, target, color);
            _redraw();
        } else if (tool === 'eyedrop' && e.type === 'mousedown') {
            var picked = _getPixelHex(pt.x, pt.y);
            if (picked) {
                Palette.addColor(picked);
                if (window.PalettePanel) PalettePanel.refresh();
                if (window.Toolbar) Toolbar.refreshColorSwatch();
            }
        } else if (tool === 'region-paint') {
            // Region paint mode: assign pixel to active region
            if (window.AnimRegions && AppState && AppState.activeRegionId) {
                AnimRegions.paintPixel(AppState.activeRegionId, pt.x, pt.y);
                // Lightweight update — overlay + counts only, no frame strip rebuild
                if (window.AnimationPanel) AnimationPanel.refreshRegionOnly();
            }
        }
    }

    function resize(w, h) {
        _w = w;
        _h = h;
        _pixels = new Uint8ClampedArray(w * h * 4);
        _canvas.width  = w * _zoom;
        _canvas.height = h * _zoom;
        _history.reset();
        _redraw();
    }

    function setZoom(z) {
        _zoom = z;
        _canvas.width  = _w * _zoom;
        _canvas.height = _h * _zoom;
        _redraw();
    }

    function clear() {
        _pixels = new Uint8ClampedArray(_w * _h * 4);
        _history.push(_pixels);
        _redraw();
    }

    // Apply pixel data directly (bypasses history — used by undo/redo and frame navigation)
    function applyPixels(pixelData) {
        _pixels = pixelData;
        _redraw();
    }

    // Undo last draw action on the current history stack
    function undo() {
        var data = _history.undo();
        if (data) applyPixels(data);
    }

    // Redo last undone action on the current history stack
    function redo() {
        var data = _history.redo();
        if (data) applyPixels(data);
    }

    // Push pixels to the active history stack.
    // Use this instead of the global History singleton — canvas manages its own _history.
    // Called by generate.js and enforce.js after external pixel mutations.
    // @param {Uint8ClampedArray} pixelData — the pixel state to record
    function pushToHistory(pixelData) {
        _history.push(pixelData);
    }

    // Swap the active history instance (O6: called by AnimFrames on frame navigation)
    function setHistory(histInstance) {
        _history = histInstance;
    }

    function getPixels() { return _pixels; }
    function getWidth()  { return _w; }
    function getHeight() { return _h; }

    // Export as PNG base64
    function toPngBase64() {
        var offscreen = document.createElement('canvas');
        offscreen.width  = _w;
        offscreen.height = _h;
        var octx = offscreen.getContext('2d');
        var imgData = new ImageData(new Uint8ClampedArray(_pixels), _w, _h);
        octx.putImageData(imgData, 0, 0);
        return offscreen.toDataURL('image/png').split(',')[1];
    }

    // Keep applyHistory as an alias for backward-compat (output-panel, AI generate use it)
    function applyHistory(pixelData) { applyPixels(pixelData); }

    return {
        init, resize, setZoom, clear,
        applyHistory, applyPixels,
        undo, redo, pushToHistory, setHistory,
        getPixels, getWidth, getHeight,
        toPngBase64,
        redraw: _redraw
    };
})();
