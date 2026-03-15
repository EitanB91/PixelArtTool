# Pixel Art Tool — Architecture

## Project Structure

```
PixelArtTool/
├── src/
│   ├── main.js                 Electron main process
│   ├── preload.js              IPC bridge (contextBridge)
│   ├── index.html              Renderer DOM + script load order
│   ├── app.js                  Renderer entry: AppState, init, event wiring
│   ├── core/
│   │   ├── canvas.js           Drawing canvas, pixel operations, zoom
│   │   ├── palette.js          Color palette management (max 8)
│   │   └── history.js          50-step undo/redo stack
│   ├── ai/
│   │   ├── client.js           IPC wrapper for Claude API calls
│   │   ├── generate.js         AI sprite generation + Trace algorithm
│   │   └── enforce.js          Palette reduction + outline detection
│   ├── ui/
│   │   ├── toolbar.js          Tool selection, zoom, canvas size, presets
│   │   ├── palette-panel.js    Color swatches, picker, add/remove
│   │   ├── reference-panel.js  Load image, extract palette, trace
│   │   └── output-panel.js     Export code, copy to clipboard, save PNG
│   ├── export/
│   │   └── exporter.js         Greedy rectangle scan → pxAt() output
│   └── styles/
│       └── main.css            Dark theme, CSS variables, layout
├── tools/
│   ├── png2sprite.js           Standalone PNG → pxAt() CLI converter
│   └── generate-icon.js        App icon generation utility
├── tests/
│   ├── palette.test.js         10 tests
│   ├── history.test.js         16 tests
│   ├── exporter.test.js        9 tests
│   └── enforce.test.js         7 tests
├── package.json
└── .env                        ANTHROPIC_API_KEY (not committed)
```

---

## Module Pattern

All renderer modules use the **IIFE (Immediately Invoked Function Expression)** pattern — no `require`, no `import`. This matches the game project codebase philosophy.

Each module attaches itself to `window` as a global object (e.g., `window.PixelCanvas`, `window.Palette`). Dependencies are resolved via script load order in `index.html`.

---

## Script Load Order

Scripts are loaded at the bottom of `index.html` body, in dependency order:

| # | Script | Globals provided | Dependencies |
|---|--------|-----------------|--------------|
| 1 | `core/palette.js` | `Palette` | None |
| 2 | `core/history.js` | `History` | None |
| 3 | `core/canvas.js` | `PixelCanvas` | `Palette`, `History`, `AppState` |
| 4 | `ui/toolbar.js` | `Toolbar` | `PixelCanvas`, `Palette`, `History`, `AppState` |
| 5 | `ui/palette-panel.js` | `PalettePanel` | `Palette`, `Toolbar` |
| 6 | `ui/reference-panel.js` | `ReferencePanel` | `AppState`, `window.api` |
| 7 | `ui/output-panel.js` | `OutputPanel` | `PixelCanvas`, `Exporter`, `window.api` |
| 8 | `ai/client.js` | `AIClient` | `window.api` |
| 9 | `ai/generate.js` | `AIGenerate` | `AIClient`, `PixelCanvas`, `Palette`, `History`, `AppState` |
| 10 | `ai/enforce.js` | `AIEnforce` | `History`, `PixelCanvas` |
| 11 | `export/exporter.js` | `Exporter` | `PixelCanvas` |
| 12 | `app.js` | `AppState` | All of the above |

---

## State Management

There is no framework. State lives in plain objects.

### AppState (app.js)

```javascript
var AppState = {
    tool: 'pencil',           // 'pencil' | 'eraser' | 'fill' | 'eyedrop'
    referenceBase64: null,     // base64 string of loaded reference image
    referenceExt: null         // 'png' | 'jpeg' | 'gif'
};
```

### Per-Module State

| Module | Key state | Description |
|--------|-----------|-------------|
| `PixelCanvas` | `_pixels` (Uint8ClampedArray) | RGBA pixel data, 4 bytes per pixel |
| `PixelCanvas` | `_w`, `_h` | Sprite dimensions in game pixels |
| `PixelCanvas` | `_zoom` | Display zoom factor (2–24) |
| `PixelCanvas` | `_drawing` | Whether a stroke is in progress |
| `Palette` | `_colors` (string[]) | Array of hex color strings |
| `Palette` | `_active` (number) | Index of active color |
| `History` | `_stack` (Uint8ClampedArray[]) | Up to 50 pixel state snapshots |
| `History` | `_pos` (number) | Current position in the stack |

---

## IPC Channels

All file system operations and API calls happen in `main.js`. The renderer communicates via IPC through `preload.js`.

### Preload Bridge

`preload.js` uses `contextBridge.exposeInMainWorld` to expose a `window.api` object:

