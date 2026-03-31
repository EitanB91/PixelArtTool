'use strict';

// PoseTemplates — template registry and frame generators
//
// Templates generate multi-frame animations from a base sprite.
// Each generator receives the base pixel data + optional region map and
// returns an array of Uint8ClampedArray objects (one per output frame).
//
// Template registry (D3):
//   Character Poses: idle, walk, jump
//   Object/Effect:   rotation, pulse, flicker
//
// No-region fallback (D7): all character templates produce usable (crude)
// output even when no regions are defined. Regions improve quality.
//
// Priority order (D6): Idle → Jump → Walk. Fighting deferred to Sprint 2.

var PoseTemplates = (function() {

    // ── Registry ───────────────────────────────────────────────────────────────

    var _templates = {
        idle:     { label: 'Idle',     category: 'character', frameCount: 2  },
        walk:     { label: 'Walk',     category: 'character', frameCount: 4  },
        jump:     { label: 'Jump',     category: 'character', frameCount: 3  },
        rotation: { label: 'Rotation', category: 'object',    frameCount: 4  },
        pulse:    { label: 'Pulse',    category: 'object',    frameCount: 2  },
        flicker:  { label: 'Flicker',  category: 'object',    frameCount: 3  }
    };

    // Get a list of all registered templates (for UI rendering).
    // @returns {Array} [{ id, label, category, frameCount }, ...]
    function getAll() {
        return Object.keys(_templates).map(function(id) {
            return Object.assign({ id: id }, _templates[id]);
        });
    }

    // Get template metadata by id.
    // @param {string} id
    // @returns {Object|undefined}
    function getById(id) {
        return _templates[id] ? Object.assign({ id: id }, _templates[id]) : undefined;
    }

    // ── Generator entry point ──────────────────────────────────────────────────

    // Generate animation frames for the given template.
    // @param {string}           templateId — one of the registered template ids
    // @param {Uint8ClampedArray} basePixels — pixel data of the base (frame 0) sprite
    // @param {number}           w          — sprite width in game pixels
    // @param {number}           h          — sprite height in game pixels
    // @param {Array}            regions    — AnimRegions.getAll() output (may be empty)
    // @returns {Array<Uint8ClampedArray>} array of pixel data, one per output frame
    function generate(templateId, basePixels, w, h, regions) {
        switch (templateId) {
            case 'idle':     return _generateIdle(basePixels, w, h, regions);
            case 'walk':     return _generateWalk(basePixels, w, h, regions);
            case 'jump':     return _generateJump(basePixels, w, h, regions);
            case 'rotation': return _generateRotation(basePixels, w, h, regions);
            case 'pulse':    return _generatePulse(basePixels, w, h, regions);
            case 'flicker':  return _generateFlicker(basePixels, w, h, regions);
            default:
                console.warn('PoseTemplates.generate: unknown template', templateId);
                return [new Uint8ClampedArray(basePixels)];
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    // Find a region by name (case-insensitive).
    function _findRegion(regions, name) {
        for (var i = 0; i < regions.length; i++) {
            if (regions[i].name.toLowerCase() === name.toLowerCase()) return regions[i];
        }
        return null;
    }

    // Apply region shifts to a copy of basePixels via AnimRegions.shiftRegion.
    // shifts: [{regionId, dx, dy}]
    function _applyShifts(basePixels, w, h, shifts, bgFill) {
        var frame = new Uint8ClampedArray(basePixels);
        for (var i = 0; i < shifts.length; i++) {
            AnimRegions.shiftRegion(shifts[i].regionId, shifts[i].dx, shifts[i].dy, frame, w, h, bgFill);
        }
        return frame;
    }

    // No-region fallback: shift top portion of sprite by dy.
    // Splits at vertical midpoint.
    function _shiftTopHalf(basePixels, w, h, dy) {
        var frame = new Uint8ClampedArray(basePixels);
        var midY = Math.floor(h / 2);
        // Read top-half pixels
        var topPixels = [];
        for (var y = 0; y < midY; y++) {
            for (var x = 0; x < w; x++) {
                var i = (y * w + x) * 4;
                topPixels.push({ x: x, y: y, r: frame[i], g: frame[i+1], b: frame[i+2], a: frame[i+3] });
            }
        }
        // Clear top half
        for (var c = 0; c < topPixels.length; c++) {
            var ci = (topPixels[c].y * w + topPixels[c].x) * 4;
            frame[ci] = 0; frame[ci+1] = 0; frame[ci+2] = 0; frame[ci+3] = 0;
        }
        // Write at shifted positions
        for (var p = 0; p < topPixels.length; p++) {
            var ny = topPixels[p].y + dy;
            if (ny >= 0 && ny < h) {
                var ni = (ny * w + topPixels[p].x) * 4;
                frame[ni] = topPixels[p].r; frame[ni+1] = topPixels[p].g;
                frame[ni+2] = topPixels[p].b; frame[ni+3] = topPixels[p].a;
            }
        }
        return frame;
    }

    // No-region fallback: shift entire sprite by (dx, dy).
    function _shiftAll(basePixels, w, h, dx, dy) {
        var frame = new Uint8ClampedArray(w * h * 4);
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var si = (y * w + x) * 4;
                var nx = x + dx;
                var ny = y + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    var di = (ny * w + nx) * 4;
                    frame[di] = basePixels[si]; frame[di+1] = basePixels[si+1];
                    frame[di+2] = basePixels[si+2]; frame[di+3] = basePixels[si+3];
                }
            }
        }
        return frame;
    }

    // ── Character pose generators ────────────────────────────────────────────

    // Idle: 2 frames — frame 0: base, frame 1: torso/arms shift -1Y (breathing)
    // With regions: shifts 'torso', 'left-arm', 'right-arm' by (0, -1)
    // Without regions: shifts top half by -1Y
    function _generateIdle(basePixels, w, h, regions) {
        var frame0 = new Uint8ClampedArray(basePixels);
        var frame1;

        var torso = _findRegion(regions, 'torso');
        var lArm  = _findRegion(regions, 'left-arm');
        var rArm  = _findRegion(regions, 'right-arm');

        if (torso || lArm || rArm) {
            var shifts = [];
            if (torso) shifts.push({ regionId: torso.id, dx: 0, dy: -1 });
            if (lArm)  shifts.push({ regionId: lArm.id,  dx: 0, dy: -1 });
            if (rArm)  shifts.push({ regionId: rArm.id,  dx: 0, dy: -1 });
            frame1 = _applyShifts(basePixels, w, h, shifts, 'transparent');
        } else {
            frame1 = _shiftTopHalf(basePixels, w, h, -1);
        }

        return [frame0, frame1];
    }

    // Walk: 4 frames — base → L-forward → passing → R-forward
    // With regions: alternating leg/arm shifts
    // Without regions: returns 4 copies (crude — regions needed for quality)
    function _generateWalk(basePixels, w, h, regions) {
        var frame0 = new Uint8ClampedArray(basePixels);

        var lLeg = _findRegion(regions, 'left-leg');
        var rLeg = _findRegion(regions, 'right-leg');
        var lArm = _findRegion(regions, 'left-arm');
        var rArm = _findRegion(regions, 'right-arm');

        if (lLeg || rLeg) {
            // Frame 1: L-leg forward, R-leg back, arms counter-swing
            var shifts1 = [];
            if (lLeg) shifts1.push({ regionId: lLeg.id, dx: 1, dy: 0 });
            if (rLeg) shifts1.push({ regionId: rLeg.id, dx: -1, dy: 0 });
            if (lArm) shifts1.push({ regionId: lArm.id, dx: -1, dy: 0 });
            if (rArm) shifts1.push({ regionId: rArm.id, dx: 1, dy: 0 });
            var frame1 = _applyShifts(basePixels, w, h, shifts1, 'transparent');

            // Frame 2: passing (same as base)
            var frame2 = new Uint8ClampedArray(basePixels);

            // Frame 3: R-leg forward, L-leg back (mirror of frame 1)
            var shifts3 = [];
            if (lLeg) shifts3.push({ regionId: lLeg.id, dx: -1, dy: 0 });
            if (rLeg) shifts3.push({ regionId: rLeg.id, dx: 1, dy: 0 });
            if (lArm) shifts3.push({ regionId: lArm.id, dx: 1, dy: 0 });
            if (rArm) shifts3.push({ regionId: rArm.id, dx: -1, dy: 0 });
            var frame3 = _applyShifts(basePixels, w, h, shifts3, 'transparent');

            return [frame0, frame1, frame2, frame3];
        }

        // No-region fallback: 4 identical frames
        return [
            frame0,
            new Uint8ClampedArray(basePixels),
            new Uint8ClampedArray(basePixels),
            new Uint8ClampedArray(basePixels)
        ];
    }

    // Jump: 3 frames — standing → crouch → airborne
    // With regions: frame 1 shifts head/torso down, frame 2 shifts all up
    // Without regions: frame 1 top-half down, frame 2 entire sprite up
    function _generateJump(basePixels, w, h, regions) {
        var frame0 = new Uint8ClampedArray(basePixels);
        var frame1, frame2;

        var head  = _findRegion(regions, 'head');
        var torso = _findRegion(regions, 'torso');
        var lArm  = _findRegion(regions, 'left-arm');
        var rArm  = _findRegion(regions, 'right-arm');

        if (head || torso) {
            // Frame 1: crouch — upper body shifts down
            var crouchShifts = [];
            if (head)  crouchShifts.push({ regionId: head.id,  dx: 0, dy: 1 });
            if (torso) crouchShifts.push({ regionId: torso.id, dx: 0, dy: 1 });
            if (lArm)  crouchShifts.push({ regionId: lArm.id,  dx: 0, dy: 1 });
            if (rArm)  crouchShifts.push({ regionId: rArm.id,  dx: 0, dy: 1 });
            frame1 = _applyShifts(basePixels, w, h, crouchShifts, 'transparent');

            // Frame 2: airborne — entire sprite shifts up
            frame2 = _shiftAll(basePixels, w, h, 0, -2);
        } else {
            frame1 = _shiftTopHalf(basePixels, w, h, 1);
            frame2 = _shiftAll(basePixels, w, h, 0, -2);
        }

        return [frame0, frame1, frame2];
    }

    // ── Object/Effect pose generators ────────────────────────────────────────

    // Rotation: 4 frames — 0°, 90°, 180°, 270° nearest-neighbor rotation
    function _generateRotation(basePixels, w, h, regions) {
        var frames = [new Uint8ClampedArray(basePixels)];

        // For non-square sprites, rotation works on the bounding square
        // and clips to the original dimensions
        for (var rot = 1; rot <= 3; rot++) {
            var frame = new Uint8ClampedArray(w * h * 4);
            for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                    var si = (y * w + x) * 4;
                    if (basePixels[si + 3] === 0) continue; // skip transparent

                    var nx, ny;
                    if (rot === 1) {        // 90° CW
                        nx = (h - 1) - y;
                        ny = x;
                    } else if (rot === 2) { // 180°
                        nx = (w - 1) - x;
                        ny = (h - 1) - y;
                    } else {                // 270° CW
                        nx = y;
                        ny = (w - 1) - x;
                    }

                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        var di = (ny * w + nx) * 4;
                        frame[di]     = basePixels[si];
                        frame[di + 1] = basePixels[si + 1];
                        frame[di + 2] = basePixels[si + 2];
                        frame[di + 3] = basePixels[si + 3];
                    }
                }
            }
            frames.push(frame);
        }
        return frames;
    }

    // Pulse: 2 frames — base → inward 1px shrink (border pixels removed)
    function _generatePulse(basePixels, w, h, regions) {
        var frame0 = new Uint8ClampedArray(basePixels);
        var frame1 = new Uint8ClampedArray(w * h * 4);

        // A pixel survives the shrink only if all 4 neighbors are also non-transparent
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var i = (y * w + x) * 4;
                if (basePixels[i + 3] === 0) continue;

                // Check all 4 cardinal neighbors
                var hasAllNeighbors = true;
                var neighbors = [[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
                for (var n = 0; n < 4; n++) {
                    var nxi = neighbors[n][0], nyi = neighbors[n][1];
                    if (nxi < 0 || nxi >= w || nyi < 0 || nyi >= h) {
                        hasAllNeighbors = false; break;
                    }
                    var ni = (nyi * w + nxi) * 4;
                    if (basePixels[ni + 3] === 0) {
                        hasAllNeighbors = false; break;
                    }
                }

                if (hasAllNeighbors) {
                    frame1[i]     = basePixels[i];
                    frame1[i + 1] = basePixels[i + 1];
                    frame1[i + 2] = basePixels[i + 2];
                    frame1[i + 3] = basePixels[i + 3];
                }
            }
        }
        return [frame0, frame1];
    }

    // Flicker: 3 frames — base → checkerboard transparent → base
    function _generateFlicker(basePixels, w, h, regions) {
        var frame0 = new Uint8ClampedArray(basePixels);
        var frame1 = new Uint8ClampedArray(basePixels);

        // Checkerboard: clear every other pixel
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                if ((x + y) % 2 === 0) {
                    var i = (y * w + x) * 4;
                    frame1[i] = 0; frame1[i + 1] = 0; frame1[i + 2] = 0; frame1[i + 3] = 0;
                }
            }
        }

        var frame2 = new Uint8ClampedArray(basePixels);
        return [frame0, frame1, frame2];
    }

    return {
        getAll,
        getById,
        generate
    };
})();
