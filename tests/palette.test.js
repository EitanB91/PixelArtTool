'use strict';

// tests/palette.test.js
// Algorithm-extraction pattern — does NOT import the IIFE module.
// Reimplements the pure palette logic as standalone functions and tests them directly.

// ── Extracted pure logic ──────────────────────────────────────────────────────

function makeDefaultColors() {
    return ['#1A1A1A', '#CCCCCC', '#FFFFFF', '#FF8844', '#4488FF', '#44CC44'];
}

function paletteAddColor(colors, activeIdx, hex, max) {
    hex = hex.toUpperCase();
    var existing = colors.indexOf(hex);
    if (existing !== -1) return { colors: colors.slice(), activeIdx: existing };
    if (colors.length >= max) return { colors: colors.slice(), activeIdx: activeIdx };
    var next = colors.slice();
    next.push(hex);
    return { colors: next, activeIdx: next.length - 1 };
}

function paletteRemoveColor(colors, activeIdx, idx) {
    if (colors.length <= 1) return { colors: colors.slice(), activeIdx: activeIdx };
    var next = colors.slice();
    next.splice(idx, 1);
    var newActive = activeIdx >= next.length ? next.length - 1 : activeIdx;
    return { colors: next, activeIdx: newActive };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Palette — addColor', function() {
    test('adds a new color and sets it active', function() {
        var colors = makeDefaultColors(); // 6 colors
        var result = paletteAddColor(colors, 0, '#FF0000', 8);
        expect(result.colors).toContain('#FF0000');
        expect(result.activeIdx).toBe(6);
    });

    test('normalizes hex to uppercase before adding', function() {
        var colors = ['#AABBCC'];
        var result = paletteAddColor(colors, 0, '#aabbcc', 8);
        // dedup: already exists
        expect(result.colors.length).toBe(1);
    });

    test('deduplicates: returns existing index when color already present', function() {
        var colors = ['#FF0000', '#00FF00'];
        var result = paletteAddColor(colors, 0, '#ff0000', 8);
        expect(result.colors.length).toBe(2);
        expect(result.activeIdx).toBe(0);
    });

    test('enforces max-8 cap: does not add when palette is full', function() {
        var colors = ['#111111','#222222','#333333','#444444','#555555','#666666','#777777','#888888'];
        expect(colors.length).toBe(8);
        var result = paletteAddColor(colors, 0, '#999999', 8);
        expect(result.colors.length).toBe(8);
        expect(result.colors).not.toContain('#999999');
    });

    test('max-cap check: palette with 7 colors can still accept one more', function() {
        var colors = ['#111111','#222222','#333333','#444444','#555555','#666666','#777777'];
        var result = paletteAddColor(colors, 0, '#888888', 8);
        expect(result.colors.length).toBe(8);
        expect(result.colors).toContain('#888888');
    });
});

describe('Palette — removeColor', function() {
    test('removes color at given index', function() {
        var colors = ['#FF0000', '#00FF00', '#0000FF'];
        var result = paletteRemoveColor(colors, 0, 1);
        expect(result.colors).toEqual(['#FF0000', '#0000FF']);
    });

    test('does not remove when only 1 color remains', function() {
        var colors = ['#FF0000'];
        var result = paletteRemoveColor(colors, 0, 0);
        expect(result.colors).toEqual(['#FF0000']);
    });

    test('clamps activeIdx to last slot when active color is removed', function() {
        var colors = ['#FF0000', '#00FF00', '#0000FF'];
        // Remove index 2 while active is 2
        var result = paletteRemoveColor(colors, 2, 2);
        expect(result.activeIdx).toBe(1); // clamped to new last
    });

    test('keeps activeIdx stable when removing a different color before it', function() {
        var colors = ['#FF0000', '#00FF00', '#0000FF'];
        // Active is 2, remove index 0 — activeIdx should shift to 1
        var result = paletteRemoveColor(colors, 2, 0);
        // activeIdx 2 >= new length 2, so clamps to 1
        expect(result.activeIdx).toBe(1);
    });

    test('preserves min-1 floor: two-color palette can drop to one', function() {
        var colors = ['#FF0000', '#00FF00'];
        var result = paletteRemoveColor(colors, 0, 1);
        expect(result.colors.length).toBe(1);
    });
});
