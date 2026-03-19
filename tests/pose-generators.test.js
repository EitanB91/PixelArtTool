'use strict';

// tests/pose-generators.test.js
// Phase O6-3: pose generator tests — pure logic extracted from PoseTemplates.

// ── Extracted helpers ────────────────────────────────────────────────────────

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

function countNonTransparent(pixels, w, h) {
    var count = 0;
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            if (pixels[(y * w + x) * 4 + 3] > 0) count++;
        }
    }
    return count;
}

// ── Extracted no-region generators ───────────────────────────────────────────

function shiftTopHalf(basePixels, w, h, dy) {
    var frame = basePixels.slice();
    var midY = Math.floor(h / 2);
    var topPixels = [];
    for (var y = 0; y < midY; y++) {
        for (var x = 0; x < w; x++) {
            var i = (y * w + x) * 4;
            topPixels.push({ x: x, y: y, r: frame[i], g: frame[i+1], b: frame[i+2], a: frame[i+3] });
        }
    }
    for (var c = 0; c < topPixels.length; c++) {
        var ci = (topPixels[c].y * w + topPixels[c].x) * 4;
        frame[ci] = 0; frame[ci+1] = 0; frame[ci+2] = 0; frame[ci+3] = 0;
    }
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

function shiftAll(basePixels, w, h, dx, dy) {
    var frame = new Array(w * h * 4).fill(0);
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var si = (y * w + x) * 4;
            var nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                var di = (ny * w + nx) * 4;
                frame[di] = basePixels[si]; frame[di+1] = basePixels[si+1];
                frame[di+2] = basePixels[si+2]; frame[di+3] = basePixels[si+3];
            }
        }
    }
    return frame;
}

function generateIdle(basePixels, w, h) {
    return [basePixels.slice(), shiftTopHalf(basePixels, w, h, -1)];
}

function generateJump(basePixels, w, h) {
    return [basePixels.slice(), shiftTopHalf(basePixels, w, h, 1), shiftAll(basePixels, w, h, 0, -2)];
}

function generateWalk(basePixels, w, h) {
    return [basePixels.slice(), basePixels.slice(), basePixels.slice(), basePixels.slice()];
}

function generateRotation(basePixels, w, h) {
    var frames = [basePixels.slice()];
    for (var rot = 1; rot <= 3; rot++) {
        var frame = new Array(w * h * 4).fill(0);
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var si = (y * w + x) * 4;
                if (basePixels[si + 3] === 0) continue;
                var nx, ny;
                if (rot === 1)      { nx = (h-1)-y; ny = x; }
                else if (rot === 2) { nx = (w-1)-x; ny = (h-1)-y; }
                else                { nx = y; ny = (w-1)-x; }
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    var di = (ny * w + nx) * 4;
                    frame[di] = basePixels[si]; frame[di+1] = basePixels[si+1];
                    frame[di+2] = basePixels[si+2]; frame[di+3] = basePixels[si+3];
                }
            }
        }
        frames.push(frame);
    }
    return frames;
}

function generatePulse(basePixels, w, h) {
    var frame0 = basePixels.slice();
    var frame1 = new Array(w * h * 4).fill(0);
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var i = (y * w + x) * 4;
            if (basePixels[i+3] === 0) continue;
            var hasAll = true;
            var nb = [[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
            for (var n = 0; n < 4; n++) {
                var nxi = nb[n][0], nyi = nb[n][1];
                if (nxi < 0 || nxi >= w || nyi < 0 || nyi >= h) { hasAll = false; break; }
                if (basePixels[(nyi * w + nxi) * 4 + 3] === 0) { hasAll = false; break; }
            }
            if (hasAll) {
                frame1[i] = basePixels[i]; frame1[i+1] = basePixels[i+1];
                frame1[i+2] = basePixels[i+2]; frame1[i+3] = basePixels[i+3];
            }
        }
    }
    return [frame0, frame1];
}

