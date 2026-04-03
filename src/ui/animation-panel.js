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

    // Pre-named region presets (D2 decision)
    // Must stay in sync with: index.html <select id="region-preset"> options + pose-templates.js lookups
    var _PRESET_NAMES = ['head', 'torso', 'left-arm', 'right-arm', 'left-leg', 'right-leg'];

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

        // Open Preview button
        _els.btnOpenPreview = document.getElementById('btn-open-preview');

        // Region panel
        _els.regionPreset  = document.getElementById('region-preset');
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
            var fps = parseInt(_els.fpsSelect.value);
            Timeline.setFps(fps);
            // Forward FPS to preview (guard against loop)
            if (!_syncingFps && window.api && window.api.setPreviewFps) {
                window.api.setPreviewFps(fps);
            }
        });

        // ── Add frame button ─────────────────────────────────────────────────
        _els.btnAddFrame.addEventListener('click', function() {
            if (!AppState.animationMode) return;
            _saveCurrentFrame();
            var newIdx = AnimFrames.addFrame(false);
            Timeline.setFrameCount(AnimFrames.getFrameCount());
            _navigateToFrame(newIdx, true);
            _pushToPreview(); // full push so preview gets the new frame
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

        // ── Region panel: preset dropdown ───────────────────────────────────
        _els.regionPreset.addEventListener('change', function() {
            if (!AppState.animationMode) return;
            var value = _els.regionPreset.value;
            var name = '';

            if (value === 'custom') {
                name = (prompt('Region name:') || '').trim();
                if (!name) {
                    // User cancelled — reset dropdown
                    _els.regionPreset.value = '';
                    return;
                }
                // Block custom names that duplicate a preset (Viktor A1)
                if (_PRESET_NAMES.indexOf(name.toLowerCase()) !== -1) {
                    alert('Use the preset option for "' + name + '" instead.');
                    _els.regionPreset.value = '';
                    return;
                }
            } else {
                name = value; // preset name (e.g. 'head', 'torso')
            }

            var color = _regionColors[_regionColorIdx % _regionColors.length];
            _regionColorIdx++;
            var region = AnimRegions.addRegion(name, color);
            AppState.activeRegionId = region.id;

            // Reset dropdown back to placeholder
            _els.regionPreset.value = '';

            _renderRegionList();
            _renderRegionOverlay();
            _syncPresetDropdown();
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

        // ── Open Preview button ─────────────────────────────────────────────
        _els.btnOpenPreview.addEventListener('click', function() {
            if (window.api && window.api.openPreviewWindow) {
                window.api.openPreviewWindow();
            }
        });

        // ── Wire Timeline frame-change callback ─────────────────────────────
        Timeline.init(function(nextIndex) {
            _navigateToFrame(nextIndex);
        });

        // ── Reverse FPS sync: preview → editor (with loop guard) ────────────
        if (window.api && window.api.onPreviewFpsChanged) {
            window.api.onPreviewFpsChanged(function(data) {
                var fps = data.fps;
                if (parseInt(_els.fpsSelect.value) === fps) return; // already matching
                _syncingFps = true;
                _els.fpsSelect.value = fps;
                Timeline.setFps(fps);
                _syncingFps = false;
            });
        }
    }

    // ── Frame navigation ─────────────────────────────────────────────────────

    // Save the current canvas pixels back to the active frame in AnimFrames.
    function _saveCurrentFrame() {
        if (AnimFrames.getFrameCount() > 0) {
            AnimFrames.setCurrentPixels(PixelCanvas.getPixels());
        }
    }

    // Navigate to a specific frame index. Updates canvas, history, and UI.
    // skipPreviewPush: when true, caller handles preview push (e.g. full push follows)
    function _navigateToFrame(idx, skipPreviewPush) {
        _saveCurrentFrame();
        var frame = AnimFrames.goToFrame(idx);
        AppState.activeFrameIndex = idx;
        PixelCanvas.applyPixels(new Uint8ClampedArray(frame.pixels));
        PixelCanvas.setHistory(frame.history);
        _updateFrameCounter();
        renderFrameStrip();
        if (_els.onionToggle.checked) renderOnionSkin();
        _renderRegionOverlay();
        if (!skipPreviewPush) _pushActiveToPreview(idx);
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

        // Navigate to frame 0, then push all frames to preview
        _navigateToFrame(0, true);
        _pushToPreview();

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

        // Save current canvas state so we can restore on exit
        _savedPixels = new Uint8ClampedArray(PixelCanvas.getPixels());

        // 6.1b: Check for cached animation data with matching dimensions
        var w = PixelCanvas.getWidth();
        var h = PixelCanvas.getHeight();
        if (AnimFrames.getFrameCount() > 0 && AnimFrames.getWidth() === w && AnimFrames.getHeight() === h) {
            // Restore from cache — navigate to the previously active frame
            var idx = AppState.activeFrameIndex;
            if (idx >= AnimFrames.getFrameCount()) idx = 0;
            AppState.activeFrameIndex = idx;
            var frame = AnimFrames.goToFrame(idx);
            PixelCanvas.applyPixels(new Uint8ClampedArray(frame.pixels));
            PixelCanvas.setHistory(frame.history);
        } else {
            // No cache or dimensions changed — seed fresh
            AppState.activeFrameIndex = 0;
            AnimRegions.clear();
            _regionColorIdx = 0;
            AppState.activeRegionId = null;
            AnimFrames.seed(PixelCanvas.getPixels(), w, h);
            PixelCanvas.setHistory(AnimFrames.getCurrentHistory());
        }

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
        _syncPresetDropdown();

        // Update export panel labels for animation mode
        OutputPanel.updateMode(true);

        // Push initial frame data to preview window (if open)
        _pushToPreview();
    }

    // ── Hide (exit animation mode) ───────────────────────────────────────────

    function hide() {
        if (!AppState.animationMode) return;

        // Defensive guard: stop playback to prevent interval leak (Activity 2.14)
        // 6.1b: pause only — do NOT call Timeline.reset() which destroys _onFrameChange callback (Viktor B1)
        Timeline.pause();

        // 6.1b: Save current frame pixels before leaving so edits are preserved
        _saveCurrentFrame();

        // Restore saved canvas pixels from before animation mode
        if (_savedPixels) {
            PixelCanvas.applyPixels(_savedPixels);
            _savedPixels = null;
        }

        // Restore the default (non-frame) history instance
        PixelCanvas.setHistory(makeHistory());

        // 6.1b: Do NOT reset AnimFrames or AnimRegions — persist for re-entry.
        // Keep _regionColorIdx, AppState.activeFrameIndex, AppState.activeRegionId.
        // Only cleared on explicit New/resize via clearCache().
        AppState.animationMode = false;

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

        // Reset region preset dropdown
        if (_els.regionPreset) {
            _els.regionPreset.value = '';
            _syncPresetDropdown();
        }

        // Reset onion skin checkbox
        _els.onionToggle.checked = false;

        // Cancel any pending throttled preview push
        if (_pendingPushTimer) {
            clearTimeout(_pendingPushTimer);
            _pendingPushTimer = null;
        }

        // Restore export panel labels for sprite mode
        OutputPanel.updateMode(false);

        // Tell preview to show "No animation" message
        _clearPreview();
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
            var isPreset = _PRESET_NAMES.indexOf(region.name) !== -1;

            var row = document.createElement('div');
            row.className = 'region-row' + (region.id === AppState.activeRegionId ? ' selected' : '');
            row.dataset.regionId = region.id;

            var swatch = document.createElement('span');
            swatch.className = 'region-swatch';
            swatch.style.background = region.color;

            // Preset names: static label. Custom names: editable input.
            var nameEl;
            if (isPreset) {
                nameEl = document.createElement('span');
                nameEl.className = 'region-name-label';
                nameEl.textContent = region.name;
            } else {
                nameEl = document.createElement('input');
                nameEl.type = 'text';
                nameEl.className = 'region-name-input';
                nameEl.value = region.name;
                nameEl.placeholder = 'name...';
                nameEl.dataset.regionId = region.id;
                nameEl.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
                nameEl.addEventListener('change', (function(rid) {
                    return function(e) {
                        var r = AnimRegions.getById(rid);
                        if (r) r.name = e.target.value;
                    };
                })(region.id));
            }

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
                    _syncPresetDropdown();
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
            row.appendChild(nameEl);
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

    // ── Preset dropdown sync ────────────────────────────────────────────────

    // Disable preset options that are already in use, re-enable removed ones.
    function _syncPresetDropdown() {
        if (!_els.regionPreset) return;
        var regions = AnimRegions.getAll();
        var usedNames = {};
        for (var i = 0; i < regions.length; i++) {
            usedNames[regions[i].name] = true;
        }
        var options = _els.regionPreset.options;
        for (var o = 0; o < options.length; o++) {
            var val = options[o].value;
            if (val && val !== 'custom') {
                options[o].disabled = !!usedNames[val];
            }
        }
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
        if (_els.regionPreset) {
            _els.regionPreset.disabled = !open;
        }
    }

    // ── Preview sync ────────────────────────────────────────────────────────

    // Throttle state for push-active (max ~10 pushes/sec)
    var _lastPushTime = 0;
    var _pendingPushTimer = null;
    var _PUSH_THROTTLE_MS = 100;

    // Flag to prevent FPS sync loops (editor↔preview)
    var _syncingFps = false;

    // Full frame push — used on template apply, mode enter, frame add/remove
    function _pushToPreview() {
        if (!window.api || !window.api.pushFramesToPreview) return;
        var frames = AnimFrames.getAll();
        var serialized = [];
        for (var i = 0; i < frames.length; i++) {
            serialized.push({ pixels: Array.from(frames[i].pixels) });
        }
        window.api.pushFramesToPreview({
            frames: serialized,
            width: AnimFrames.getWidth(),
            height: AnimFrames.getHeight(),
            activeIndex: AnimFrames.getActiveIndex(),
            fps: parseInt(_els.fpsSelect.value)
        });
    }

    // Lightweight single-frame push — used on draw strokes, frame navigation
    function _pushActiveToPreview(frameIndex) {
        if (!window.api || !window.api.pushActiveFrameToPreview) return;
        var frame = AnimFrames.getAll()[frameIndex];
        if (!frame) return;

        var now = Date.now();
        var payload = {
            frameIndex: frameIndex,
            pixels: Array.from(frame.pixels),
            width: AnimFrames.getWidth(),
            height: AnimFrames.getHeight()
        };

        if (now - _lastPushTime >= _PUSH_THROTTLE_MS) {
            _lastPushTime = now;
            window.api.pushActiveFrameToPreview(payload);
        } else {
            // Schedule trailing push so final state always arrives
            if (_pendingPushTimer) clearTimeout(_pendingPushTimer);
            _pendingPushTimer = setTimeout(function() {
                _lastPushTime = Date.now();
                _pendingPushTimer = null;
                window.api.pushActiveFrameToPreview(payload);
            }, _PUSH_THROTTLE_MS - (now - _lastPushTime));
        }
    }

    // Send empty frames to preview (mode exit — shows "No animation" message)
    function _clearPreview() {
        if (!window.api || !window.api.pushFramesToPreview) return;
        window.api.pushFramesToPreview({
            frames: [],
            width: 0,
            height: 0,
            activeIndex: 0,
            fps: parseInt(_els.fpsSelect.value)
        });
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
        _pushActiveToPreview(AnimFrames.getActiveIndex());
    }

    // Lightweight region-only update — called per pixel during region-paint drag.
    // Avoids full refresh() which rebuilds the entire frame strip DOM.
    function refreshRegionOnly() {
        if (!AppState.animationMode) return;
        _renderRegionOverlay();
        _renderRegionList();
    }

    // 6.1b: Clear cached animation state. Called on explicit New/Resize — not on tab switch.
    // Guarded: no-op in animation mode to prevent wiping data while UI is live (Viktor A1).
    function clearCache() {
        if (AppState.animationMode) return;
        AnimFrames.reset();
        AnimRegions.clear();
        Timeline.pause();
        Timeline.setFrameCount(1);
        _regionColorIdx = 0;
        AppState.activeFrameIndex = 0;
        AppState.activeRegionId = null;
    }

    // 6.1b: Check if animation data is cached (for resize guard in sprite mode).
    function hasCache() {
        return !AppState.animationMode && AnimFrames.getFrameCount() > 0;
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
        refreshRegionOnly,
        clearCache,
        hasCache
    };
})();
