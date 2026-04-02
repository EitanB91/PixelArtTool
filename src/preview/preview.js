'use strict';

// Preview Window — Phase PW-2: Rendering + Playback
// Receives frame data from editor via IPC relay. Renders sprite at auto-zoom
// with independent playback loop, mini frame strip, and background options.

(function() {
    // ── DOM references ──────────────────────────────────────────────────────
    var _els = {};

    // ── State ───────────────────────────────────────────────────────────────
    var _frames = [];
    var _activeIndex = 0;
    var _width = 0;
    var _height = 0;
    var _fps = 4;
    var _playing = false;
    var _playInterval = null;
    var _pinned = false;
    var _zoom = 4;
    var _syncingFps = false; // loop guard for bidirectional FPS sync

    // Background modes: 'checkerboard' | 'solid' | 'black'
    var _bgMode = 'checkerboard';
    var _bgModes = ['checkerboard', 'solid', 'black'];
    var _bgLabels = { checkerboard: 'BG: Check', solid: 'BG: Gray', black: 'BG: Black' };

    // Checkerboard tile size (in screen pixels)
    var CHECKER_SIZE = 8;
    var CHECKER_LIGHT = '#3A3A3A';
    var CHECKER_DARK  = '#2A2A2A';
    var BG_SOLID      = '#555555';

    // ── Init ────────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function() {
        _els.canvas       = document.getElementById('previewCanvas');
        _els.ctx          = _els.canvas.getContext('2d');
        _els.stage        = document.getElementById('preview-stage');
        _els.emptyMsg     = document.getElementById('preview-empty-msg');
        _els.playPause    = document.getElementById('preview-play-pause');
        _els.fpsSelect    = document.getElementById('preview-fps-select');
        _els.frameCounter = document.getElementById('preview-frame-counter');
        _els.strip        = document.getElementById('preview-strip');
        _els.btnBgMode    = document.getElementById('btn-bg-mode');
        _els.btnPin       = document.getElementById('btn-pin');

        // ── IPC listeners ───────────────────────────────────────────────────

        window.previewApi.onReceiveFrames(function(data) {
            _frames = data.frames;
            _width = data.width;
            _height = data.height;
            _activeIndex = data.activeIndex || 0;
            if (data.fps) {
                _fps = data.fps;
                _syncingFps = true;
                _els.fpsSelect.value = _fps;
                _syncingFps = false;
            }

            if (_frames.length === 0) {
                // No animation — show empty state
                if (_playing) _stopPlayback();
                _els.emptyMsg.style.display = '';
                _els.canvas.width = 0;
                _els.canvas.height = 0;
                _els.strip.innerHTML = '';
                _updateFrameCounter();
                return;
            }

            _els.emptyMsg.style.display = 'none';
            _calcZoom();
            _renderCurrentFrame();
            _buildStrip();
            _updateFpsSelect();
            _updateFrameCounter();
        });

        window.previewApi.onReceiveActive(function(data) {
            if (data.frameIndex >= 0 && data.frameIndex < _frames.length) {
                _frames[data.frameIndex] = { pixels: data.pixels };
                _activeIndex = data.frameIndex;
                _updateFrameCounter();
                _updateStripHighlight();
                // Re-render if this frame is currently displayed
                if (!_playing || _activeIndex === data.frameIndex) {
                    _renderCurrentFrame();
                }
                // Update the specific thumbnail
                _renderStripThumb(data.frameIndex);
            }
        });

        window.previewApi.onReceiveFps(function(data) {
            _fps = data.fps;
            _syncingFps = true;
            _els.fpsSelect.value = _fps;
            _syncingFps = false;
            // Restart interval at new rate if playing
            if (_playing) {
                _stopPlayback();
                _startPlayback();
            }
        });

        // ── Play/Pause button ───────────────────────────────────────────────

        _els.playPause.addEventListener('click', function() {
            if (_frames.length < 2) return;
            if (_playing) {
                _stopPlayback();
            } else {
                _startPlayback();
            }
        });

        // ── Background mode cycle ───────────────────────────────────────────

        _els.btnBgMode.addEventListener('click', function() {
            var idx = _bgModes.indexOf(_bgMode);
            _bgMode = _bgModes[(idx + 1) % _bgModes.length];
            _els.btnBgMode.textContent = _bgLabels[_bgMode];
            _renderCurrentFrame();
        });
        _els.btnBgMode.textContent = _bgLabels[_bgMode];

        // ── FPS select change (reverse sync to editor) ─────────────────────

        _els.fpsSelect.addEventListener('change', function() {
            var fps = parseInt(_els.fpsSelect.value);
            _fps = fps;
            // Restart playback at new rate if playing
            if (_playing) {
                _stopPlayback();
                _startPlayback();
            }
            // Send back to editor (unless this change came FROM the editor)
            if (!_syncingFps) {
                window.previewApi.sendFpsChanged(fps);
            }
        });

        // ── Pin toggle ──────────────────────────────────────────────────────

        _els.btnPin.addEventListener('click', function() {
            _pinned = !_pinned;
            _els.btnPin.classList.toggle('active', _pinned);
            window.previewApi.setAlwaysOnTop(_pinned);
        });

        // ── Resize handler — recalculate zoom ───────────────────────────────

        window.addEventListener('resize', function() {
            if (_frames.length > 0) {
                _calcZoom();
                _renderCurrentFrame();
            }
        });
    });

    // ── Auto-zoom calculation ───────────────────────────────────────────────

    function _calcZoom() {
        if (_width === 0 || _height === 0) { _zoom = 4; return; }

        var stageW = _els.stage.clientWidth - 16;  // 8px padding each side
        var stageH = _els.stage.clientHeight - 16;

        var maxZoomX = Math.floor(stageW / _width);
        var maxZoomY = Math.floor(stageH / _height);
        var fit = Math.min(maxZoomX, maxZoomY);

        // Clamp to integer zoom 2x–8x
        _zoom = Math.max(2, Math.min(8, fit));
    }

    // ── Render ──────────────────────────────────────────────────────────────

    function _renderCurrentFrame() {
        if (_frames.length === 0) return;
        var frame = _frames[_activeIndex];
        if (!frame || !frame.pixels) return;
        _renderFrame(frame.pixels, _width, _height);
    }

    function _renderFrame(pixels, w, h) {
        var canvasW = w * _zoom;
        var canvasH = h * _zoom;

        _els.canvas.width = canvasW;
        _els.canvas.height = canvasH;

        var ctx = _els.ctx;
        ctx.clearRect(0, 0, canvasW, canvasH);

        // Draw background
        _drawBackground(ctx, canvasW, canvasH);

        // Draw pixels
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var i = (y * w + x) * 4;
                var a = pixels[i + 3];
                if (a < 1) continue; // fully transparent
                if (a < 255) {
                    ctx.globalAlpha = a / 255;
                }
                ctx.fillStyle = 'rgb(' + pixels[i] + ',' + pixels[i + 1] + ',' + pixels[i + 2] + ')';
                ctx.fillRect(x * _zoom, y * _zoom, _zoom, _zoom);
                if (a < 255) {
                    ctx.globalAlpha = 1;
                }
            }
        }
    }

    function _drawBackground(ctx, w, h) {
        if (_bgMode === 'black') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, w, h);
        } else if (_bgMode === 'solid') {
            ctx.fillStyle = BG_SOLID;
            ctx.fillRect(0, 0, w, h);
        } else {
            // Checkerboard
            for (var cy = 0; cy < h; cy += CHECKER_SIZE) {
                for (var cx = 0; cx < w; cx += CHECKER_SIZE) {
                    var isLight = ((cx / CHECKER_SIZE + cy / CHECKER_SIZE) % 2) === 0;
                    ctx.fillStyle = isLight ? CHECKER_LIGHT : CHECKER_DARK;
                    ctx.fillRect(cx, cy,
                        Math.min(CHECKER_SIZE, w - cx),
                        Math.min(CHECKER_SIZE, h - cy));
                }
            }
        }
    }

    // ── Playback loop ───────────────────────────────────────────────────────

    function _startPlayback() {
        if (_frames.length < 2) return;
        _playing = true;
        _els.playPause.textContent = '\u275A\u275A'; // pause icon ❚❚
        _playInterval = setInterval(function() {
            _activeIndex = (_activeIndex + 1) % _frames.length;
            _renderCurrentFrame();
            _updateFrameCounter();
            _updateStripHighlight();
        }, 1000 / _fps);
    }

    function _stopPlayback() {
        _playing = false;
        _els.playPause.textContent = '\u25B6'; // play icon ▶
        if (_playInterval) {
            clearInterval(_playInterval);
            _playInterval = null;
        }
    }

    // ── Mini frame strip ────────────────────────────────────────────────────

    function _buildStrip() {
        _els.strip.innerHTML = '';
        for (var i = 0; i < _frames.length; i++) {
            var thumb = document.createElement('canvas');
            thumb.className = 'preview-thumb';
            thumb.width = 36;
            thumb.height = 36;
            thumb.dataset.idx = i;

            if (i === _activeIndex) thumb.classList.add('active');

            _renderStripThumbCanvas(thumb, _frames[i].pixels, _width, _height);

            thumb.addEventListener('click', (function(idx) {
                return function() {
                    // Click-to-inspect: pause and show that frame
                    if (_playing) _stopPlayback();
                    _activeIndex = idx;
                    _renderCurrentFrame();
                    _updateFrameCounter();
                    _updateStripHighlight();
                };
            })(i));

            _els.strip.appendChild(thumb);
        }
    }

    function _renderStripThumb(frameIndex) {
        var thumbs = _els.strip.querySelectorAll('.preview-thumb');
        if (frameIndex < thumbs.length) {
            _renderStripThumbCanvas(thumbs[frameIndex], _frames[frameIndex].pixels, _width, _height);
        }
    }

    function _renderStripThumbCanvas(canvas, pixels, spriteW, spriteH) {
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 36, 36);

        if (!pixels) return;

        // Fit sprite into 36x36 thumbnail
        var scale = Math.min(36 / spriteW, 36 / spriteH);
        var pxSize = Math.max(1, Math.floor(scale));
        var offX = Math.floor((36 - spriteW * pxSize) / 2);
        var offY = Math.floor((36 - spriteH * pxSize) / 2);

        for (var y = 0; y < spriteH; y++) {
            for (var x = 0; x < spriteW; x++) {
                var i = (y * spriteW + x) * 4;
                if (pixels[i + 3] < 128) continue;
                ctx.fillStyle = 'rgb(' + pixels[i] + ',' + pixels[i + 1] + ',' + pixels[i + 2] + ')';
                ctx.fillRect(offX + x * pxSize, offY + y * pxSize, pxSize, pxSize);
            }
        }
    }

    function _updateStripHighlight() {
        var thumbs = _els.strip.querySelectorAll('.preview-thumb');
        for (var i = 0; i < thumbs.length; i++) {
            thumbs[i].classList.toggle('active', i === _activeIndex);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    function _updateFpsSelect() {
        if (_els.fpsSelect) {
            _syncingFps = true;
            _els.fpsSelect.value = _fps;
            _syncingFps = false;
        }
    }

    function _updateFrameCounter() {
        if (_els.frameCounter) {
            _els.frameCounter.textContent = 'Frame ' + (_activeIndex + 1) + ' / ' + Math.max(1, _frames.length);
        }
    }
})();
