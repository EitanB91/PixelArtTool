# Nova — Design Memory: Pixel Art Tool

## Project Purpose
Standalone desktop app (Electron) to accelerate sprite production for game projects.
Pipeline: description + reference image → AI generation / Trace → style enforcement → PNG → pxAt() code.

## Tech Stack Decisions
- **Electron** — desktop app, native file system access, API calls in main process
- **Vanilla JS + Canvas API** — no framework overhead, matches game project philosophy
- **Anthropic API via fetch()** — Claude Sonnet 4.6 for AI generation (key stays in main.js)
- **pngjs + nativeImage** — PNG decode/resize for Trace Reference feature
- API key stored in `.env`, never exposed in renderer

## Build Status (updated 2026-03-14)
- [x] Core drawing canvas with zoom (pencil, eraser, fill, eyedropper)
- [x] Palette panel (6-color swatch, max 8, add/remove, UI feedback at cap)
- [x] Reference image panel — CSP fixed (img-src data:), jpg→jpeg mime fix, clearReference()
- [x] Claude API integration — full IPC chain, system prompt, fence-stripping, schema validation
- [x] Export / copy-to-clipboard (exporter.js — greedy rect algorithm, pxAt() output)
- [x] Electron IPC wiring (open-image, save-png, copy-to-clipboard, check-api-key, call-claude, trace-reference)
- [x] Undo/redo 50-step history
- [x] Style enforcement — enforce.js complete (palette reduction, auto-enforce with toggle)
- [x] AI generation quality — combined system prompt (Nova artistic + Orchestrator format) + chain-of-thought planning
- [x] Trace Reference — algorithmic nearest-neighbor resize via nativeImage+pngjs, auto-size to native dims
- [x] Unit tests — 42 tests passing (palette, history, exporter, enforce) ✅ Phase 3 complete

## Core Tool Features — Final MVP Shape
1. **Drawing canvas** — zoom 2×–24×, pencil/eraser/fill/eyedropper, 50-step undo/redo
2. **Reference panel** — load PNG/JPEG/GIF, display side-by-side, Trace button
3. **Trace Reference** — algorithmic resize to native dimensions (clamped 128×128), no palette enforcement (preserves fidelity)
4. **AI generation** — text prompt → Claude Sonnet → chain-of-thought plan → JSON grid → canvas. Auto-enforce after generation.
5. **Style enforcement** — auto palette reduction to 6 colors, artist toggle, undo-able
6. **Export panel** — pxAt() code, copy-to-clipboard, save PNG

## UI Design Principles
- Dark theme (eye strain reduction for long sessions)
- Main layout: [Toolbar | Drawing Canvas | Right Panels (Palette / Reference / AI / Export)]
- Drawing canvas is the largest element — everything else is secondary
- Keyboard shortcuts: B=pencil, E=eraser, G=fill, I=eyedropper, Z=undo, Y=redo

## Integration with Game Projects
- `tools/png2sprite.js` is shared — copy to any game project's `tools/` directory
- Output format: `pxAt(ctx, bx, by, gx, gy, '#RRGGBB', w, h)` calls inside a named function
- Sprite dimensions: Ages of War player=16×22, enemies vary

## Decided: AI Generation Scope (2026-03-14)
**AI generation is MVP-ready for simple sprites only.**
- ✅ Works well: simple objects, geometric shapes (mushroom, coin, gem, flame, tree)
- ❌ Fails: complex characters (humans, warriors, creatures with limbs/weapons)
- For complex characters: **Trace Reference is the recommended workflow**
- Option F (text → image generation API → Trace) is on the post-MVP roadmap when funding allows

## Decided: Chain-of-Thought Prompt (2026-03-14)
System prompt now requires model to write a sprite plan (region-by-row breakdown) before outputting JSON.
Improved mushroom quality to game-asset level. Did not fix complex character generation — confirmed ceiling.
Approved implicitly by Director during live test session.

## Decided: Phase 2 — AI Generation Quality Approach
**Split authorship (Approach C) + chain-of-thought.** Nova wrote artistic vision section, Orchestrator wrote output format + planning step. Combined prompt live and tested.
Approved by Director 2026-03-14.

## Decided: enforce.js UX
**Auto-enforce after AI generation, with artist toggle to disable. Trace skips enforce entirely.**
Approved by Director 2026-03-14.

## Decided: Phase 6 Feature Designs (2026-03-15) — all approved by Director

### O1 — Outline Detection
- Runs inside `enforce()` after `reduce()`, same artist toggle — no new UI
- Boundary pixel = opaque pixel with ≥1 transparent neighbor → set to `palette[0]`
- Only runs after reduce() so outline uses final palette
- Status: appends `· outline applied` when pixels changed
- Approved 2026-03-15

### O2 — Dimension Presets
- `<select>` dropdown in topbar, right after H input
- Presets: Custom | 16×22 (player) | 16×16 | 8×8 | 32×32 | 64×64
- Selecting preset → sets W+H inputs → triggers resize; manual edit → snaps to Custom
- Approved 2026-03-15

### O3 — Auto-Palette Extraction
- "Extract Palette" button in reference panel, full-width row above Load/Trace row
- Disabled when no reference loaded
- On click: IPC `extract-palette` → nativeImage+pngjs → top N (max 8) colors by frequency → replaces palette
- Status note: `"Extracted N colors from reference"`
- Explicit action only — does NOT auto-run on image load
- Approved 2026-03-15

### O5 — Distribution Package
- electron-builder config for Windows (NSIS installer + portable)
- No UI decisions needed
- Approved 2026-03-15

## Pending Work
- ~~Phase 3: Unit tests~~ ✅ Done
- ~~Phase 3: Convention hardening~~ ✅ Done
- ~~Phase 4: MVP QA gate~~ ✅ Done — v0.1.0-mvp tagged + pushed 2026-03-15
- Phase 5: Docs (USAGE.md, ARCHITECTURE.md) — deferred, Director moved straight to Phase 6
- **Phase 6 (IN PROGRESS):** O1 ✅ designed | O2 ✅ designed | O3 ✅ designed | O5 ✅ designed — implementing
- Post-MVP: Option F (image generation API → Trace pipeline)
- Post-v0.2.0: O6 Animation frames sprint (Director confirmed as next major sprint)
