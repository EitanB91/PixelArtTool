'use strict';

// Timeline — playback controller
//
// Manages play/pause state, FPS, and frame advancement.
// Calls onFrameChange(nextIndex) at each tick — the consumer
// (AnimationPanel in Phase O6-4) swaps the canvas to that frame.
//
// Interval lifecycle rules:
// - Only one setInterval active at a time (enforced by _intervalId guard)
// - pause() must be called before any navigation that changes frame count
// - Tab switch and animation mode exit both call pause() as a defensive guard

var Timeline = (function() {
    var _intervalId    = null;
    var _fps           = 4;           // default frames per second
    var _frameCount    = 1;           // total frames — updated by AnimationPanel
    var _activeIndex   = 0;           // current frame index
    var _onFrameChange = null;        // callback(nextIndex)

    // ── Initialisation ─────────────────────────────────────────────────────────

    // Set the frame-change callback and optional initial FPS.
    // @param {function} onFrameChange — called with next frame index at each tick
    // @param {number}   [fps=4]
    function init(onFrameChange, fps) {
        _onFrameChange = onFrameChange;
        if (fps) _fps = fps;
    }

    // ── Playback ───────────────────────────────────────────────────────────────

    // Start playback. No-op if already playing.
    function play() {
        if (_intervalId !== null) return;
        if (_frameCount <= 1) return;  // nothing to animate
        _intervalId = setInterval(function() {
            _activeIndex = (_activeIndex + 1) % _frameCount;
            if (_onFrameChange) _onFrameChange(_activeIndex);
        }, 1000 / _fps);
    }

    // Stop playback. No-op if not playing.
    function pause() {
        if (_intervalId === null) return;
        clearInterval(_intervalId);
        _intervalId = null;
    }

    // @returns {boolean}
    function isPlaying() {
        return _intervalId !== null;
    }

    // ── Frame navigation ───────────────────────────────────────────────────────

    // Jump to a specific frame (pauses playback).
    // @param {number} idx
    function goToFrame(idx) {
        pause();
        _activeIndex = Math.max(0, Math.min(_frameCount - 1, idx));
        if (_onFrameChange) _onFrameChange(_activeIndex);
    }

    // @returns {number} current frame index
    function getActiveIndex() {
        return _activeIndex;
    }

    // ── Configuration ──────────────────────────────────────────────────────────

    // Update playback speed. Restarts the interval if currently playing.
    // @param {number} fps — frames per second (1 | 2 | 4 | 8 | 12)
    function setFps(fps) {
        var wasPlaying = isPlaying();
        pause();
        _fps = fps;
        if (wasPlaying) play();
    }

    // @returns {number} current fps
    function getFps() {
        return _fps;
    }

    // Inform the timeline how many frames exist.
    // Call this after AnimFrames changes (add/remove/template apply).
    // @param {number} count
    function setFrameCount(count) {
        _frameCount = Math.max(1, count);
        // Clamp active index if frame was removed
        if (_activeIndex >= _frameCount) {
            _activeIndex = _frameCount - 1;
        }
    }

    // @returns {number}
    function getFrameCount() {
        return _frameCount;
    }

    // Reset to initial state (call on animation mode exit).
    function reset() {
        pause();
        _fps         = 4;
        _frameCount  = 1;
        _activeIndex = 0;
        _onFrameChange = null;
    }

    return {
        init,
        play,
        pause,
        isPlaying,
        goToFrame,
        getActiveIndex,
        setFps,
        getFps,
        setFrameCount,
        getFrameCount,
        reset
    };
})();
