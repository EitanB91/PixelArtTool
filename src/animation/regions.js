'use strict';

// AnimRegions — region definition, pixel assignment, and shift engine
//
// A region is a named, colored set of pixel coordinates within the sprite.
// Regions allow the pose template engine to move body parts independently.
//
// Region shape:
// {
//   id:     string  — unique identifier (e.g. 'r1')
//   name:   string  — display name (e.g. 'torso')
//   color:  string  — hex color for overlay rendering (e.g. '#FF6B6B')
//   pixels: Set     — Set of encoded pixel keys ("x,y")
//   zOrder: number  — reserved for Sprint 2 depth ordering (D12)
// }
//
// Size gate: region tools are only available when sprite is >= 24×24 (D4).

var AnimRegions = (function() {
    var _regions  = {};  // { id: region }
    var _counter  = 0;   // monotonic id counter

    // ── Region management ──────────────────────────────────────────────────────

    // Create and register a new region.
    // @param {string} name  — display name
    // @param {string} color — hex overlay color
    // @returns {Object} the new region
    function addRegion(name, color) {
        _counter++;
        var id = 'r' + _counter;
        _regions[id] = {
            id:     id,
            name:   name || ('Region ' + _counter),
            color:  color || '#FF6B6B',
            pixels: new Set(),
            zOrder: 0  // Sprint 2: depth ordering
        };
        return _regions[id];
    }

    // Remove a region by id.
    // @param {string} id
    function removeRegion(id) {
        delete _regions[id];
    }

    // Assign a pixel to a region (removes it from any other region first).
    // @param {string} id  — region id
    // @param {number} x
    // @param {number} y
    function paintPixel(id, x, y) {
        var key = x + ',' + y;
        // Remove from any existing region
        Object.keys(_regions).forEach(function(rid) {
            _regions[rid].pixels.delete(key);
        });
        if (_regions[id]) {
            _regions[id].pixels.add(key);
        }
    }

    // Remove a pixel from its region.
    // @param {number} x
    // @param {number} y
    function unpaintPixel(x, y) {
        var key = x + ',' + y;
        Object.keys(_regions).forEach(function(rid) {
            _regions[rid].pixels.delete(key);
        });
    }

    // Get all regions as an array.
    // @returns {Array}
    function getAll() {
        return Object.values(_regions);
    }

    // Get a region by id.
    // @param {string} id
    // @returns {Object|undefined}
    function getById(id) {
        return _regions[id];
    }

    // Clear all regions.
    function clear() {
        _regions = {};
        _counter = 0;
    }

    // ── Shift engine (stub — full implementation in Phase O6-3) ───────────────

    // Move all pixels in a region by (dx, dy) on the given pixel array.
    // Vacated pixels are filled per backgroundFill setting.
    // Out-of-bounds pixels are clipped (silently dropped).
    //
    // @param {string}           regionId       — region to shift
    // @param {number}           dx             — pixels to move horizontally
    // @param {number}           dy             — pixels to move vertically
    // @param {Uint8ClampedArray} pixels         — sprite pixel data (mutated in place)
    // @param {number}           w              — sprite width
    // @param {number}           h              — sprite height
    // @param {string}           backgroundFill — 'transparent' | hex color
    // @returns {Uint8ClampedArray} mutated pixels
    function shiftRegion(regionId, dx, dy, pixels, w, h, backgroundFill) {
        // TODO: Phase O6-3 — implement shift engine
        // Stub returns pixels unchanged
        return pixels;
    }

    // ── Overlay rendering (stub — full implementation in Phase O6-3) ──────────

    // Render a semi-transparent colored overlay on the given canvas context,
    // showing all region pixel assignments at the current zoom factor.
    //
    // @param {CanvasRenderingContext2D} ctx
    // @param {number}                  zoom — pixels per game pixel
    function renderOverlay(ctx, zoom) {
        // TODO: Phase O6-3 — implement region overlay rendering
    }

    // ── Size gate ──────────────────────────────────────────────────────────────

    // Returns true if region tools are available for the given sprite size (>= 24×24).
    // @param {number} w
    // @param {number} h
    // @returns {boolean}
    function isSizeGateOpen(w, h) {
        return w >= 24 && h >= 24;
    }

    return {
        addRegion,
        removeRegion,
        paintPixel,
        unpaintPixel,
        getAll,
        getById,
        clear,
        shiftRegion,
        renderOverlay,
        isSizeGateOpen
    };
})();
