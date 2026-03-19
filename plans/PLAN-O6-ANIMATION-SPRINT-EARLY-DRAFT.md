# Plan: Sprite Pipeline — Current Session Decisions

## Grand Vision (separate future project)
Director wants a standalone AI-assisted pixel art tool:
description/reference → AI generation → style enforcement → png2sprite.js → game code
Agreed: build as a SEPARATE project. `png2sprite.js` is the bridge to any future game.

---

# Current Task: Path B — Pixel Art Tool → PNG → Code Generator

## Context
Hand-writing pixel art as `pxAt()` coordinate data cannot match the reference quality.
The references were made in a pixel art tool (Aseprite/Piskel) by a real artist.
Path B keeps the "pure fillRect, no image files" engine constraint while enabling
professional-quality sprites: artist draws in a pixel art tool → exports 1× PNG →
Node script auto-generates the `pxAt()` function code → paste into sprites.js.

---

## The Workflow (once built)

```
1. Open Aseprite / Piskel (free tools, see below)
2. Create new canvas at EXACT game-pixel dimensions
   Player: 16 × 22 px  |  Neanderthal: ~16 × 22 px  |  Animal: 14 × 12 px  etc.
3. Draw sprite pixel by pixel using the reference image as guide
4. Export frame(s) as 1× PNG  (1 tool-pixel = 1 game pixel)
5. Run:  node tools/png2sprite.js <input.png> --name <functionName>
6. Converter prints pxAt() function to stdout → paste into sprites.js
7. For animated sprites: draw frame0 + frame1 separately, run converter twice,
   then manually add lOff logic for the differing rows (typically just legs)
```

---

## Recommended Free Pixel Art Tools

| Tool | Cost | Platform | Notes |
|---|---|---|---|
| **Piskel** | Free | Web / Desktop | Lowest barrier, good for this project |
| **LibreSprite** | Free | Desktop | Free fork of Aseprite, solid animation support |
| **Aseprite** | $20 | Desktop | Industry standard, best in class |

**Piskel** is the recommended starting point — runs in browser, no install.

---

## What Gets Built

### 1. `tools/png2sprite.js` — the converter

**Input:** 1× PNG file (one frame, transparent background)
**Output:** JavaScript function printed to stdout

**Algorithm:**
1. Read PNG with `pngjs` (pure-JS, no native dependencies)
2. Build pixel map: for each pixel with alpha ≥ 128, record `{x, y, hex}`
3. Greedy rectangle scan (minimises number of pxAt calls):
   - For each unvisited opaque pixel (left→right, top→bottom):
     - Extend RIGHT as far as same color continues → width `w`
     - Extend DOWN as far as all rows have same color in that column range → height `h`
     - Emit one `pxAt(ctx, bx, by, x, y, '#RRGGBB', w, h)` call
     - Mark all covered pixels as visited
4. Wrap in a named function, print to stdout

**Usage:**
```bash
node tools/png2sprite.js path/to/sprite.png --name _drawPlayerLv0
```

**Sample output:**
```javascript
// Generated from: sprite.png  (16 × 22 game pixels, 47 rects)
function _drawPlayerLv0(ctx, bx, by, lOff) {
    pxAt(ctx, bx, by,  2,  1, '#1A1A1A', 10, 2);
    pxAt(ctx, bx, by,  3,  0, '#1A1A1A',  1, 1);
    // ... (47 total calls)
}
```

### 2. `package.json` — add pngjs

```json
"dependencies": {
  "pngjs": "^7.0.0"
}
```
(devDependency — only needed for the build tool, not the game)

---

## Important: Reference PNG Scale

The reference PNGs in `referances/` are at display scale (zoomed in), NOT 1× game pixels.
**Do not feed the reference PNGs directly into the converter.**

Correct workflow:
- Open the reference in Piskel/Aseprite as a *visual guide* (in a separate window or as a reference layer)
- Draw a NEW sprite at the correct 1× dimensions
- Export THAT as the input PNG for the converter

---

## Files Modified / Created

| File | Action |
|---|---|
| `tools/png2sprite.js` | CREATE — the converter script |
| `package.json` | EDIT — add pngjs as devDependency |
| `js/sprites/sprites.js` | EDIT — replace sprite functions with converter output (after first sprite is drawn) |

---

## Verification

1. `npm install` — installs pngjs
2. Create a simple 4×4 test PNG with known colors
3. Run `node tools/png2sprite.js test.png --name testSprite`
4. Confirm output has correct pxAt coordinates and colors
5. Paste output into preview.html inline, verify it renders identically to the input PNG
6. Director draws Lv0 Cave Dweller in Piskel at 16×22 px, exports, runs converter
7. Output replaces `_drawPlayerLv0` in sprites.js — open preview.html to compare
