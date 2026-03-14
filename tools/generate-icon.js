'use strict';

// tools/generate-icon.js
// Generates assets/icon.png (256×256) and assets/icon.ico for the Pixel Art Tool app.
// Uses only pngjs (already a project dependency). Run with: node tools/generate-icon.js

const fs   = require('fs');
const path = require('path');
const PNG  = require('pngjs').PNG;

// ── Icon design (32×32 logical pixel grid) ────────────────────────────────────
// Each logical pixel becomes SCALE×SCALE real pixels in the output PNG.

const SCALE = 8;       // 32 × 8 = 256px output
const SIZE  = 32;

// Color palette [r, g, b, a]
const T  = [0,   0,   0,   0  ]; // transparent
const BG = [37,  37,  37,  255]; // #252525 dark interior
const OR = [255, 136, 68,  255]; // #FF8844 orange frame
const RD = [220, 80,  80,  255]; // #DC5050 red
const BL = [68,  136, 255, 255]; // #4488FF blue
const GR = [68,  204, 68,  255]; // #44CC44 green
const YL = [255, 210, 80,  255]; // #FFD250 yellow-orange

// Build 32×32 logical grid
const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(T));

function rect(x1, y1, x2, y2, color) {
    for (let y = y1; y <= y2; y++)
        for (let x = x1; x <= x2; x++)
            grid[y][x] = color;
}

// Orange outer frame (2px thick, occupying rows/cols 2–29)
rect(2, 2, 29, 29, OR);
// Dark interior
rect(4, 4, 27, 27, BG);
// Four colored squares in a 2×2 layout (each 6×6, separated by dark gap)
rect( 6,  6, 11, 11, RD);  // top-left:     red
rect(17,  6, 22, 11, BL);  // top-right:    blue
rect( 6, 17, 11, 22, GR);  // bottom-left:  green
rect(17, 17, 22, 22, YL);  // bottom-right: yellow

// ── Scale up to 256×256 PNG ───────────────────────────────────────────────────
const OUT = SIZE * SCALE; // 256
const png = new PNG({ width: OUT, height: OUT });

for (let ly = 0; ly < SIZE; ly++) {
    for (let lx = 0; lx < SIZE; lx++) {
        const color = grid[ly][lx];
        for (let sy = 0; sy < SCALE; sy++) {
            for (let sx = 0; sx < SCALE; sx++) {
                const ry  = ly * SCALE + sy;
                const rx  = lx * SCALE + sx;
                const idx = (ry * OUT + rx) * 4;
                png.data[idx]     = color[0];
                png.data[idx + 1] = color[1];
                png.data[idx + 2] = color[2];
                png.data[idx + 3] = color[3];
            }
        }
    }
}

const pngBuf = PNG.sync.write(png);

// ── Write PNG ─────────────────────────────────────────────────────────────────
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

fs.writeFileSync(path.join(assetsDir, 'icon.png'), pngBuf);
console.log('✓ assets/icon.png  (' + OUT + 'x' + OUT + ')');

// ── Write ICO (embeds the PNG directly — valid for 256px in ICO format) ───────
// ICO with embedded PNG is supported on Windows Vista+ and by electron-builder.
const icoOffset = 6 + 16; // header (6) + one directory entry (16)

const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type: 1 = icon
icoHeader.writeUInt16LE(1, 4); // count: 1 image

const dirEntry = Buffer.alloc(16);
dirEntry.writeUInt8(0,  0);                       // width:  0 = 256
dirEntry.writeUInt8(0,  1);                       // height: 0 = 256
dirEntry.writeUInt8(0,  2);                       // color count: 0 (true color)
dirEntry.writeUInt8(0,  3);                       // reserved
dirEntry.writeUInt16LE(1,  4);                    // planes
dirEntry.writeUInt16LE(32, 6);                    // bits per pixel
dirEntry.writeUInt32LE(pngBuf.length, 8);         // size of image data
dirEntry.writeUInt32LE(icoOffset, 12);            // offset to image data

const icoBuf = Buffer.concat([icoHeader, dirEntry, pngBuf]);
fs.writeFileSync(path.join(assetsDir, 'icon.ico'), icoBuf);
console.log('✓ assets/icon.ico  (256x256 PNG-in-ICO)');
