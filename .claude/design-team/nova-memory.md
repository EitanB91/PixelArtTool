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

## Build Status (updated 2026-03-14)
- [x] Core drawing canvas with zoom (pencil, eraser, fill, eyedropper)
- [x] Palette panel (6-color swatch, max 8, add/remove)
- [x] Reference image loader (side panel, base64 display)
- [x] Claude API integration — `client.js` complete, `generate.js` partial (static prompt, no JSON validation)
- [x] Export / copy-to-clipboard (`exporter.js` — greedy rect algorithm, pxAt() output)
- [x] Electron IPC wiring (open-image, save-png, copy-to-clipboard, get-api-key)
- [x] Undo/redo 50-step history
- [ ] Style enforcement — `enforce.js` not yet created (Phase 1 MVP)
- [ ] AI generation quality — system prompt enhancement + JSON hardening (Phase 2 MVP)
- [ ] Unit tests — `tests/` empty (Phase 3 MVP)

## Decided: Phase 2 — AI Generation Quality Approach
**Split authorship (Approach C).** Nova writes the artistic vision section of the system prompt (silhouette discipline, palette philosophy, what quality means). Orchestrator writes the output format section (JSON schema, one-shot example). Nova reviews the combined prompt before it ships — specifically to verify the tone seam between the two sections is seamless.
Approved by Director 2026-03-14.

## Decided: enforce.js UX
**Auto-enforce after generation, with artist toggle to disable.**
Approved by Director 2026-03-14. No manual button needed — the tool does the right thing by default.
