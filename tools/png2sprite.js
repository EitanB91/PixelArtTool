#!/usr/bin/env node
/**
 * png2sprite.js — Ages of War sprite converter
 *
 * Reads a 1× PNG (1 pixel = 1 game pixel) and generates pxAt() calls
 * that reproduce the image exactly using filled rectangles.
 *
 * Usage:
 *   node tools/png2sprite.js <input.png> [--name <funcName>] [--loff] [--bg auto|#RRGGBB]
 *
 * Options:
 *   --name  <name>   Function name (default: _drawSprite)
 *   --loff           Use (ctx, bx, by, lOff) signature
 *   --bg auto        Skip top-left corner color (handles Piskel solid backgrounds)
 *   --bg #RRGGBB     Skip this specific color
 *
 * Output: JavaScript function printed to stdout → paste into sprites.js
 */

'use strict';

var fs   = require('fs');
var path = require('path');
var PNG  = require('pngjs').PNG;

// ── Parse args ────────────────────────────────────────────────────────────────
var args     = process.argv.slice(2);
var inputPng = null;
var funcName = '_drawSprite';
var useLoff  = false;
var bgColor  = null;

for (var i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
        funcName = args[++i];
    } else if (args[i] === '--loff') {
        useLoff = true;
    } else if (args[i] === '--bg' && args[i + 1]) {
        bgColor = args[++i];
    } else if (!args[i].startsWith('--')) {
        inputPng = args[i];
    }
}

if (!inputPng) {
    console.error('Usage: node tools/png2sprite.js <input.png> [--name <funcName>] [--loff] [--bg auto|#RRGGBB]');
    process.exit(1);
}

var absPath = path.resolve(inputPng);
if (!fs.existsSync(absPath)) {
    console.error('File not found: ' + absPath);
    process.exit(1);
}

// ── Read PNG via stream (handles files with trailing bytes) ───────────────────
var png = new PNG({ filterType: 4 });

png.on('error', function(err) {
    console.error('PNG parse error: ' + err.message);
    process.exit(1);
});

png.on('parsed', function() {
    convert(this);
});

fs.createReadStream(absPath).pipe(png);

// ── Main conversion ───────────────────────────────────────────────────────────
function toHex(r, g, b) {
    return '#' +
        ('0' + r.toString(16)).slice(-2).toUpperCase() +
        ('0' + g.toString(16)).slice(-2).toUpperCase() +
        ('0' + b.toString(16)).slice(-2).toUpperCase();
}

function pad(n, width) {
    var s = String(n);
    while (s.length < width) s = ' ' + s;
    return s;
}

function convert(png) {
    var W = png.width;
    var H = png.height;

    // ── Resolve background color ──────────────────────────────────────────────
    var skipHex = null;
    if (bgColor === 'auto') {
        var a = png.data[3]; // top-left alpha
        if (a >= 128) {
            skipHex = toHex(png.data[0], png.data[1], png.data[2]);
            process.stderr.write('// Auto-detected background: ' + skipHex + ' (skipping)\n');
        }
    } else if (bgColor) {
        skipHex = bgColor.toUpperCase();
        if (!skipHex.startsWith('#')) skipHex = '#' + skipHex;
    }

    // ── Build pixel map ───────────────────────────────────────────────────────
    var pixels  = [];
    var visited = [];

    for (var y = 0; y < H; y++) {
        pixels[y]  = [];
        visited[y] = [];
        for (var x = 0; x < W; x++) {
            var idx   = (y * W + x) * 4;
            var r     = png.data[idx];
            var g     = png.data[idx + 1];
            var b     = png.data[idx + 2];
            var alpha = png.data[idx + 3];
            var hex   = toHex(r, g, b);

            if (alpha < 128 || hex === skipHex) {
                pixels[y][x]  = null;
                visited[y][x] = true;
            } else {
                pixels[y][x]  = hex;
                visited[y][x] = false;
            }
        }
    }

    // ── Greedy rectangle scan ─────────────────────────────────────────────────
    var rects = [];

    for (var ry = 0; ry < H; ry++) {
        for (var rx = 0; rx < W; rx++) {
            if (visited[ry][rx]) continue;

            var color = pixels[ry][rx];

            // Extend right
            var rw = 1;
            while (rx + rw < W && !visited[ry][rx + rw] && pixels[ry][rx + rw] === color) {
                rw++;
            }

            // Extend down
            var rh = 1;
            outer: while (ry + rh < H) {
                for (var dx = 0; dx < rw; dx++) {
                    if (visited[ry + rh][rx + dx] || pixels[ry + rh][rx + dx] !== color) {
                        break outer;
                    }
                }
                rh++;
            }

            rects.push({ x: rx, y: ry, w: rw, h: rh, color: color });

            // Mark visited
            for (var dy = 0; dy < rh; dy++) {
                for (var dx2 = 0; dx2 < rw; dx2++) {
                    visited[ry + dy][rx + dx2] = true;
                }
            }
        }
    }

    // ── Output ────────────────────────────────────────────────────────────────
    var maxX = 0, maxY = 0, maxW = 0, maxH = 0;
    rects.forEach(function(r) {
        if (r.x > maxX) maxX = r.x;
        if (r.y > maxY) maxY = r.y;
        if (r.w > maxW) maxW = r.w;
        if (r.h > maxH) maxH = r.h;
    });
    var xW = String(maxX).length;
    var yW = String(maxY).length;
    var wW = String(maxW).length;
    var hW = String(maxH).length;

    var basename = path.basename(inputPng);
    var sig = useLoff
        ? 'function ' + funcName + '(ctx, bx, by, lOff) {'
        : 'function ' + funcName + '(ctx, bx, by) {';

    var lines = [];
    lines.push('// Generated from: ' + basename + '  (' + W + '\u00d7' + H + ' px, ' + rects.length + ' rects)');
    lines.push('// Paste into js/sprites/sprites.js replacing the matching function');
    lines.push(sig);

    rects.forEach(function(r) {
        lines.push('    pxAt(ctx, bx, by, ' +
            pad(r.x, xW) + ', ' +
            pad(r.y, yW) + ', \'' +
            r.color + '\', ' +
            pad(r.w, wW) + ', ' +
            pad(r.h, hW) + ');');
    });

    lines.push('}');
    console.log(lines.join('\n'));
}
