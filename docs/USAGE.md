# Pixel Art Tool — Usage Guide

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- An [Anthropic API key](https://console.anthropic.com/) (for AI generation)

### Setup

```bash
git clone https://github.com/EitanB91/PixelArtTool.git
cd PixelArtTool
npm install
```

Create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Run

```bash
npm start          # launch the app
npm run dev        # launch with DevTools open
npm test           # run unit tests
npm run convert    # run the CLI converter (see below)
npm run build      # package for Windows (NSIS installer + portable)
```

---

## UI Overview

The app uses a dark theme with four main areas:

```
┌──────────────────────────────────────────────────────┐
│  Top Bar: [W] [H] [Preset ▾] [Zoom ─●──] [Undo Redo Clear] │
├────┬─────────────────────────────┬───────────────────┤
│    │                             │  PALETTE           │
│ T  │                             │  REFERENCE         │
│ O  │        Drawing Canvas       │  AI GENERATE       │
│ O  │                             │  EXPORT CODE       │
│ L  │                             │                    │
│ S  │                             │                    │
├────┴─────────────────────────────┴───────────────────┘
```

- **Top bar** — canvas dimensions, dimension presets, zoom slider, undo/redo/clear
- **Left toolbar** — drawing tools + active color swatch
- **Center** — the drawing canvas (zoomable grid)
- **Right panels** — palette, reference image, AI generation, export

---

## Drawing Tools

| Tool | Button | Shortcut | Description |
|------|--------|----------|-------------|
| Pencil | 🖊 | **B** | Draw pixels in the active palette color |
| Eraser | ◻ | **E** | Clear pixels (make transparent) |
| Fill | 🪣 | **G** | Flood-fill contiguous same-color area |
| Eyedropper | 💧 | **I** | Pick a color from the canvas and add it to your palette |

Click a tool in the left toolbar or press its keyboard shortcut. The active tool is highlighted.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **B** | Pencil tool |
| **E** | Eraser tool |
| **G** | Fill tool |
| **I** | Eyedropper tool |
| **Ctrl+Z** | Undo |
| **Ctrl+Y** | Redo |
| **Shift+Ctrl+Z** | Redo (alternative) |

Shortcuts are disabled when typing in text inputs or textareas.

---

## Canvas Settings

### Dimensions

Set the sprite width (W) and height (H) in the top bar. Valid range: **1–128 pixels**.

Changing dimensions resizes the canvas and resets the history stack.

### Dimension Presets

The preset dropdown provides common sprite sizes:

| Preset | Use case |
|--------|----------|
| 16×22 | Player character (Ages of War standard) |
| 16×16 | Square sprites, items |
| 8×8 | Small icons, projectiles |
| 32×32 | Larger characters |
| 64×64 | Boss sprites, detailed art |

Selecting a preset sets W and H automatically. Manually editing W or H switches back to "Custom".

### Zoom

The zoom slider controls display magnification (2×–24×). This is display-only — exports always use 1× game pixels.

### Clear

The Clear button erases all pixels on the canvas, clears the reference image, and resets history.

---

## Palette

The palette panel (right side) shows your active colors as clickable swatches.

- **Click** a swatch to make it the active drawing color
- **Right-click** a swatch to remove it (minimum 1 color)
- **Color picker** — use the input to set any hex color; the active swatch updates live
- **+ Add** — adds the current picker color to the palette (max 8 colors)

Default palette: 6 colors (dark gray, light gray, white, orange, blue, green).

---

## Reference Image

The Reference panel lets you load an image to guide your sprite work.

### Load Image

Click **Load Image** and select a PNG, JPEG, or GIF. The image displays in the panel at up to 120×120px.

### Extract Palette

Click **Extract Palette** to pull the top 8 most-frequent colors from the reference image into your palette. This replaces your current palette.

### Trace

Click **Trace** to algorithmically convert the reference image into pixel art at your canvas dimensions:

1. The image is resized to fit the canvas using **nearest-neighbor interpolation** (preserves hard pixel edges — no blurring)
2. If the reference aspect ratio differs, the canvas auto-resizes to match
3. The result is painted directly onto the canvas
4. Maximum trace size: 128×128

Trace does **not** run style enforcement — it preserves all colors from the source image. Use Extract Palette + manual editing to reduce colors afterward.

---

## AI Sprite Generation

The AI Generate panel uses Claude to create sprites from text descriptions.

### How to generate

1. Type a description in the text area (e.g., `red mushroom with white spots`)
2. Set your canvas size (W × H) — the AI generates at exactly these dimensions
3. Click **Generate**

The button disables during generation. Status shows progress: "Generating..." → "Done — N colors" or an error message.

### What works well

- Simple objects: mushrooms, coins, gems, flames, trees, potions, weapons
- Geometric shapes and icons
- Sprites with 2–6 colors

### What doesn't work well

- Complex characters with limbs, faces, and weapons
- Detailed humanoid figures

For complex characters, use **Trace Reference** with a hand-drawn or external image instead.

### Style Enforcement

When the **Enforce style** checkbox is enabled (default), the AI pipeline automatically:

1. **Reduces palette** — keeps the 6 most-used colors, remaps the rest to nearest matches
2. **Detects outlines** — finds boundary pixels (opaque pixels next to transparency) and colors them with the darkest palette color

Uncheck the toggle to keep the raw AI output. Enforcement is undo-able.

### Using a Reference Image

If a reference image is loaded when you click Generate, it's sent alongside your text description to guide the AI's output.

---

## Export

The Export Code panel converts your canvas into paste-ready game code.

### Generate Code

1. Set the **function name** (default: `_drawSprite`)
2. Optionally check **lOff** to add a `lOff` parameter to the function signature
3. Click **Generate pxAt() Code**

The greedy rectangle algorithm scans for maximal same-color rectangles, producing optimized `pxAt()` calls:

```javascript
// _drawSprite  16x22  (42 rects)
function _drawSprite(ctx, bx, by) {
    pxAt(ctx, bx, by,  3,  0, '#1A1A1A', 10,  1);
    pxAt(ctx, bx, by,  5,  1, '#FF8844',  6,  2);
    // ...
}
```

### Copy to Clipboard

Click **Copy to Clipboard** to copy the generated code. Paste it directly into your game project's sprite file.

### Save PNG

Click **Save PNG** to export the sprite as a 1× PNG file (one pixel per game pixel, no zoom scaling).

---

## CLI Converter

Convert any PNG to `pxAt()` code without opening the app:

```bash
npm run convert -- input.png [--name <funcName>] [--loff] [--bg auto|#RRGGBB]
```

| Option | Description |
|--------|-------------|
| `--name <name>` | Function name (default: `_drawSprite`) |
| `--loff` | Adds `lOff` parameter to signature |
| `--bg auto` | Treats top-left pixel color as background (skip it) |
| `--bg #RRGGBB` | Treats specific hex color as background (skip it) |

Output goes to stdout — pipe or paste as needed.

---

## Undo / Redo

The app maintains a **50-step** undo/redo history. Every draw stroke, fill, AI generation, trace, and enforcement push creates a history entry.

- **Undo**: Ctrl+Z or the Undo button
- **Redo**: Ctrl+Y (or Shift+Ctrl+Z) or the Redo button

Resizing the canvas or clicking Clear resets the history stack.

---

## Tips

- **Start with a preset** — pick 16×22 for player characters or 16×16 for items
- **AI + manual touch-up** — generate a base sprite, then hand-edit details with the pencil/eraser
- **Trace workflow for characters** — find or sketch a reference image, load it, Trace, then clean up manually
- **Extract Palette first** — when tracing, extract the palette from your reference to get consistent colors
- **Enforce after manual edits** — the enforce toggle only auto-runs after AI generation; for manual work, regenerate the export to see the final result