function generateFlicker(basePixels, w, h) {
    var frame0 = basePixels.slice();
    var frame1 = basePixels.slice();
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            if ((x + y) % 2 === 0) {
                var i = (y * w + x) * 4;
                frame1[i] = 0; frame1[i+1] = 0; frame1[i+2] = 0; frame1[i+3] = 0;
            }
        }
    }
    return [frame0, frame1, basePixels.slice()];
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Idle pose — no regions', function() {
    test('produces 2 frames', function() {
        var px = makePixels(8, 8);
        setPixel(px, 8, 4, 2, 255, 0, 0);
        var frames = generateIdle(px, 8, 8);
        expect(frames.length).toBe(2);
    });

    test('frame 0 is unchanged base', function() {
        var px = makePixels(8, 8);
        setPixel(px, 8, 4, 2, 255, 0, 0);
        var frames = generateIdle(px, 8, 8);
        expect(getPixel(frames[0], 8, 4, 2).r).toBe(255);
    });

    test('frame 1 has top half shifted up by 1', function() {
        var px = makePixels(8, 8);
        setPixel(px, 8, 4, 2, 255, 0, 0); // in top half (midY=4)
        var frames = generateIdle(px, 8, 8);
        // Original position should be cleared
        expect(getPixel(frames[1], 8, 4, 2).a).toBe(0);
        // Pixel should be at y=1
        expect(getPixel(frames[1], 8, 4, 1).r).toBe(255);
    });

    test('frame 1 preserves bottom half', function() {
        var px = makePixels(8, 8);
        setPixel(px, 8, 4, 6, 0, 255, 0); // in bottom half
        var frames = generateIdle(px, 8, 8);
        expect(getPixel(frames[1], 8, 4, 6).g).toBe(255);
    });
});

describe('Jump pose — no regions', function() {
    test('produces 3 frames', function() {
        var px = makePixels(8, 8);
        var frames = generateJump(px, 8, 8);
        expect(frames.length).toBe(3);
    });

    test('frame 0 is base', function() {
        var px = makePixels(8, 8);
        setPixel(px, 8, 3, 3, 200, 100, 50);
        var frames = generateJump(px, 8, 8);
        expect(getPixel(frames[0], 8, 3, 3).r).toBe(200);
    });

    test('frame 1 crouch: top half shifted down', function() {
        var px = makePixels(8, 8);
        setPixel(px, 8, 3, 1, 200, 100, 50); // top half
        var frames = generateJump(px, 8, 8);
        // Should be at y=2 (shifted +1)
        expect(getPixel(frames[1], 8, 3, 2).r).toBe(200);
    });

    test('frame 2 airborne: entire sprite shifted up by 2', function() {
        var px = makePixels(8, 8);
        setPixel(px, 8, 3, 4, 200, 100, 50);
        var frames = generateJump(px, 8, 8);
        // Should be at y=2 (shifted -2)
        expect(getPixel(frames[2], 8, 3, 2).r).toBe(200);
    });
});

describe('Walk pose — no regions', function() {
    test('produces 4 frames', function() {
        var px = makePixels(8, 8);
        var frames = generateWalk(px, 8, 8);
        expect(frames.length).toBe(4);
    });

    test('all frames are copies of base when no regions', function() {
        var px = makePixels(8, 8);
        setPixel(px, 8, 2, 2, 150, 150, 150);
        var frames = generateWalk(px, 8, 8);
        for (var i = 0; i < 4; i++) {
            expect(getPixel(frames[i], 8, 2, 2).r).toBe(150);
        }
    });
});

describe('Rotation pose', function() {
    test('produces 4 frames', function() {
        var px = makePixels(4, 4);
        var frames = generateRotation(px, 4, 4);
        expect(frames.length).toBe(4);
    });

    test('frame 0 is base', function() {
        var px = makePixels(4, 4);
        setPixel(px, 4, 0, 0, 255, 0, 0);
        var frames = generateRotation(px, 4, 4);
        expect(getPixel(frames[0], 4, 0, 0).r).toBe(255);
    });

    test('90° CW rotation moves top-left pixel to top-right', function() {
        var px = makePixels(4, 4);
        setPixel(px, 4, 0, 0, 255, 0, 0);
        var frames = generateRotation(px, 4, 4);
        // (0,0) → 90° CW → (3,0) for 4x4 square
        expect(getPixel(frames[1], 4, 3, 0).r).toBe(255);
    });

    test('180° rotation moves top-left to bottom-right', function() {
        var px = makePixels(4, 4);
        setPixel(px, 4, 0, 0, 255, 0, 0);
        var frames = generateRotation(px, 4, 4);
        expect(getPixel(frames[2], 4, 3, 3).r).toBe(255);
    });

    test('270° CW rotation moves top-left to bottom-left', function() {
        var px = makePixels(4, 4);
        setPixel(px, 4, 0, 0, 255, 0, 0);
        var frames = generateRotation(px, 4, 4);
        expect(getPixel(frames[3], 4, 0, 3).r).toBe(255);
    });
});

