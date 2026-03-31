'use strict';

// AnimationPanel — animation mode UI controller
//
// Owns all animation-specific DOM: tab switching, frame strip, playback controls,
// pose template picker, onion skin toggle, region panel, background fill control.
//
// Wired to: AnimFrames, Timeline, AnimRegions, PoseTemplates, PixelCanvas, AppState

var AnimationPanel = (function() {

    // ── DOM references ───────────────────────────────────────────────────────
    var _els = {};

    // Saved canvas state from Sprite mode — restored on animation mode exit
    var _savedPixels = null;

    // Region overlay color cycle
    var _regionColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ];
    var _regionColorIdx = 0;

    // ── Init ─────────────────────────────────────────────────────────────────

    function init() {
        // Cache DOM references
        _els.app            = document.getElementById('app');
        _els.animPanel      = document.getElementById('animation-panel');
        _els.bottomBar      = document.getElementById('bottom-bar');
        _els.regionToolBtn  = document.querySelector('[data-tool="region-paint"]');
        _els.onionCanvas    = document.getElementById('onionCanvas');
        _els.regionCanvas   = document.getElementById('regionCanvas');
        _els.drawCanvas     = document.getElementById('drawCanvas');

        // Tab buttons
        _els.tabBtns = document.querySelectorAll('.tab-btn');

        // Playback controls
        _els.btnPrevFrame  = document.getElementById('btn-prev-frame');
        _els.btnPlayPause  = document.getElementById('btn-play-pause');
        _els.btnNextFrame  = document.getElementById('btn-next-frame');
        _els.fpsSelect     = document.getElementById('fps-select');
        _els.frameCounter  = document.getElementById('frame-counter');
        _els.btnAddFrame   = document.getElementById('btn-add-frame');
        _els.frameStripScroll = document.getElementById('frame-strip-scroll');

        // Pose chips
        _els.poseChips     = document.querySelectorAll('.pose-chip');
        _els.btnApply      = document.getElementById('btn-apply-template');

        // Onion skin
        _els.onionToggle   = document.getElementById('onion-toggle');

        // Region panel
        _els.btnNewRegion  = document.getElementById('btn-new-region');
        _els.regionList    = document.getElementById('region-list');

        // Background fill
        _els.bgTransparent = document.getElementById('bg-transparent');
        _els.bgFillColor   = document.getElementById('bg-fill-color');

        // ── Wire tab switching ───────────────────────────────────────────────
        _els.tabBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var tab = btn.dataset.tab;
                _els.tabBtns.forEach(function(b) {
                    b.classList.toggle('active', b.dataset.tab === tab);
                });
                if (tab === 'animation') {
                    show();
                } else {
                    hide();
                }
            });
        });

        // ── Pose chip selection ──────────────────────────────────────────────
        _els.poseChips.forEach(function(chip) {
            chip.addEventListener('click', function() {
                _els.poseChips.forEach(function(c) { c.classList.remove('selected'); });
                chip.classList.add('selected');
                _els.btnApply.disabled = false;
            });
        });

        // ── Apply Template button ────────────────────────────────────────────
        _els.btnApply.addEventListener('click', function() {
            _applyTemplate();
        });

        // ── Playback controls ────────────────────────────────────────────────
        _els.btnPrevFrame.addEventListener('click', function() {
            if (!AppState.animationMode) return;
            var idx = AnimFrames.getActiveIndex();
            if (idx > 0) _navigateToFrame(idx - 1);
        });

        _els.btnNextFrame.addEventListener('click', function() {
            if (!AppState.animationMode) return;
            var idx = AnimFrames.getActiveIndex();
            if (idx < AnimFrames.getFrameCount() - 1) _navigateToFrame(idx + 1);
        });

        _els.btnPlayPause.addEventListener('click', function() {
            if (!AppState.animationMode) return;
            if (Timeline.isPlaying()) {
                Timeline.pause();
                _els.btnPlayPause.textContent = '\u25B6'; // ▶
            } else {
                // Save current frame before playback starts
                _saveCurrentFrame();
                Timeline.play();
                _els.btnPlayPause.textContent = '\u275A\u275A'; // ❚❚
            }
        });

        _els.fpsSelect.addEventListener('change', function() {
            Timeline.setFps(parseInt(_els.fpsSelect.value));
        });

        // ── Add frame button ─────────────────────────────────────────────────
        _els.btnAddFrame.addEventListener('click', function() {
            if (!AppState.animationMode) return;
            _saveCurrentFrame();
            var newIdx = AnimFrames.addFrame(false);
            Timeline.setFrameCount(AnimFrames.getFrameCount());
            _navigateToFrame(newIdx);
        });

        // ── Onion skin toggle ────────────────────────────────────────────────
        _els.onionToggle.addEventListener('change', function() {
            if (_els.onionToggle.checked) {
                _els.onionCanvas.style.display = 'block';
                renderOnionSkin();
            } else {
                _els.onionCanvas.style.display = 'none';
            }
        });

        // ── Region panel: New Region button ──────────────────────────────────
        _els.btnNewRegion.addEventListener('click', function() {
            if (!AppState.animationMode) return;
            var color = _regionColors[_regionColorIdx % _regionColors.length];
            _regionColorIdx++;
            var region = AnimRegions.addRegion('', color);
            AppState.activeRegionId = region.id;
            _renderRegionList();
            _renderRegionOverlay();
        });

        // ── Background fill toggle ───────────────────────────────────────────
        _els.bgTransparent.addEventListener('change', function() {
            _els.bgFillColor.disabled = _els.bgTransparent.checked;
            AppState.animBackgroundFill = _els.bgTransparent.checked
                ? 'transparent'
                : _els.bgFillColor.value;
        });

        _els.bgFillColor.addEventListener('input', function() {
            if (!_els.bgTransparent.checked) {
                AppState.animBackgroundFill = _els.bgFillColor.value;
            }
        });

        // ── Wire Timeline frame-change callback ─────────────────────────────
        Timeline.init(function(nextIndex) {
            _navigateToFrame(nextIndex);
        });
    }

    // ── Frame navigation ─────────────────────────────────────────────────────

    // Save the current canvas pixels back to the active frame in AnimFrames.
    function _saveCurrentFrame() {
        if (AnimFrames.getFrameCount() > 0) {
            AnimFrames.setCurrentPixels(PixelCanvas.getPixels());
        }
    }

    // Navigate to a specific frame index. Updates canvas, history, and UI.
    function _navigateToFrame(idx) {
        _saveCurrentFrame();
        var frame = AnimFrames.goToFrame(idx);
        AppState.activeFrameIndex = idx;
        PixelCanvas.applyPixels(new Uint8ClampedArray(frame.pixels));
        PixelCanvas.setHistory(frame.history);
        _updateFrameCounter();
        renderFrameStrip();
        if (_els.onionToggle.checked) renderOnionSkin();
        _renderRegionOverlay();
    }

    // ── Apply Template ───────────────────────────────────────────────────────

    function _applyTemplate() {
        if (!AppState.animationMode) return;

        // Find selected pose chip
        var selectedChip = document.querySelector('.pose-chip.selected');
        if (!selectedChip) return;
        var poseId = selectedChip.dataset.pose;

        // Show loading state on Apply button (Activity 4.15)
        var prevText = _els.btnApply.textContent;
        _els.btnApply.textContent = 'Generating\u2026';
        _els.btnApply.disabled = true;
        selectedChip.classList.add('generating');

        // Save current canvas to frame 0 before generating
        _saveCurrentFrame();

        // Use frame 0 as the base sprite
        var basePixels = AnimFrames.goToFrame(0).pixels;
        var w = AnimFrames.getWidth();
        var h = AnimFrames.getHeight();

        // Generate frames
        var regions = AnimRegions.getAll();
        var generatedFrames = PoseTemplates.generate(poseId, basePixels, w, h, regions);

        // Replace all frames with generated ones
        AnimFrames.seed(generatedFrames[0], w, h);
        for (var i = 1; i < generatedFrames.length; i++) {
            AnimFrames.addFrame(false);
            AnimFrames.goToFrame(i);
            AnimFrames.setCurrentPixels(generatedFrames[i]);
            // Push generated pixels to the frame's history so undo works
            AnimFrames.getCurrentHistory().push(generatedFrames[i]);
        }

        // Update Timeline
        Timeline.setFrameCount(AnimFrames.getFrameCount());

        // Navigate to frame 0
        _navigateToFrame(0);

        // Restore Apply button after a brief flash so user sees the state change
        setTimeout(function() {
            _els.btnApply.textContent = prevText;
            _els.btnApply.disabled = false;
            selectedChip.classList.remove('generating');
        }, 300);
    }

    // ── Show (enter animation mode) ──────────────────────────────────────────

    function show() {
        if (AppState.animationMode) return;
        AppState.animationMode = true;
        AppState.activeFrameIndex = 0;

        // Save current canvas state so we can restore on exit
        _savedPixels = new Uint8ClampedArray(PixelCanvas.getPixels());

        // Seed AnimFrames with current canvas pixels
        AnimFrames.seed(
            PixelCanvas.getPixels(),
            PixelCanvas.getWidth(),
            PixelCanvas.getHeight()
        );

        // Swap canvas history to frame 0's per-frame history
        PixelCanvas.setHistory(AnimFrames.getCurrentHistory());

        // Update Timeline frame count
        Timeline.setFrameCount(AnimFrames.getFrameCount());

        // Show animation UI
        _els.animPanel.style.display = '';
        _els.bottomBar.style.display = '';
        _els.app.classList.add('anim-mode');

        // Size gate: enable/disable region tools
        updateSizeGate(PixelCanvas.getWidth(), PixelCanvas.getHeight());

        // Sync overlay canvas sizes
        _syncOverlayCanvases();

        // Render UI
        _updateFrameCounter();
        renderFrameStrip();
        _renderRegionList();
    }

    // ── Hide (exit animation mode) ───────────────────────────────────────────

    function hide() {
        if (!AppState.animationMode) return;

        // Defensive guard: stop playback to prevent interval leak (Activity 2.14)
        Timeline.pause();
        Timeline.reset();

        // Restore saved canvas pixels from before animation mode
        if (_savedPixels) {
            PixelCanvas.applyPixels(_savedPixels);
            _savedPixels = null;
        }

        // Restore the default (non-frame) history instance
        PixelCanvas.setHistory(makeHistory());

        // Reset animation + region state
        AnimFrames.reset();
        AnimRegions.clear();
        _regionColorIdx = 0;
        AppState.animationMode = false;
        AppState.activeFrameIndex = 0;
        AppState.activeRegionId = null;

        // Revert tool to pencil if region-paint was active
        if (AppState.tool === 'region-paint') {
            AppState.tool = 'pencil';
            document.querySelectorAll('.tool-btn').forEach(function(btn) {
                btn.classList.toggle('active', btn.dataset.tool === 'pencil');
            });
        }

        // Hide animation UI
        _els.animPanel.style.display = 'none';
        _els.bottomBar.style.display = 'none';
        _els.app.classList.remove('anim-mode');

        // Hide region paint tool button
        if (_els.regionToolBtn) {
            _els.regionToolBtn.style.display = 'none';
        }

        // Hide overlay canvases
        _els.onionCanvas.style.display = 'none';
        _els.regionCanvas.style.display = 'none';

        // Reset pose chip selection
        _els.poseChips.forEach(function(c) { c.classList.remove('selected'); });
        _els.btnApply.disabled = true;

        // Reset onion skin checkbox
        _els.onionToggle.checked = false;
    }

    // ── Canvas layering (Activity 2.12) ──────────────────────────────────────

    function _syncOverlayCanvases() {
        var w = _els.drawCanvas.width;
        var h = _els.drawCanvas.height;

        _els.onionCanvas.width  = w;
        _els.onionCanvas.height = h;
        _els.regionCanvas.width  = w;
        _els.regionCanvas.height = h;

        // Position overlays to match the drawing canvas
        var rect = _els.drawCanvas.getBoundingClientRect();
        var parentRect = _els.drawCanvas.parentElement.getBoundingClientRect();
        var left = (rect.left - parentRect.left) + 'px';
        var top  = (rect.top - parentRect.top) + 'px';

        _els.onionCanvas.style.left = left;
        _els.onionCanvas.style.top  = top;
        _els.regionCanvas.style.left = left;
        _els.regionCanvas.style.top  = top;
    }

    // ── Frame strip ──────────────────────────────────────────────────────────

    function renderFrameStrip() {
        if (!_els.frameStripScroll) return;
        var frames = AnimFrames.getAll();
        var activeIdx = AnimFrames.getActiveIndex();
        var w = AnimFrames.getWidth();
        var h = AnimFrames.getHeight();

        _els.frameStripScroll.innerHTML = '';

        for (var i = 0; i < frames.length; i++) {
            var wrapper = document.createElement('div');
            wrapper.style.display = 'inline-flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';
            wrapper.style.flexShrink = '0';

            var thumb = document.createElement('canvas');
            thumb.className = 'frame-thumb' + (i === activeIdx ? ' active' : '');
            thumb.width = 40;
            thumb.height = 40;
            thumb.dataset.frameIdx = i;

            // Render pixel data onto thumbnail
            _renderThumb(thumb, frames[i].pixels, w, h);

            // Click to navigate
            thumb.addEventListener('click', (function(idx) {
                return function() {
                    if (Timeline.isPlaying()) {
                        Timeline.pause();
                        _els.btnPlayPause.textContent = '\u25B6';
                    }
                    _navigateToFrame(idx);
                };
            })(i));

            var label = document.createElement('div');
            label.className = 'frame-thumb-label';
            label.textContent = (i + 1);

            wrapper.appendChild(thumb);
            wrapper.appendChild(label);
            _els.frameStripScroll.appendChild(wrapper);
        }
    }

    function _renderThumb(canvas, pixels, spriteW, spriteH) {
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fit sprite into 40x40 thumbnail
        var scale = Math.min(40 / spriteW, 40 / spriteH);
        var offX = Math.floor((40 - spriteW * scale) / 2);
        var offY = Math.floor((40 - spriteH * scale) / 2);
        var pxSize = Math.max(1, Math.floor(scale));

        for (var y = 0; y < spriteH; y++) {
            for (var x = 0; x < spriteW; x++) {
                var i = (y * spriteW + x) * 4;
                if (pixels[i + 3] < 128) continue;
                ctx.fillStyle = 'rgb(' + pixels[i] + ',' + pixels[i + 1] + ',' + pixels[i + 2] + ')';
                ctx.fillRect(offX + x * pxSize, offY + y * pxSize, pxSize, pxSize);
            }
        }
    }

    // ── Onion skin ───────────────────────────────────────────────────────────

    function renderOnionSkin() {
        if (!_els.onionCanvas || !AppState.animationMode) return;
        var ctx = _els.onionCanvas.getContext('2d');
        ctx.clearRect(0, 0, _els.onionCanvas.width, _els.onionCanvas.height);

        if (!_els.onionToggle.checked) return;

        var frames = AnimFrames.getAll();
        var activeIdx = AnimFrames.getActiveIndex();
        var w = AnimFrames.getWidth();
        var h = AnimFrames.getHeight();
        var zoom = parseInt(document.getElementById('zoom-slider').value) || 12;

        // Previous frame at 20% opacity
        if (activeIdx > 0) {
            ctx.globalAlpha = 0.2;
            _drawOnionFrame(ctx, frames[activeIdx - 1].pixels, w, h, zoom);
        }

        // Next frame at 10% opacity
        if (activeIdx < frames.length - 1) {
            ctx.globalAlpha = 0.1;
            _drawOnionFrame(ctx, frames[activeIdx + 1].pixels, w, h, zoom);
        }

        ctx.globalAlpha = 1.0;
        _els.onionCanvas.style.display = 'block';
    }

    function _drawOnionFrame(ctx, pixels, w, h, zoom) {
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var i = (y * w + x) * 4;
                if (pixels[i + 3] < 128) continue;
                ctx.fillStyle = 'rgb(' + pixels[i] + ',' + pixels[i + 1] + ',' + pixels[i + 2] + ')';
                ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
            }
        }
    }

    // ── Region panel ─────────────────────────────────────────────────────────

    function _renderRegionList() {
        if (!_els.regionList) return;
        var regions = AnimRegions.getAll();

        if (regions.length === 0) {
            _els.regionList.innerHTML = '<div class="region-placeholder">No regions defined</div>';
            return;
        }

        _els.regionList.innerHTML = '';
        for (var i = 0; i < regions.length; i++) {
            var region = regions[i];
            var row = document.createElement('div');
            row.className = 'region-row' + (region.id === AppState.activeRegionId ? ' selected' : '');
            row.dataset.regionId = region.id;

            var swatch = document.createElement('span');
            swatch.className = 'region-swatch';
            swatch.style.background = region.color;

            var nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'region-name-input';
            nameInput.value = region.name;
            nameInput.placeholder = 'name...';
            nameInput.dataset.regionId = region.id;
            // Stop click propagation so row handler doesn't rebuild DOM mid-edit
            nameInput.addEventListener('click', function(e) {
                e.stopPropagation();
            });
            nameInput.addEventListener('change', (function(rid) {
                return function(e) {
                    var r = AnimRegions.getById(rid);
                    if (r) r.name = e.target.value;
                };
            })(region.id));

            var countLabel = document.createElement('span');
            countLabel.className = 'region-count';
            countLabel.textContent = region.pixels.size + 'px';

            var removeBtn = document.createElement('button');
            removeBtn.className = 'region-remove-btn';
            removeBtn.textContent = '\u00D7'; // ×
            removeBtn.title = 'Remove region';
            removeBtn.addEventListener('click', (function(rid) {
                return function(e) {
                    e.stopPropagation();
                    AnimRegions.removeRegion(rid);
                    if (AppState.activeRegionId === rid) {
                        AppState.activeRegionId = null;
                    }
                    _renderRegionList();
                    _renderRegionOverlay();
                };
            })(region.id));

            // Click row to select this region for painting
            row.addEventListener('click', (function(rid) {
                return function() {
                    AppState.activeRegionId = rid;
                    _renderRegionList();
                };
            })(region.id));

            row.appendChild(swatch);
            row.appendChild(nameInput);
            row.appendChild(countLabel);
            row.appendChild(removeBtn);
            _els.regionList.appendChild(row);
        }
    }

    function _renderRegionOverlay() {
        if (!_els.regionCanvas || !AppState.animationMode) return;
        var regions = AnimRegions.getAll();
        if (regions.length === 0) {
            _els.regionCanvas.style.display = 'none';
            return;
        }
        _els.regionCanvas.style.display = 'block';
        var ctx = _els.regionCanvas.getContext('2d');
        var zoom = parseInt(document.getElementById('zoom-slider').value) || 12;
        AnimRegions.renderOverlay(ctx, zoom);
    }

    // ── Size gate ────────────────────────────────────────────────────────────

    function updateSizeGate(w, h) {
        var open = AnimRegions.isSizeGateOpen(w, h);
        if (_els.regionToolBtn) {
            _els.regionToolBtn.style.display = 'flex';
            _els.regionToolBtn.disabled = !open;
            _els.regionToolBtn.title = open
                ? 'Region Paint'
                : 'Region Paint (available at 24\u00D724+)';
        }
        if (_els.btnNewRegion) {
            _els.btnNewRegion.disabled = !open;
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    function _updateFrameCounter() {
        if (_els.frameCounter) {
            var idx = AnimFrames.getFrameCount() > 0 ? AnimFrames.getActiveIndex() + 1 : 1;
            var total = Math.max(1, AnimFrames.getFrameCount());
            _els.frameCounter.textContent = 'Frame ' + idx + ' / ' + total;
        }
    }

    // ── Refresh ──────────────────────────────────────────────────────────────

    function refresh() {
        renderFrameStrip();
        if (_els.onionToggle && _els.onionToggle.checked) renderOnionSkin();
        _updateFrameCounter();
        _renderRegionList();
        _renderRegionOverlay();
    }

    // Called by canvas after drawing (mouseup) to sync frame pixels
    function syncAfterDraw() {
        if (!AppState.animationMode) return;
        _saveCurrentFrame();
        renderFrameStrip();
    }

    // Lightweight region-only update — called per pixel during region-paint drag.
    // Avoids full refresh() which rebuilds the entire frame strip DOM.
    function refreshRegionOnly() {
        if (!AppState.animationMode) return;
        _renderRegionOverlay();
        _renderRegionList();
    }

    return {
        init,
        show,
        hide,
        renderFrameStrip,
        renderOnionSkin,
        updateSizeGate,
        refresh,
        syncAfterDraw,
        refreshRegionOnly
    };
})();