```javascript
window.api = {
    openImage,        // () → {path, base64, ext}
    savePng,          // (base64Data, defaultName) → filepath | false
    copyToClipboard,  // (text) → true
    checkApiKey,      // () → boolean
    callClaude,       // (messages, maxTokens, system) → response text
    traceReference,   // (base64, ext) → {pixels, w, h}
    extractPalette    // (base64, ext) → string[] (hex colors)
};
```

### Channel Details

| Channel | Direction | Purpose | Returns |
|---------|-----------|---------|---------|
| `open-image` | renderer → main | Open file dialog, read image | `{path, base64, ext}` |
| `save-png` | renderer → main | Save dialog, write PNG file | filepath or `false` |
| `copy-to-clipboard` | renderer → main | Write text to system clipboard | `true` |
| `check-api-key` | renderer → main | Check if `ANTHROPIC_API_KEY` is set | boolean |
| `call-claude` | renderer → main | Send prompt to Claude API | response text string |
| `trace-reference` | renderer → main | Decode + nearest-neighbor resize image | `{pixels: number[], w, h}` |
| `extract-palette` | renderer → main | Scan image for dominant colors | hex color array (max 8) |

### Security

- `contextIsolation: true` — renderer cannot access Node APIs
- `nodeIntegration: false` — renderer cannot `require()` modules
- API key stays in `main.js` — never serialized to the renderer
- CSP: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:`

---

## Data Flow

### AI Generation Pipeline

```
User types prompt
        │
        ▼
AIGenerate.run()
        │
        ├── Build user content (text + optional reference image base64)
        ├── Calculate maxTokens: w*h*6 + 712, clamped 1024–4096
        │
        ▼
AIClient.chat() ──► IPC "call-claude" ──► main.js ──► Claude API
        │                                                  │
        ▼                                                  │
Parse response ◄──────────────────────────────────────────┘
        │
        ├── Strip markdown fences
        ├── Extract first { ... } JSON block
        ├── Validate schema: {w, h, palette, grid}
        │
        ▼
_applyGrid()
        │
        ├── Add palette colors to Palette module
        ├── Auto-resize canvas if dimensions differ
        ├── Zero pixel array in-place (no clear())
        ├── Write grid indices → pixel RGBA values
        ├── History.push()
        │
        ▼
AIEnforce.enforce()  (if toggle enabled)
        │
        ├── reduce(): keep top 6 colors, remap rest via Euclidean RGB distance
        ├── detectOutline(): boundary pixels → darkest palette color
        ├── History.push() + PixelCanvas.redraw()
        │
        ▼
Status: "Done — N colors · outline applied"
```

### Trace Reference Pipeline

```
User clicks "Load Image"
        │
        ▼
IPC "open-image" → file dialog → base64
        │
        ├── Display in Reference panel
        ├── Store in AppState.referenceBase64 / referenceExt
        │
        ▼
User clicks "Trace"
        │
        ▼
IPC "trace-reference"
        │
        ├── main.js: nativeImage.createFromDataURL() → get size
        ├── Auto-scale: preserve aspect ratio, max 128×128
        ├── Nearest-neighbor resize (hard pixel edges, no blur)
        │
        ▼
Return {pixels: RGBA[], w, h}
        │
        ├── Auto-resize canvas if needed
        ├── Apply RGBA pixels directly
        ├── History.push() + redraw
        │
        ▼
Canvas shows traced sprite (no enforce — preserves source colors)
```

### Export Pipeline

```
User clicks "Generate pxAt() Code"
        │
        ▼
Exporter.generate(funcName, lOff)
        │
        ├── Read PixelCanvas.getPixels(), getWidth(), getHeight()
        │
        ▼
Greedy Rectangle Scan
        │
        ├── For each unvisited opaque pixel (top-left → bottom-right):
        │   ├── Extend right while color matches
        │   ├── Extend down while full row matches
        │   ├── Record {x, y, w, h, color}
        │   └── Mark all covered pixels as visited
        │
        ▼
Build output string
        │
        ├── Header comment: function name + dimensions + rect count
        ├── Function signature (with optional lOff param)
        ├── pxAt() calls with column-aligned padding
        │
        ▼
Display in textarea → "Copy to Clipboard" or "Save PNG"
```

---

## Greedy Rectangle Algorithm

Used in both `exporter.js` (renderer) and `png2sprite.js` (CLI). The algorithm is duplicated because `png2sprite.js` must remain self-contained for sharing across game projects (tracked as O7 for future refactor).

```
For each pixel (scanline order, top-left to bottom-right):
    Skip if transparent or already visited
    1. Record color at (x, y)
    2. Extend width: move right while same color and not visited
    3. Extend height: move down while entire row matches
    4. Emit rectangle {x, y, w, h, color}
    5. Mark all pixels in rectangle as visited
