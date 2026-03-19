'use strict';

// tests/region-workflow.test.js
// Phase O6-3: end-to-end region workflow tests.
// Tests the full pipeline: define regions → apply pose → verify frame shifts.

// ── Extracted engine (mirrors AnimRegions + PoseTemplates logic) ──────────────

function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

function makeWorkflowEngine() {
    var _regions = {};
    var _counter = 0;

    function addRegion(name, color) {
        _counter++;
        var id = 'r' + _counter;
        _regions[id] = { id: id, name: name, color: color || '#FF0000', pixels: new Set(), zOrder: 0 };
        return _regions[id];
    }

    function paintPixel(id, x, y) {
        var key = x + ',' + y;
        Object.keys(_regions).forEach(function(rid) { _regions[rid].pixels.delete(key); });
        if (_regions[id]) _regions[id].pixels.add(key);
    }

    function getAll() { return Object.values(_regions); }

    function shiftRegion(regionId, dx, dy, pixels, w, h, bgFill) {
        var region = _regions[regionId];
        if (!region || region.pixels.size === 0 || (dx === 0 && dy === 0)) return pixels;

        var bgR = 0, bgG = 0, bgB = 0, bgA = 0;
        if (bgFill && bgFill !== 'transparent') {
            var rgb = hexToRgb(bgFill);
            bgR = rgb[0]; bgG = rgb[1]; bgB = rgb[2]; bgA = 255;
        }

        var entries = [];
        region.pixels.forEach(function(key) {
            var parts = key.split(',');
            var x = parseInt(parts[0]), y = parseInt(parts[1]);
            var i = (y * w + x) * 4;
            entries.push({ x: x, y: y, r: pixels[i], g: pixels[i+1], b: pixels[i+2], a: pixels[i+3] });
        });

        for (var c = 0; c < entries.length; c++) {
            var ci = (entries[c].y * w + entries[c].x) * 4;
            pixels[ci] = bgR; pixels[ci+1] = bgG; pixels[ci+2] = bgB; pixels[ci+3] = bgA;
        }

        for (var p = 0; p < entries.length; p++) {
            var nx = entries[p].x + dx, ny = entries[p].y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                var ni = (ny * w + nx) * 4;
                pixels[ni] = entries[p].r; pixels[ni+1] = entries[p].g;
                pixels[ni+2] = entries[p].b; pixels[ni+3] = entries[p].a;
            }
        }
        return pixels;
    }

    function findRegion(name) {
        var all = getAll();
        for (var i = 0; i < all.length; i++) {
            if (all[i].name.toLowerCase() === name.toLowerCase()) return all[i];
        }
        return null;
    }

    function applyShifts(basePixels, w, h, shifts) {
        var frame = basePixels.slice();
        for (var i = 0; i < shifts.length; i++) {
            shiftRegion(shifts[i].regionId, shifts[i].dx, shifts[i].dy, frame, w, h, 'transparent');
        }
        return frame;
    }

    // Idle with regions
    function generateIdleWithRegions(basePixels, w, h) {
        var torso = findRegion('torso');
        var lArm  = findRegion('left-arm');
        var rArm  = findRegion('right-arm');
        var shifts = [];
        if (torso) shifts.push({ regionId: torso.id, dx: 0, dy: -1 });
        if (lArm)  shifts.push({ regionId: lArm.id,  dx: 0, dy: -1 });
        if (rArm)  shifts.push({ regionId: rArm.id,  dx: 0, dy: -1 });
        return [basePixels.slice(), applyShifts(basePixels, w, h, shifts)];
    }

    return { addRegion, paintPixel, getAll, shiftRegion, findRegion, generateIdleWithRegions };
}

function makePixels(w, h) { return new Array(w * h * 4).fill(0); }

function setPixel(pixels, w, x, y, r, g, b) {
    var i = (y * w + x) * 4;
    pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = 255;
}

function getPixel(pixels, w, x, y) {
    var i = (y * w + x) * 4;
    return { r: pixels[i], g: pixels[i+1], b: pixels[i+2], a: pixels[i+3] };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Region workflow — Idle with torso region', function() {
    test('defines torso region, applies Idle, frame 1 has torso shifted -1Y', function() {
        var eng = makeWorkflowEngine();

        // 8x8 sprite with a "torso" region at rows 3-4
        var px = makePixels(8, 8);
        var torso = eng.addRegion('torso', '#FF0000');
        for (var y = 3; y <= 4; y++) {
            for (var x = 2; x <= 5; x++) {
                setPixel(px, 8, x, y, 200, 100, 50);
                eng.paintPixel(torso.id, x, y);
            }
        }

        // Generate Idle
        var frames = eng.generateIdleWithRegions(px, 8, 8);

        expect(frames.length).toBe(2);

        // Frame 0: torso at rows 3-4
        expect(getPixel(frames[0], 8, 3, 3).r).toBe(200);
        expect(getPixel(frames[0], 8, 3, 4).r).toBe(200);

        // Frame 1: torso shifted to rows 2-3
        expect(getPixel(frames[1], 8, 3, 2).r).toBe(200);
        expect(getPixel(frames[1], 8, 3, 3).r).toBe(200);

        // Row 4 should be cleared in frame 1
        expect(getPixel(frames[1], 8, 3, 4).a).toBe(0);
    });
});

