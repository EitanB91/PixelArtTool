# Pixel Art Tool

An AI-assisted standalone desktop application for generating pixel art sprites and exporting them as paste-ready `pxAt()` code for game engines.

Built with Electron + Claude AI. Designed for the sprite production pipeline in retro arcade games (e.g. *Ages of War*).

**Current version: v0.2.0**

---

## Pipeline

```
description / reference image
        ↓
  Claude AI (Sonnet)
        ↓
  style enforcement
  (palette reduction + outline detection)
        ↓
   PNG export
        ↓
  png2sprite.js
        ↓
paste-ready pxAt() code
```

---

## Features

### Drawing
- **Drawing canvas** — pencil, eraser, fill bucket, eyedropper with configurable zoom (2×–24×)
- **Dimension presets** — quick-select common sprite sizes: 16×22 (player), 16×16, 8×8, 32×32, 64×64
- **Undo/redo** — 50-step history stack (Ctrl+Z / Ctrl+Y)
- **Keyboard shortcuts** — B (pencil), E (eraser), G (fill), I (eyedropper)

### AI & Reference
- **AI sprite generation** — describe a sprite in plain text; Claude generates it directly onto the canvas with chain-of-thought planning
- **Trace Reference** — load any image and algorithmically resize it to pixel art at your canvas resolution (nearest-neighbor, zero API tokens)
- **Extract Palette** — pull the top 8 dominant colors from a reference image into your palette
- **Style enforcement** — automatic palette reduction (6 colors) + outline detection after generation, with artist toggle

### Export
- **Export panel** — generates optimized `pxAt()` code using a greedy rectangle scan algorithm
- **Copy to clipboard** — one click to paste sprite code into your game project
- **Save PNG** — export the sprite at 1× game pixels
- **Windows installer** — NSIS installer + portable exe via `npm run build`

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- An [Anthropic API key](https://console.anthropic.com/)

### Installation

```bash
git clone https://github.com/EitanB91/PixelArtTool.git
cd PixelArtTool
npm install
```

### Configuration

Create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

The API key stays in the main process and never reaches the renderer. See [Security](#security).

### Run

```bash
npm start
```

---

## Usage

### Generate from text

1. Type a description in the **AI GENERATE** panel (e.g. `red mushroom with white spots`)
2. Set your canvas size using W/H inputs or the **preset dropdown** in the top bar
3. Click **Generate** — the sprite is painted onto the canvas and style-enforced automatically (palette reduction + outline detection)

> **Best for:** simple objects (mushrooms, coins, gems, flames, trees, weapons). For complex characters with limbs and faces, use the Trace workflow below.

### Trace a reference image

1. Click **Load Image** in the **REFERENCE** panel and select a PNG/JPEG/GIF
2. (Optional) Click **Extract Palette** to pull the dominant colors into your palette
3. Click **Trace** — the reference is algorithmically resized to your canvas dimensions using nearest-neighbor interpolation
4. Adjust pixels manually as needed

### Export

1. Set a function name in the **EXPORT CODE** panel (default: `_drawSprite`)
2. Click **Generate pxAt() Code** — the sprite is converted using a greedy rectangle algorithm
3. Click **Copy to Clipboard** — paste directly into your game's sprite file

For full usage details, see [docs/USAGE.md](docs/USAGE.md).

---

## Architecture

```
src/
├── main.js              — Electron main process: IPC, file system, Claude API calls
├── preload.js           — IPC bridge (contextBridge)
├── index.html           — Renderer entry point
├── app.js               — UI orchestration, AppState, button wiring
├── core/
│   ├── canvas.js        — Pixel art canvas: draw, zoom, history
│   ├── palette.js       — Color palette management (max 8 colors)
│   └── history.js       — 50-step undo/redo stack
├── ai/
│   ├── client.js        — IPC wrapper (key stays in main process)
│   ├── generate.js      — AI generation + reference trace
│   └── enforce.js       — Palette reduction + outline detection
├── ui/
│   ├── toolbar.js       — Tool selection, zoom, canvas size, presets
│   ├── palette-panel.js — Color swatches, picker, add/remove
│   ├── reference-panel.js — Load image, extract palette, trace
│   └── output-panel.js  — Export code, copy, save PNG
├── export/
│   └── exporter.js      — pxAt() code generator (greedy rect algorithm)
└── styles/
    └── main.css         — Dark theme, CSS variables
tools/
├── png2sprite.js        — Standalone PNG → pxAt() converter (shareable)
└── generate-icon.js     — App icon generation
```

For the full architecture deep-dive (IPC channels, state flow, data pipelines), see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Key conventions

- **IPC security**: all `fs` operations and API calls happen in `main.js`. The renderer never touches the file system or the API key directly.
- **State**: a single `AppState` object in `app.js` — no framework.
- **Canvas scale**: ZOOM factor is display-only. Export always at 1× game pixels.
- **Module pattern**: IIFE modules throughout — matches the game project codebase philosophy.

---

## Security

- API key is loaded from `.env` in the main process only
- `contextIsolation: true` + `nodeIntegration: false` — renderer is fully sandboxed
- The raw key string never crosses the IPC bridge
- `.env` is in `.gitignore` and never committed
- CSP headers restrict script/style/image sources

---

## CLI Converter

Convert any PNG directly to `pxAt()` code without opening the app:

```bash
npm run convert -- input.png [--name <funcName>] [--loff] [--bg auto|#RRGGBB]
```

| Option | Description |
|--------|-------------|
| `--name <name>` | Function name (default: `_drawSprite`) |
| `--loff` | Adds `lOff` parameter to function signature |
| `--bg auto` | Treats top-left pixel color as background (skip) |
| `--bg #RRGGBB` | Treats specific hex color as background (skip) |

Output is printed to stdout — pipe or paste into your game project.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Launch the Electron app |
| `npm run dev` | Launch with DevTools open |
| `npm test` | Run Jest unit tests (42 tests) |
| `npm run convert` | Run png2sprite.js CLI converter |
| `npm run build` | Package app with electron-builder (Windows) |

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/USAGE.md](docs/USAGE.md) | Full user guide — all tools, workflows, keyboard shortcuts, tips |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Module map, IPC channels, state flow, data pipelines, API config |
| [ROADMAP.md](ROADMAP.md) | Project roadmap, phase plan, feature registry |

---

## License

MIT
