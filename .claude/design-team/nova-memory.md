# Nova — Design Memory: Pixel Art Tool

## Project Purpose
Standalone desktop app (Electron) to accelerate sprite production for game projects.
Pipeline: description + reference image → AI generation → style enforcement → PNG → pxAt() code.

## Tech Stack Decisions
- **Electron** — desktop app, native file system access, no CORS for Claude API calls
- **Vanilla JS + Canvas API** — no framework overhead, matches game project philosophy
- **@anthropic-ai/sdk** — Claude API for AI-assisted generation and style enforcement
- **pngjs** — PNG read/write (same library as png2sprite.js)
- API key stored in `.env`, passed to renderer via IPC (never exposed in renderer code)

## Core Tool Features (planned)
1. **Drawing canvas** — configurable zoom (default 8×), pencil/eraser/fill/eyedropper tools
2. **Reference panel** — display reference image side-by-side with drawing canvas
3. **AI generation** — text prompt + optional reference → Claude generates sprite description →
   tool interprets into pixel art (or Claude Vision directly colors a grid)
4. **Style enforcement** — palette reducer (max 6 colors), outline detector
5. **Export panel** — runs png2sprite.js logic, shows pxAt() code, copy-to-clipboard button
6. **Undo/redo** — 50-step history stack

## UI Design Principles
- Dark theme (eye strain reduction for long sessions)
- Main layout: [Toolbar | Drawing Canvas | Reference Panel | Export Panel]
- Drawing canvas is the largest element — everything else is secondary
- Keyboard shortcuts for all tools (B=brush, E=eraser, G=fill, I=eyedropper, Z=undo)

## Integration with Game Projects
- `tools/png2sprite.js` is shared — copy to any game project's `tools/` directory
- Output format: `pxAt(ctx, bx, by, gx, gy, '#RRGGBB', w, h)` calls inside a named function
- Sprite dimensions must match game's pixel grid (Ages of War: player=16×22, enemies vary)

## Pending Work
- [ ] Core drawing canvas with zoom
- [ ] Palette panel (6-color swatch)
- [ ] Reference image loader
- [ ] Claude API integration (generation mode)
- [ ] Style enforcement (palette reduction pass)
- [ ] Export / copy-to-clipboard
- [ ] Electron IPC wiring (file open/save)

## What Hasn't Been Built Yet
Everything — project scaffolded 2026-03-13. Implementation starts next session.
