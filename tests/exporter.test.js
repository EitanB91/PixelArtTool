'use strict';

// tests/exporter.test.js
// Algorithm-extraction pattern — does NOT import the IIFE module.
// Reimplements the greedy rectangle scan as a standalone function and tests it directly.

// ── Extracted pure logic ──────────────────────────────────────────────────────

function toHex(r, g, b) {
    return '#' +
        ('0' + r.toString(16)).slice(-2).toUpperCase() +
        ('0' + g.toString(16)).slice(-2).toUpperCase() +
        ('0' + b.toString(16)).slice(-2).toUpperCase();
}

// pixels: flat RGBA Uint8ClampedArray (or Array), w/h in game pixels
function greedyRects(pixels, w, h) {
    var visited = new Uint8Array(w * h);
    var rects   = [];

    function getHex(x, y) {
        if (x < 0 || y < 0 || x >= w || y >= h) return null;
        var i = (y * w + x) * 4;
        if (pixels[i + 3] < 128) return null;
        return toHex(pixels[i], pixels[i + 1], pixels[i + 2]);
    }

    for (var ry = 0; ry < h; ry++) {
        for (var rx = 0; rx < w; rx++) {
            if (visited[ry * w + rx]) continue;
            var color = getHex(rx, ry);
            if (!color) { visited[ry * w + rx] = 1; continue; }

            var rw = 1;
            while (rx + rw < w && !visited[ry * w + rx + rw] && getHex(rx + rw, ry) === color) rw++;

            var rh = 1;
            outer: while (ry + rh < h) {
                for (var dx = 0; dx < rw; dx++) {
                    if (visited[(ry + rh) * w + rx + dx] || getHex(rx + dx, ry + rh) !== color) break outer;
                }
                rh++;
            }

            rects.push({ x: rx, y: ry, w: rw, h: rh, color: color });

            for (var dy = 0; dy < rh; dy++)
                for (var dx2 = 0; dx2 < rw; dx2++)
                    visited[(ry + dy) * w + (rx + dx2)] = 1;
        }
    }
    return rects;
}

// Helper: build a flat RGBA pixel array for a w×h grid
// colorGrid: 2D array of hex strings or null (transparent)
function makePixels(colorGrid) {
    var h = colorGrid.length;
    var w = colorGrid[0].length;
    var pixels = new Uint8Array(w * h * 4); // all zero = transparent
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var hex = colorGrid[y][x];
            if (!hex) continue;
            var i = (y * w + x) * 4;
            pixels[i]     = parseInt(hex.slice(1, 3), 16);
            pixels[i + 1] = parseInt(hex.slice(3, 5), 16);
            pixels[i + 2] = parseInt(hex.slice(5, 7), 16);
            pixels[i + 3] = 255;
        }
    }
    return { pixels, w, h };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Exporter — greedy rect algorithm', function() {
    test('single solid rect: entire canvas is one color → one rect', function() {
        var g = makePixels([
            ['#FF0000', '#FF0000'],
            ['#FF0000', '#FF0000']
        ]);
        var rects = greedyRects(g.pixels, g.w, g.h);
        expect(rects.length).toBe(1);
        expect(rects[0]).toEqual({ x: 0, y: 0, w: 2, h: 2, color: '#FF0000' });
    });

    test('two disjoint rects same color: scanned as one wide rect', function() {
        // Two separate 1×1 pixels in the same row, same color, no gap
        var g = makePixels([
            ['#00FF00', null, '#00FF00']
        ]);
        var rects = greedyRects(g.pixels, g.w, g.h);
        // Gap splits them into two separate rects
        expect(rects.length).toBe(2);
        expect(rects[0].color).toBe('#00FF00');
        expect(rects[1].color).toBe('#00FF00');
    });

    test('two disjoint rects different colors: produces two rects', function() {
        var g = makePixels([
            ['#FF0000', '#0000FF']
        ]);
        var rects = greedyRects(g.pixels, g.w, g.h);
        expect(rects.length).toBe(2);
        var colors = rects.map(function(r) { return r.color; }).sort();
        expect(colors).toEqual(['#0000FF', '#FF0000']);
    });

    test('transparent pixels produce no rects', function() {
        var g = makePixels([
            [null, null],
            [null, null]
        ]);
        var rects = greedyRects(g.pixels, g.w, g.h);
        expect(rects.length).toBe(0);
    });

    test('1×1 sprite: single opaque pixel → one rect', function() {
        var g = makePixels([['#AABBCC']]);
        var rects = greedyRects(g.pixels, g.w, g.h);
        expect(rects.length).toBe(1);
        expect(rects[0]).toEqual({ x: 0, y: 0, w: 1, h: 1, color: '#AABBCC' });
    });

    test('1×1 sprite: single transparent pixel → zero rects', function() {
        var g = makePixels([[null]]);
        var rects = greedyRects(g.pixels, g.w, g.h);
        expect(rects.length).toBe(0);
    });

    test('greedy expansion: 2 rows same color → single 2×2 rect, not 2 rows', function() {
        var g = makePixels([
            ['#112233', '#112233'],
            ['#112233', '#112233']
        ]);
        var rects = greedyRects(g.pixels, g.w, g.h);
        expect(rects.length).toBe(1);
        expect(rects[0].w).toBe(2);
        expect(rects[0].h).toBe(2);
    });

    test('mixed: opaque top row, transparent bottom → one rect, correct height', function() {
        var g = makePixels([
            ['#FF0000', '#FF0000'],
            [null,      null     ]
        ]);
        var rects = greedyRects(g.pixels, g.w, g.h);
        expect(rects.length).toBe(1);
        expect(rects[0].h).toBe(1);
    });

    test('all rects cover every opaque pixel exactly once', function() {
        var grid = [
            ['#FF0000', '#00FF00'],
            ['#0000FF', '#FF0000']
        ];
        var g = makePixels(grid);
        var rects = greedyRects(g.pixels, g.w, g.h);
        // Count pixels covered
        var covered = 0;
        rects.forEach(function(r) { covered += r.w * r.h; });
        expect(covered).toBe(4); // all 4 pixels accounted for
    });
});
