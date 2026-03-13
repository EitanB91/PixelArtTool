# CLAUDE.md — Pixel Art Tool

AI-assisted standalone desktop application for generating pixel art sprites and exporting them as `pxAt()` code for game engines.

## Project Vision

**Pipeline:** description / reference image → AI generation (Claude Vision) → style enforcement → PNG export → `png2sprite.js` → paste-ready game code

This tool is the dedicated bridge between artistic intent and the `fillRect` sprite engine used in the director's games (e.g., Ages of War).

## Running

```bash
npm install
npm start        # launch Electron app
npm run convert  # run png2sprite.js CLI directly
```

## Architecture

```
src/
├── main.js          — Electron main process (window, IPC, file system)
├── index.html       — renderer entry point
├── app.js           — renderer: UI orchestration, state machine
├── core/
│   ├── canvas.js    — pixel art canvas: draw, undo, palette, zoom
│   ├── palette.js   — color palette management
│   └── history.js   — undo/redo stack
├── ai/
│   ├── client.js    — Anthropic SDK wrapper
│   ├── generate.js  — sprite generation from text + reference
│   └── enforce.js   — style enforcement (palette reduction, outline detection)
├── ui/
│   ├── toolbar.js   — tool selector (pencil, fill, eraser, eyedropper)
│   ├── palette-panel.js
│   ├── reference-panel.js  — shows reference image side by side
│   └── output-panel.js     — preview pxAt() code output
├── export/
│   └── exporter.js  — wraps png2sprite.js, copies output to clipboard
└── styles/
    └── main.css
tools/
└── png2sprite.js    — PNG → pxAt() code converter (shared with game projects)
tests/
```

## Key Conventions

- **Electron IPC**: all file system operations happen in `main.js` via `ipcMain`/`ipcRenderer`. The renderer never uses `fs` directly.
- **State**: app state lives in a plain `appState` object in `app.js` — no framework.
- **Canvas pixel scale**: the drawing canvas uses a configurable `ZOOM` factor (default 8× for comfortable drawing). Export always at 1× game pixels.
- **API key**: stored in `.env` (never committed). Loaded in `main.js` and passed to renderer via IPC.
- **png2sprite.js is the bridge**: this file is shared/copied across game projects. Keep it self-contained (no imports beyond `pngjs` and `fs`).

## Nova (Design Lead)

Nova manages all visual decisions for this tool. Her files:
- Identity: `.claude/design-team/nova-identity.md`
- Memory: `.claude/design-team/nova-memory.md`

When starting a design session, invoke `/nova` to load Nova into context.

## Git

```bash
git add <specific files>
git commit -m "feat: description"
git push
```

Commit prefixes: `feat:` `fix:` `refactor:` `chore:`
