'use strict';

// tests/shift-engine.test.js
// Phase O6-3: shift engine tests — pure logic extracted from AnimRegions.shiftRegion.

// ── Extracted pure logic ───────────────────────────────────────────────────────

function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

function makeRegionEngine() {
    var _regions = {};
    var _counter = 0;

    function addRegion(name, color) {
        _counter++;
        var id = 'r' + _counter;
        _regions[id] = { id: id, name: name || '', color: color || '#FF0000', pixels: new Set(), zOrder: 0 };
        return _regions[id];
    }

    function paintPixel(id, x, y) {
        var key = x + ',' + y;
        Object.keys(_regions).forEach(function(rid) { _regions[rid].pixels.delete(key); });
        if (_regions[id]) _regions[id].pixels.add(key);
    }

    function shiftRegion(regionId, dx, dy, pixels, w, h, backgroundFill) {
        var region = _regions[regionId];
        if (!region || region.pixels.size === 0 || (dx === 0 && dy === 0)) return pixels;

        var bgR = 0, bgG = 0, bgB = 0, bgA = 0;
        if (backgroundFill && backgroundFill !== 'transparent') {
            var rgb = hexToRgb(backgroundFill);
            bgR = rgb[0]; bgG = rgb[1]; bgB = rgb[2]; bgA = 255;
        }

        var entries = [];
        region.pixels.forEach(function(key) {
            var parts = key.split(',');
            var x = parseInt(parts[0]);
            var y = parseInt(parts[1]);
            var i = (y * w + x) * 4;
            entries.push({ x: x, y: y, r: pixels[i], g: pixels[i+1], b: pixels[i+2], a: pixels[i+3] });
        });

        for (var c = 0; c < entries.length; c++) {
            var ci = (entries[c].y * w + entries[c].x) * 4;
            pixels[ci] = bgR; pixels[ci+1] = bgG; pixels[ci+2] = bgB; pixels[ci+3] = bgA;
        }

        for (var p = 0; p < entries.length; p++) {
            var nx = entries[p].x + dx;
            var ny = entries[p].y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                var ni = (ny * w + nx) * 4;
                pixels[ni] = entries[p].r; pixels[ni+1] = entries[p].g;
                pixels[ni+2] = entries[p].b; pixels[ni+3] = entries[p].a;
            }
        }
        return pixels;
    }

    return { addRegion, paintPixel, shiftRegion };
}

// Helper: create a 4x4 pixel array with a single red pixel at (x,y)
function makePixels(w, h) {
    return new Array(w * h * 4).fill(0);
}

function setPixel(pixels, w, x, y, r, g, b) {
    var i = (y * w + x) * 4;
    pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = 255;
}