describe('Region workflow — multi-region Idle', function() {
    test('torso and arms all shift together', function() {
        var eng = makeWorkflowEngine();
        var px = makePixels(8, 8);

        var torso = eng.addRegion('torso', '#FF0000');
        var lArm  = eng.addRegion('left-arm', '#00FF00');
        var rArm  = eng.addRegion('right-arm', '#0000FF');

        // Torso at (3,3)(4,3)
        setPixel(px, 8, 3, 3, 200, 0, 0);
        setPixel(px, 8, 4, 3, 200, 0, 0);
        eng.paintPixel(torso.id, 3, 3);
        eng.paintPixel(torso.id, 4, 3);

        // Left arm at (2,3)
        setPixel(px, 8, 2, 3, 0, 200, 0);
        eng.paintPixel(lArm.id, 2, 3);

        // Right arm at (5,3)
        setPixel(px, 8, 5, 3, 0, 0, 200);
        eng.paintPixel(rArm.id, 5, 3);

        var frames = eng.generateIdleWithRegions(px, 8, 8);

        // Frame 1: all three shifted up by 1
        expect(getPixel(frames[1], 8, 3, 2).r).toBe(200); // torso
        expect(getPixel(frames[1], 8, 2, 2).g).toBe(200); // left arm
        expect(getPixel(frames[1], 8, 5, 2).b).toBe(200); // right arm

        // Row 3 cleared
        expect(getPixel(frames[1], 8, 3, 3).a).toBe(0);
        expect(getPixel(frames[1], 8, 2, 3).a).toBe(0);
        expect(getPixel(frames[1], 8, 5, 3).a).toBe(0);
    });
});

describe('Region workflow — non-region pixels preserved', function() {
    test('head region not in Idle shifts stays in place', function() {
        var eng = makeWorkflowEngine();
        var px = makePixels(8, 8);

        // Head region (not used by Idle generator)
        var head = eng.addRegion('head', '#FF00FF');
        setPixel(px, 8, 4, 1, 255, 0, 255);
        eng.paintPixel(head.id, 4, 1);

        // Torso region (used by Idle)
        var torso = eng.addRegion('torso', '#FF0000');
        setPixel(px, 8, 4, 4, 200, 0, 0);
        eng.paintPixel(torso.id, 4, 4);

        var frames = eng.generateIdleWithRegions(px, 8, 8);

        // Head should stay at (4,1) in frame 1
        expect(getPixel(frames[1], 8, 4, 1).r).toBe(255);
        expect(getPixel(frames[1], 8, 4, 1).b).toBe(255);

        // Torso should be at (4,3) in frame 1
        expect(getPixel(frames[1], 8, 4, 3).r).toBe(200);
    });
});

describe('Region workflow — edge cases', function() {
    test('region at top edge clips when shifted up', function() {
        var eng = makeWorkflowEngine();
        var px = makePixels(8, 8);

        var torso = eng.addRegion('torso', '#FF0000');
        setPixel(px, 8, 3, 0, 200, 0, 0); // top row
        eng.paintPixel(torso.id, 3, 0);

        var frames = eng.generateIdleWithRegions(px, 8, 8);

        // Shifted to y=-1 → clipped (lost)
        // Original position cleared
        expect(getPixel(frames[1], 8, 3, 0).a).toBe(0);
    });

    test('empty region produces identical frames', function() {
        var eng = makeWorkflowEngine();
        var px = makePixels(8, 8);

        eng.addRegion('torso', '#FF0000'); // empty, no pixels painted
        setPixel(px, 8, 4, 4, 100, 100, 100);

        var frames = eng.generateIdleWithRegions(px, 8, 8);

        // Both frames should be identical since torso region is empty
        expect(getPixel(frames[0], 8, 4, 4).r).toBe(100);
        expect(getPixel(frames[1], 8, 4, 4).r).toBe(100);
    });

    test('overlapping regions: pixel belongs to last-assigned region only', function() {
        var eng = makeWorkflowEngine();

        var r1 = eng.addRegion('torso', '#FF0000');
        var r2 = eng.addRegion('left-arm', '#00FF00');

        eng.paintPixel(r1.id, 3, 3);
        eng.paintPixel(r2.id, 3, 3); // reassigned to left-arm

        var all = eng.getAll();
        var torsoPixels = all.filter(function(r) { return r.name === 'torso'; })[0].pixels;
        var armPixels   = all.filter(function(r) { return r.name === 'left-arm'; })[0].pixels;

        expect(torsoPixels.has('3,3')).toBe(false);
        expect(armPixels.has('3,3')).toBe(true);
    });
});