```

Time complexity: O(W × H). Produces fewer `pxAt()` calls than pixel-by-pixel output.

---

## Core Module APIs

### PixelCanvas (canvas.js)

| Method | Description |
|--------|-------------|
| `init(canvasEl)` | Bind canvas element, set up mouse events |
| `resize(w, h)` | Set sprite dimensions, reset pixel array + history |
| `setZoom(z)` | Set display zoom (2–24), redraw |
| `clear()` | Zero all pixels, push to history |
| `getPixels()` | Return pixel Uint8ClampedArray (RGBA) |
| `getWidth()` / `getHeight()` | Sprite dimensions |
| `applyHistory(pixelData)` | Restore a history snapshot |
| `toPngBase64()` | Export canvas as 1× PNG data URL |
| `redraw()` | Re-render canvas from pixel array |

### Palette (palette.js)

| Method | Description |
|--------|-------------|
| `getColors()` | Return array of hex strings |
| `getActive()` | Return active hex color |
| `getActiveIdx()` | Return active color index |
| `setActive(idx)` | Set active color by index |
| `addColor(hex)` | Add color (max 8, deduped) |
| `removeColor(idx)` | Remove color (min 1) |
| `setColor(idx, hex)` | Replace color at index |
| `reset()` | Restore default 6-color palette |

### History (history.js)

| Method | Description |
|--------|-------------|
| `push(pixelData)` | Save snapshot (max 50, oldest dropped) |
| `undo()` | Step back, return previous pixel data |
| `redo()` | Step forward, return next pixel data |
| `canUndo()` / `canRedo()` | Check availability |
| `reset()` | Clear all history |

### AIEnforce (enforce.js)

| Method | Description |
|--------|-------------|
| `enforce(pixels, w, h, statusEl)` | Run full enforcement (reduce + outline) |
| `reduce(pixels, maxColors)` | Keep top N colors, remap rest to nearest |
| `detectOutline(pixels, w, h)` | Boundary pixels → darkest palette color |

### Exporter (exporter.js)

| Method | Description |
|--------|-------------|
| `generate(funcName, lOff)` | Run greedy rect scan, return pxAt() code string |

---

## Electron Configuration

| Setting | Value |
|---------|-------|
| Window size | 1400×900 (min 1000×700) |
| Background | `#1A1A1A` |
| Context isolation | `true` |
| Node integration | `false` |
| Preload | `preload.js` |
| DevTools | `--dev` flag |

---

## Claude API Integration

| Setting | Value |
|---------|-------|
| Model | `claude-sonnet-4-6` |
| API version | `2023-06-01` |
| Endpoint | `https://api.anthropic.com/v1/messages` |
| Key source | `process.env.ANTHROPIC_API_KEY` (from `.env`) |
| Max tokens | Adaptive: `w*h*6 + 712`, clamped 1024–4096 |

The system prompt enforces:
- Chain-of-thought planning (region breakdown) before JSON output
- Silhouette-first composition with dark outline
- Palette discipline: 2–6 colors
- Output schema: `{w, h, palette: ["#HEX",...], grid: [[idx|null,...],...]}`

---

## CSS Theme

Layout uses CSS Grid (top bar + toolbar | canvas | panels) with flexbox for panel interiors.

```css
--bg-base:    #1A1A1A      /* app background */
--bg-panel:   #252525      /* panel backgrounds */
--bg-control: #2E2E2E      /* inputs, buttons */
--border:     #3A3A3A      /* panel borders */
--text:       #CCCCCC      /* primary text */
--text-dim:   #666         /* secondary text */
--accent:     #FF8844      /* active elements, highlights */
--accent-dim: #7A3A18      /* hover states */
--canvas-bg:  #111         /* canvas background */
```

Font: Consolas, monospace.

---

## Testing

Tests use Jest. IIFE modules are tested by evaluating their source in a controlled environment with mocked globals (see `tests/TESTING_STRATEGY.md`).

| Suite | Tests | Coverage |
|-------|-------|----------|
| `palette.test.js` | 10 | addColor dedup, max-8 cap, removeColor min-1 floor |
| `history.test.js` | 16 | push max-50 eviction, undo/redo stacks, reset |
| `exporter.test.js` | 9 | Single rect, disjoint rects, transparent pixels, 1×1 |
| `enforce.test.js` | 7 | ≤6 identity, >6 reduction, all-transparent no-crash |
| **Total** | **42** | All pure-logic modules |

Run with: `npm test`

---

## png2sprite.js (CLI)

Standalone converter shared across game projects. Self-contained — only depends on `pngjs` and `fs`.

```bash
node tools/png2sprite.js <input.png> [--name <func>] [--loff] [--bg auto|#RRGGBB]
```

Uses the same greedy rectangle algorithm as `exporter.js`. Output goes to stdout.
