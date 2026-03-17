'use strict';

// AnimationPanel — animation mode UI controller
//
// Owns all animation-specific DOM: tab switching, frame strip, playback controls,
// pose template picker, onion skin toggle, region panel, background fill control.
//
// Wired to: AnimFrames, Timeline, AnimRegions, PoseTemplates, PixelCanvas, AppState
// Full implementation: Phase O6-2 (UI shell) and Phase O6-3/4 (logic wiring).

var AnimationPanel = (function() {

    // ── Init (stub) ────────────────────────────────────────────────────────────

    // Initialise DOM references and attach event listeners.
    // Called once from app.js DOMContentLoaded after all modules are loaded.
    function init() {
        // TODO: Phase O6-2 — wire tab buttons, playback controls, template picker,
        //   onion skin toggle, region panel, background fill control
    }

    // ── Tab visibility (stub) ──────────────────────────────────────────────────

    // Show the animation panel and enter animation mode.
    // Seeds AnimFrames from current canvas, wires Timeline callback.
    function show() {
        // TODO: Phase O6-2 — show animation DOM, seed AnimFrames, set AppState.animationMode
    }

    // Hide the animation panel and exit animation mode.
    // Pauses playback, restores current frame pixels to canvas.
    function hide() {
        // TODO: Phase O6-2 — Timeline.pause(), restore pixels, set AppState.animationMode = false
    }

    // ── Frame strip (stub) ────────────────────────────────────────────────────

    // Re-render all frame strip thumbnails.
    // Called after template apply, frame add/remove, or pixel edits.
    function renderFrameStrip() {
        // TODO: Phase O6-4 — draw thumbnails, highlight active frame, wire click navigation
    }

    // ── Onion skin (stub) ─────────────────────────────────────────────────────

    // Render the onion skin overlay on the onion canvas.
    // prev frame: blue-tinted ghost (~25% opacity)
    // next frame: orange-tinted ghost (~25% opacity)
    function renderOnionSkin() {
        // TODO: Phase O6-4 — composite prev/next frame pixels onto onion canvas
    }

    // ── Size gate (stub) ──────────────────────────────────────────────────────

    // Enable or disable region tools based on sprite dimensions.
    // @param {number} w
    // @param {number} h
    function updateSizeGate(w, h) {
        // TODO: Phase O6-3 — call AnimRegions.isSizeGateOpen(w, h),
        //   toggle region paint tool button + tooltip
    }

    // ── Refresh (stub) ────────────────────────────────────────────────────────

    // Full UI refresh — called after any state change that affects the panel.
    function refresh() {
        renderFrameStrip();
        renderOnionSkin();
    }

    return {
        init,
        show,
        hide,
        renderFrameStrip,
        renderOnionSkin,
        updateSizeGate,
        refresh
    };
})();