describe('Pulse pose', function() {
    test('produces 2 frames', function() {
        var px = makePixels(4, 4);
        var frames = generatePulse(px, 4, 4);
        expect(frames.length).toBe(2);
    });

    test('frame 0 is base', function() {
        var px = makePixels(4, 4);
        setPixel(px, 4, 0, 0, 255, 0, 0);
        var frames = generatePulse(px, 4, 4);
        expect(getPixel(frames[0], 4, 0, 0).r).toBe(255);
    });

    test('frame 1 removes border pixels (no 4-neighbors)', function() {
        var px = makePixels(4, 4);
        // Fill a 4x4 solid block
        for (var y = 0; y < 4; y++)
            for (var x = 0; x < 4; x++)
                setPixel(px, 4, x, y, 100, 100, 100);

        var frames = generatePulse(px, 4, 4);

        // Border pixels (with edges) should be removed
        expect(getPixel(frames[1], 4, 0, 0).a).toBe(0); // corner
        expect(getPixel(frames[1], 4, 1, 0).a).toBe(0); // top edge

        // Interior pixels (all 4 neighbors present) should survive
        expect(getPixel(frames[1], 4, 1, 1).r).toBe(100);
        expect(getPixel(frames[1], 4, 2, 2).r).toBe(100);
    });

    test('frame 1 has fewer non-transparent pixels than frame 0', function() {
        var px = makePixels(6, 6);
        for (var y = 0; y < 6; y++)
            for (var x = 0; x < 6; x++)
                setPixel(px, 6, x, y, 100, 100, 100);

        var frames = generatePulse(px, 6, 6);
        var count0 = countNonTransparent(frames[0], 6, 6);
        var count1 = countNonTransparent(frames[1], 6, 6);
        expect(count1).toBeLessThan(count0);
    });
});

describe('Flicker pose', function() {
    test('produces 3 frames', function() {
        var px = makePixels(4, 4);
        var frames = generateFlicker(px, 4, 4);
        expect(frames.length).toBe(3);
    });

    test('frame 0 and frame 2 are identical to base', function() {
        var px = makePixels(4, 4);
        setPixel(px, 4, 1, 1, 200, 100, 50);
        var frames = generateFlicker(px, 4, 4);
        expect(getPixel(frames[0], 4, 1, 1).r).toBe(200);
        expect(getPixel(frames[2], 4, 1, 1).r).toBe(200);
    });

    test('frame 1 applies checkerboard transparency', function() {
        var px = makePixels(4, 4);
        for (var y = 0; y < 4; y++)
            for (var x = 0; x < 4; x++)
                setPixel(px, 4, x, y, 100, 100, 100);

        var frames = generateFlicker(px, 4, 4);

        // (0,0) is even+even=even → cleared
        expect(getPixel(frames[1], 4, 0, 0).a).toBe(0);
        // (1,0) is odd+even=odd → preserved
        expect(getPixel(frames[1], 4, 1, 0).r).toBe(100);
        // (0,1) is even+odd=odd → preserved
        expect(getPixel(frames[1], 4, 0, 1).r).toBe(100);
        // (1,1) is odd+odd=even → cleared
        expect(getPixel(frames[1], 4, 1, 1).a).toBe(0);
    });

    test('frame 1 has roughly half the pixels of frame 0', function() {
        var px = makePixels(4, 4);
        for (var y = 0; y < 4; y++)
            for (var x = 0; x < 4; x++)
                setPixel(px, 4, x, y, 100, 100, 100);

        var frames = generateFlicker(px, 4, 4);
        var count0 = countNonTransparent(frames[0], 4, 4);
        var count1 = countNonTransparent(frames[1], 4, 4);
        expect(count1).toBe(count0 / 2);
    });
});