function getPixel(pixels, w, x, y) {
    var i = (y * w + x) * 4;
    return { r: pixels[i], g: pixels[i+1], b: pixels[i+2], a: pixels[i+3] };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('shiftRegion — basic movement', function() {
    test('shifts a single pixel right by 1', function() {
        var eng = makeRegionEngine();
        var r = eng.addRegion('test');
        eng.paintPixel(r.id, 1, 1);

        var px = makePixels(4, 4);
        setPixel(px, 4, 1, 1, 255, 0, 0);

        eng.shiftRegion(r.id, 1, 0, px, 4, 4, 'transparent');

        // Original position should be cleared
        var orig = getPixel(px, 4, 1, 1);
        expect(orig.a).toBe(0);

        // New position should have the color
        var moved = getPixel(px, 4, 2, 1);
        expect(moved.r).toBe(255);
        expect(moved.g).toBe(0);
        expect(moved.a).toBe(255);
    });

    test('shifts a pixel down by 2', function() {
        var eng = makeRegionEngine();
        var r = eng.addRegion('test');
        eng.paintPixel(r.id, 2, 0);

        var px = makePixels(4, 4);
        setPixel(px, 4, 2, 0, 0, 255, 0);

        eng.shiftRegion(r.id, 0, 2, px, 4, 4, 'transparent');

        expect(getPixel(px, 4, 2, 0).a).toBe(0);
        expect(getPixel(px, 4, 2, 2).g).toBe(255);
    });

    test('shifts multiple pixels as a group', function() {
        var eng = makeRegionEngine();
        var r = eng.addRegion('block');
        eng.paintPixel(r.id, 0, 0);
        eng.paintPixel(r.id, 1, 0);
        eng.paintPixel(r.id, 0, 1);
        eng.paintPixel(r.id, 1, 1);

        var px = makePixels(4, 4);
        setPixel(px, 4, 0, 0, 100, 100, 100);
        setPixel(px, 4, 1, 0, 100, 100, 100);
        setPixel(px, 4, 0, 1, 100, 100, 100);
        setPixel(px, 4, 1, 1, 100, 100, 100);

        eng.shiftRegion(r.id, 2, 2, px, 4, 4, 'transparent');

        // Old positions cleared
        expect(getPixel(px, 4, 0, 0).a).toBe(0);
        expect(getPixel(px, 4, 1, 0).a).toBe(0);

        // New positions filled
        expect(getPixel(px, 4, 2, 2).r).toBe(100);
        expect(getPixel(px, 4, 3, 3).r).toBe(100);
    });
});

describe('shiftRegion — clipping', function() {
    test('clips pixels that move out of bounds (right)', function() {
        var eng = makeRegionEngine();
        var r = eng.addRegion('test');
        eng.paintPixel(r.id, 3, 1);

        var px = makePixels(4, 4);
        setPixel(px, 4, 3, 1, 255, 0, 0);

        eng.shiftRegion(r.id, 1, 0, px, 4, 4, 'transparent');

        // Original cleared
        expect(getPixel(px, 4, 3, 1).a).toBe(0);
        // Out of bounds — should not crash and pixel is simply lost
    });

    test('clips pixels that move out of bounds (top)', function() {
        var eng = makeRegionEngine();
        var r = eng.addRegion('test');
        eng.paintPixel(r.id, 1, 0);

        var px = makePixels(4, 4);
        setPixel(px, 4, 1, 0, 0, 0, 255);

        eng.shiftRegion(r.id, 0, -1, px, 4, 4, 'transparent');

        expect(getPixel(px, 4, 1, 0).a).toBe(0);
    });
});

describe('shiftRegion — background fill', function() {
    test('fills vacated positions with transparent by default', function() {
        var eng = makeRegionEngine();
        var r = eng.addRegion('test');
        eng.paintPixel(r.id, 1, 1);

        var px = makePixels(4, 4);
        setPixel(px, 4, 1, 1, 200, 100, 50);

        eng.shiftRegion(r.id, 1, 0, px, 4, 4, 'transparent');

        var vacated = getPixel(px, 4, 1, 1);
        expect(vacated.r).toBe(0);
        expect(vacated.g).toBe(0);
        expect(vacated.b).toBe(0);
        expect(vacated.a).toBe(0);
    });

    test('fills vacated positions with hex color when specified', function() {
        var eng = makeRegionEngine();
        var r = eng.addRegion('test');
        eng.paintPixel(r.id, 1, 1);

        var px = makePixels(4, 4);
        setPixel(px, 4, 1, 1, 200, 100, 50);

        eng.shiftRegion(r.id, 1, 0, px, 4, 4, '#FF0000');

        var vacated = getPixel(px, 4, 1, 1);
        expect(vacated.r).toBe(255);
        expect(vacated.g).toBe(0);
        expect(vacated.b).toBe(0);
        expect(vacated.a).toBe(255);
    });
});

describe('shiftRegion — edge cases', function() {
    test('returns unchanged pixels when dx=0 and dy=0', function() {
        var eng = makeRegionEngine();
        var r = eng.addRegion('test');
        eng.paintPixel(r.id, 1, 1);

        var px = makePixels(4, 4);
        setPixel(px, 4, 1, 1, 255, 0, 0);

        eng.shiftRegion(r.id, 0, 0, px, 4, 4, 'transparent');

        expect(getPixel(px, 4, 1, 1).r).toBe(255);
        expect(getPixel(px, 4, 1, 1).a).toBe(255);
    });

    test('handles empty region gracefully', function() {
        var eng = makeRegionEngine();
        var r = eng.addRegion('empty');

        var px = makePixels(4, 4);
        setPixel(px, 4, 2, 2, 100, 100, 100);

        eng.shiftRegion(r.id, 1, 1, px, 4, 4, 'transparent');

        // Nothing should change
        expect(getPixel(px, 4, 2, 2).r).toBe(100);
    });

    test('handles unknown region id gracefully', function() {
        var eng = makeRegionEngine();
        var px = makePixels(4, 4);
        setPixel(px, 4, 0, 0, 50, 50, 50);

        eng.shiftRegion('nonexistent', 1, 0, px, 4, 4, 'transparent');

        expect(getPixel(px, 4, 0, 0).r).toBe(50);
    });

    test('preserves non-region pixels during shift', function() {
        var eng = makeRegionEngine();
        var r = eng.addRegion('test');
        eng.paintPixel(r.id, 0, 0);

        var px = makePixels(4, 4);
        setPixel(px, 4, 0, 0, 255, 0, 0);  // in region
        setPixel(px, 4, 3, 3, 0, 255, 0);  // not in region

        eng.shiftRegion(r.id, 1, 0, px, 4, 4, 'transparent');

        // Non-region pixel unchanged
        expect(getPixel(px, 4, 3, 3).g).toBe(255);
    });
});
