# Pixel Art Tool

An AI-assisted standalone desktop application for generating pixel art sprites and exporting them as paste-ready `pxAt()` code for game engines.

Built with Electron + Claude AI. Designed for the sprite production pipeline in retro arcade games (e.g. *Ages of War*).

---

## Pipeline

```
description / reference image
        ↓
  Claude AI (Sonnet)
        ↓
  style enforcement
  (palette reduction)
        ↓
   PNG export
        ↓
  png2sprite.js
        ↓
paste-ready pxAt() code
```

---

## Features

- **Drawing canvas** — pencil, eraser, fill bucket, eyedropper with configurable zoom (2×–24×)
- **AI sprite generation** — describe a sprite in plain text; Claude generates it directly onto the canvas
- **Trace Reference** — load any image and algorithmically resize + quantize it to pixel art at your canvas resolution (nearest-neighbor, zero API tokens)
- **Style enforcement** — automatic palette reduction to 6 colors after generation, with artist toggle
- **Reference panel** — load a reference image side-by-side to guide generation or tracing
- **Export panel** — generates optimized `pxAt()` code using a greedy rectangle scan algorithm
- **Copy to clipboard** — one click to paste sprite code into your game project
- **Save PNG** — export the sprite at 1× game pixels
- **Undo/redo** — 50-step history stack (Ctrl+Z / Ctrl+Y)
- **Keyboard shortcuts** — B (pencil), E (eraser), G (fill), I (eyedropper)

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

1. Type a description in the **AI GENERATE** panel (e.g. `stone age cave dweller, side view, holding club`)
2. Set your canvas size (W / H in the top bar)
3. Click **Generate** — the sprite is painted onto the canvas and palette-enforced automatically

### Trace a reference image

1. Click **Load Image** in the **REFERENCE** panel and select a PNG/JPEG/GIF
2. Click **Trace** — the reference image is algorithmically resized to your canvas dimensions using nearest-neighbor interpolation, then palette-reduced to 6 colors
3. Adjust pixels manually as needed

### Export

1. Set a function name in the **EXPORT CODE** panel (default: `_drawSprite`)
2. Click **Generate pxAt() Code** — the sprite is converted using a greedy rectangle algorithm
3. Click **Copy to Clipboard** — paste directly into your game's sprite file

---

## Architecture

```
src/
├── main.js              — Electron main process: IPC, file system, Claude API calls
├── index.html           — Renderer entry point
├── app.js               — UI orchestration, AppState, button wiring
├── core/
│   ├── canvas.js        — Pixel art canvas: draw, zoom, history
│   ├── palette.js       — Color palette management
│   └── history.js       — 50-step undo/redo stack
├── ai/
│   ├── client.js        — IPC wrapper (key stays in main process)
│   ├── generate.js      — AI generation + reference trace
│   └── enforce.js       — Palette reduction, outline detection (stub)
├── ui/
│   ├── toolbar.js
│   ├── palette-panel.js
│   ├── reference-panel.js
│   └── output-panel.js
├── export/
│   └── exporter.js      — pxAt() code generator (greedy rect algorithm)
└── styles/
    └── main.css
tools/
└── png2sprite.js        — Standalone PNG → pxAt() converter (shareable)
```

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

---

## CLI Converter

Convert any PNG directly to `pxAt()` code without opening the app:

```bash
npm run convert -- input.png MySprite
```

Output is printed to stdout — paste into your game project.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Launch the Electron app |
| `npm test` | Run Jest unit tests |
| `npm run convert` | Run png2sprite.js CLI converter |
| `npm run build` | Package app with electron-builder |

---

## License

MIT
