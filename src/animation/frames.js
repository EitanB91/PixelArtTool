'use strict';

// AnimFrames — per-frame pixel data and history management
//
// Each frame owns an independent undo/redo stack (Option A — per-frame history).
// When the user switches frames, the canvas's history instance is swapped to that
// frame's stack, so Ctrl+Z only affects the current frame.
//
// Frame shape: { pixels: Uint8ClampedArray, history: makeHistory() instance }

var AnimFrames = (function() {
    var _frames    = [];  // Array of frame objects
    var _activeIdx = 0;   // Index of the currently displayed frame
    var _w         = 0;   // Sprite width (game pixels) — set on seed()
    var _h         = 0;   // Sprite height (game pixels) — set on seed()

    // ── Private helpers ────────────────────────────────────────────────────────

    function _makeFrame(pixelData) {
        var h = makeHistory();
        h.push(pixelData);
        return {
            pixels:  new Uint8ClampedArray(pixelData),
            history: h
        };
    }

    function _blankPixels() {
        return new Uint8ClampedArray(_w * _h * 4);
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    // Seed frame 0 from the current canvas pixel data.
    // Call this when entering animation mode. Resets all existing frames.
    // @param {Uint8ClampedArray} pixelData — canvas pixels at mode entry
    // @param {number} w — sprite width in game pixels
    // @param {number} h — sprite height in game pixels
    function seed(pixelData, w, h) {
        _w = w;
        _h = h;
        _frames    = [_makeFrame(pixelData)];
        _activeIdx = 0;
    }

    // Add a new frame at the end.
    // @param {boolean} [duplicateCurrent=false] — copy current frame pixels; false = blank
    // @returns {number} index of the new frame
    function addFrame(duplicateCurrent) {
        var src = duplicateCurrent
            ? new Uint8ClampedArray(_frames[_activeIdx].pixels)
            : _blankPixels();
        _frames.push(_makeFrame(src));
        return _frames.length - 1;
    }

    // Remove frame at idx. Cannot remove the last remaining frame.
    // Adjusts _activeIdx so it stays valid.
    // @param {number} idx
    // @returns {boolean} true if removed, false if refused (only one frame)
    function removeFrame(idx) {
        if (_frames.length <= 1) return false;
        _frames.splice(idx, 1);
        if (_activeIdx >= _frames.length) {
            _activeIdx = _frames.length - 1;
        }
        return true;
    }

    // Navigate to frame at idx.
    // @param {number} idx — clamped to valid range
    // @returns {Object} { pixels, history } of the newly active frame
    function goToFrame(idx) {
        _activeIdx = Math.max(0, Math.min(_frames.length - 1, idx));
        return _frames[_activeIdx];
    }

    // Replace the active frame's pixels with new data (e.g. after a canvas draw).
    // Does NOT push to history — caller is responsible for history management.
    // @param {Uint8ClampedArray} pixelData
    function setCurrentPixels(pixelData) {
        _frames[_activeIdx].pixels = new Uint8ClampedArray(pixelData);
    }

    // Get pixel data of the active frame.
    // @returns {Uint8ClampedArray}
    function getCurrentPixels() {
        return _frames[_activeIdx].pixels;
    }

    // Get the history instance of the active frame.
    // Pass this to PixelCanvas.setHistory() after navigating to a frame.
    // @returns {Object} makeHistory() instance
    function getCurrentHistory() {
        return _frames[_activeIdx].history;
    }

    // Get all frames (read-only snapshot for export and thumbnail rendering).
    // @returns {Array} shallow copy of the frame array
    function getAll() {
        return _frames.slice();
    }

    // @returns {number} total number of frames
    function getFrameCount() {
        return _frames.length;
    }

    // @returns {number} index of the active frame
    function getActiveIndex() {
        return _activeIdx;
    }

    // @returns {number} sprite width set at seed time
    function getWidth() { return _w; }

    // @returns {number} sprite height set at seed time
    function getHeight() { return _h; }

    // Reset to empty state. Call on animation mode exit.
    function reset() {
        _frames    = [];
        _activeIdx = 0;
        _w         = 0;
        _h         = 0;
    }

    return {
        seed,
        addFrame,
        removeFrame,
        goToFrame,
        setCurrentPixels,
        getCurrentPixels,
        getCurrentHistory,
        getAll,
        getFrameCount,
        getActiveIndex,
        getWidth,
        getHeight,
        reset
    };
})();
