'use strict';

// tests/enforce.test.js
// Algorithm-extraction pattern — does NOT import the IIFE module.
// Reimplements the pure reduce() logic as a standalone function and tests it directly.

// ── Extracted pure logic ──────────────────────────────────────────────────────

function rgbToHex(r, g, b) {
    return '#' +
        ('0' + r.toString(16)).slice(-2).toUpperCase() +
        ('0' + g.toString(16)).slice(-2).toUpperCase() +
        ('0' + b.toString(16)).slice(-2).toUpperCase();
}

function hexToRgb(hex) {
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
    ];
}

function nearestColor(r, g, b, keptRgb) {
    var best = null;
    var bestDist = Infinity;
    for (var j = 0; j < keptRgb.length; j++) {
        var dr = r - keptRgb[j][0];
        var dg = g - keptRgb[j][1];
        var db = b - keptRgb[j][2];
        var dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) { bestDist = dist; best = keptRgb[j]; }
    }
    return best;
}

function reduce(pixels, maxColors) {
    maxColors = maxColors || 6;

    var colorMap = {};
    for (var i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 128) continue;
        var hex = rgbToHex(pixels[i], pixels[i + 1], pixels[i + 2]);
        colorMap[hex] = (colorMap[hex] || 0) + 1;
    }

    var colors = Object.keys(colorMap);
    if (colors.length <= maxColors) return false;

    colors.sort(function(a, b) { return colorMap[b] - colorMap[a]; });
    var kept    = colors.slice(0, maxColors);
    var keptSet = {};
    kept.forEach(function(h) { keptSet[h] = true; });
    var keptRgb = kept.map(hexToRgb);

    var changed = false;
    for (var j = 0; j < pixels.length; j += 4) {
        if (pixels[j + 3] < 128) continue;
        var hex = rgbToHex(pixels[j], pixels[j + 1], pixels[j + 2]);
        if (keptSet[hex]) continue;

        var nearest = nearestColor(pixels[j], pixels[j + 1], pixels[j + 2], keptRgb);
        pixels[j]     = nearest[0];
        pixels[j + 1] = nearest[1];
        pixels[j + 2] = nearest[2];
        changed = true;
    }
    return changed;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Build a flat RGBA pixel array from a list of hex colors (1 pixel each)
function makePixelsFromColors(hexColors) {
    var pixels = new Uint8Array(hexColors.length * 4);
    hexColors.forEach(function(hex, i) {
        var idx = i * 4;
        if (!hex) {
            pixels[idx + 3] = 0; // transparent
        } else {
            var rgb = hexToRgb(hex);
            pixels[idx]     = rgb[0];
            pixels[idx + 1] = rgb[1];
            pixels[idx + 2] = rgb[2];
            pixels[idx + 3] = 255;
        }
    });
    return pixels;
}

function getPixelHex(pixels, idx) {
    var i = idx * 4;
    return rgbToHex(pixels[i], pixels[i + 1], pixels[i + 2]);
}

function countDistinctOpaqueColors(pixels) {
    var seen = {};
    for (var i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 128) continue;
        seen[rgbToHex(pixels[i], pixels[i + 1], pixels[i + 2])] = true;
    }
    return Object.keys(seen).length;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Enforce — reduce()', function() {
    test('≤6 colors: returns false, pixels unchanged', function() {
        var colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        var pixels = makePixelsFromColors(colors);
        var changed = reduce(pixels, 6);
        expect(changed).toBe(false);
        expect(countDistinctOpaqueColors(pixels)).toBe(6);
    });

    test('exactly 6 colors: identity — no reduction', function() {
        var colors = ['#111111','#222222','#333333','#444444','#555555','#666666'];
        var pixels = makePixelsFromColors(colors);
        var changed = reduce(pixels, 6);
        expect(changed).toBe(false);
    });

    test('>6 colors: returns true, pixel count reduced to ≤6', function() {
        // 7 distinct colors
        var colors = ['#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF','#FFFFFF'];
        var pixels = makePixelsFromColors(colors);
        var changed = reduce(pixels, 6);
        expect(changed).toBe(true);
        expect(countDistinctOpaqueColors(pixels)).toBeLessThanOrEqual(6);
    });

    test('>6 colors: rare color replaced by nearest kept color', function() {
        // 6 high-frequency colors (10 pixels each) + 1 rare color (1 pixel)
        var base = [];
        var frequent = ['#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF'];
        frequent.forEach(function(c) {
            for (var n = 0; n < 10; n++) base.push(c);
        });
        // Rare color very close to #FF0000 (just slightly off)
        base.push('#FE0000');
        var pixels = makePixelsFromColors(base);
        var changed = reduce(pixels, 6);
        expect(changed).toBe(true);
        // The rare pixel should now be #FF0000 (nearest)
        var lastPixelHex = getPixelHex(pixels, base.length - 1);
        expect(lastPixelHex).toBe('#FF0000');
    });

    test('all-transparent pixels: returns false, no crash', function() {
        var pixels = makePixelsFromColors([null, null, null]);
        expect(function() { reduce(pixels, 6); }).not.toThrow();
        var changed = reduce(pixels, 6);
        expect(changed).toBe(false);
    });

    test('single color: returns false (≤6 colors)', function() {
        var pixels = makePixelsFromColors(['#AABBCC', '#AABBCC', '#AABBCC']);
        var changed = reduce(pixels, 6);
        expect(changed).toBe(false);
    });

    test('custom maxColors=2: reduces to ≤2 colors', function() {
        var colors = ['#FF0000','#FF0000','#FF0000', // most frequent
                      '#00FF00','#00FF00',            // second
                      '#0000FF',                      // third → gets remapped
                      '#FFFF00'];                     // fourth → gets remapped
        var pixels = makePixelsFromColors(colors);
        var changed = reduce(pixels, 2);
        expect(changed).toBe(true);
        expect(countDistinctOpaqueColors(pixels)).toBeLessThanOrEqual(2);
    });

    test('keeps highest-frequency colors', function() {
        // #FF0000 appears 5×, #00FF00 appears 3×, others appear 1× each
        var colors = [];
        for (var i = 0; i < 5; i++) colors.push('#FF0000');
        for (var i = 0; i < 3; i++) colors.push('#00FF00');
        colors.push('#0000FF','#FFFF00','#FF00FF','#00FFFF','#FFFFFF'); // 5 rare colors
        var pixels = makePixelsFromColors(colors);
        reduce(pixels, 6);
        // After reduction to 6: #FF0000 and #00FF00 must still be present
        var remaining = {};
        for (var j = 0; j < pixels.length; j += 4) {
            if (pixels[j + 3] < 128) continue;
            remaining[rgbToHex(pixels[j], pixels[j + 1], pixels[j + 2])] = true;
        }
        expect(remaining['#FF0000']).toBe(true);
        expect(remaining['#00FF00']).toBe(true);
    });
});
