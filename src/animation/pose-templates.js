'use strict';

// PoseTemplates — template registry and frame generator stubs
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

    // ── Character template stubs ───────────────────────────────────────────────
    // Full implementation in Phase O6-4.
    // Stubs return N copies of basePixels (correct frame count, no motion).

    // Idle: 2 frames — torso/arms shift -1Y on frame 2 (breathing motion, S3-validated)
    function _generateIdle(basePixels, w, h, regions) {
        // TODO: Phase O6-4 — implement breathing shift via regions.shiftRegion
        return [
            new Uint8ClampedArray(basePixels),
            new Uint8ClampedArray(basePixels)
        ];
    }

    // Walk: 4 frames — leg split + arm swap (S4-validated walk cycle)
    function _generateWalk(basePixels, w, h, regions) {
        // TODO: Phase O6-4 — implement leg/arm region shifts per frame
        return [
            new Uint8ClampedArray(basePixels),
            new Uint8ClampedArray(basePixels),
            new Uint8ClampedArray(basePixels),
            new Uint8ClampedArray(basePixels)
        ];
    }

    // Jump: 3 frames — crouch → extend → tuck
    function _generateJump(basePixels, w, h, regions) {
        // TODO: Phase O6-4 — implement crouch/extend/tuck region shifts
        return [
            new Uint8ClampedArray(basePixels),
            new Uint8ClampedArray(basePixels),
            new Uint8ClampedArray(basePixels)
        ];
    }

    // ── Object/Effect template stubs ───────────────────────────────────────────

    // Rotation: 4–8 frames — nearest-neighbor pixel rotation
    function _generateRotation(basePixels, w, h, regions) {
        // TODO: Phase O6-4 — implement nearest-neighbor rotation
        return [
            new Uint8ClampedArray(basePixels),
            new Uint8ClampedArray(basePixels),
            new Uint8ClampedArray(basePixels),
            new Uint8ClampedArray(basePixels)
        ];
    }

    // Pulse: 2 frames — inward 1px shrink / expand
    function _generatePulse(basePixels, w, h, regions) {
        // TODO: Phase O6-4 — implement inward shrink
        return [
            new Uint8ClampedArray(basePixels),
            new Uint8ClampedArray(basePixels)
        ];
    }

    // Flicker: 3 frames — base → checkerboard transparent → base
    function _generateFlicker(basePixels, w, h, regions) {
        // TODO: Phase O6-4 — implement checkerboard transparency pass
        return [
            new Uint8ClampedArray(basePixels),
            new Uint8ClampedArray(basePixels),
            new Uint8ClampedArray(basePixels)
        ];
    }

    return {
        getAll,
        getById,
        generate
    };
})();
