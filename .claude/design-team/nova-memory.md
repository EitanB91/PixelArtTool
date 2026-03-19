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

## Build Status (updated 2026-03-18 — O6-2 complete)
- [x] Core drawing canvas with zoom (pencil, eraser, fill, eyedropper)
- [x] Palette panel (6-color swatch, max 8, add/remove, UI feedback at cap)
- [x] Reference image panel — CSP fixed (img-src data:), jpg→jpeg mime fix, clearReference()
- [x] Claude API integration — full IPC chain, system prompt, fence-stripping, schema validation
- [x] Export / copy-to-clipboard (exporter.js — greedy rect algorithm, pxAt() output)
- [x] Electron IPC wiring (open-image, save-png, copy-to-clipboard, check-api-key, call-claude, trace-reference, extract-palette)
- [x] Undo/redo 50-step history
- [x] Style enforcement — enforce.js complete (palette reduction + outline detection, auto-enforce with toggle)
- [x] AI generation quality — combined system prompt (Nova artistic + Orchestrator format) + chain-of-thought planning
- [x] Trace Reference — algorithmic nearest-neighbor resize via nativeImage+pngjs, auto-size to native dims
- [x] Unit tests — 87 tests passing (palette, history, exporter, enforce, animation-frames, animation-regions) ✅
- [x] O1 — Outline detection — boundary pixels → darkest palette color, runs inside enforce()
- [x] O2 — Dimension presets — topbar dropdown (16×22, 16×16, 8×8, 32×32, 64×64)
- [x] O3 — Extract Palette — reference panel button, top-8 colors by frequency
- [x] O5 — Windows distribution — electron-builder NSIS + portable, icon generated via tools/generate-icon.js
- [x] **O6-1 — Architecture & Data Model** — AnimFrames, AnimRegions, PoseTemplates, Timeline, AnimationPanel stubs
- [x] **O6-2 — UI Shell** — Animation tab, bottom bar, pose chips, region panel, canvas layering

## Core Tool Features — v0.2.0 Shape
1. **Drawing canvas** — zoom 2×–24×, pencil/eraser/fill/eyedropper, 50-step undo/redo
2. **Reference panel** — load PNG/JPEG/GIF, display side-by-side, Trace + Extract Palette buttons
3. **Trace Reference** — algorithmic resize to native dimensions (clamped 128×128), no palette enforcement
4. **Extract Palette** — pulls top-8 dominant colors from reference image into palette
5. **AI generation** — text prompt → Claude Sonnet → chain-of-thought plan → JSON grid → canvas. Auto-enforce after generation.
6. **Style enforcement** — palette reduction (6 colors) + outline detection, artist toggle, undo-able
7. **Export panel** — pxAt() code, copy-to-clipboard, save PNG
8. **Dimension presets** — quick-select common sprite sizes from topbar dropdown
9. **Windows installer** — `npm run build` → NSIS installer + portable exe

## UI Design Principles
- Dark theme (eye strain reduction for long sessions)
- Main layout: [Toolbar | Drawing Canvas | Right Panels (Palette / Reference / AI / Export)]
- Drawing canvas is the largest element — everything else is secondary
- Keyboard shortcuts: B=pencil, E=eraser, G=fill, I=eyedropper, Z=undo, Y=redo

## O6-2 Animation UI Decisions (2026-03-18) — approved by Director
- **Tab bar:** Sprite | Animation tabs inside topbar (not a separate row — saves vertical space)
- **Animation panel:** top of right panels, visible only in Animation mode
  - Pose template picker: Character Poses (Idle/Walk/Jump) + Object/Effect (Rotation/Pulse/Flicker) as rounded chips
  - Onion skin toggle checkbox
  - Region panel: list + "New Region" button
  - Background fill: transparent checkbox + color swatch
- **Bottom bar:** playback controls (prev/play/next, FPS selector, frame counter) + scrollable frame strip with thumbnails + add-frame button
- **Canvas layering:** onion canvas (z:1, behind) → draw canvas (z:2) → region overlay (z:3, on top)
- **Region paint tool:** new toolbar button (▓), hidden in Sprite mode, visible+disabled in Animation mode for sprites < 24×24
- **Layout adjustment:** `#app.anim-mode #main-layout` shrinks height to accommodate 64px bottom bar
- **Future polish:** A2 — next-frame and play buttons both use `▶` glyph. Play is differentiated by larger size + accent border. May revisit with proper icon assets.

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

## O6 Animation Sprint — Planning Complete (2026-03-15)

Full meeting summary: `.claude/projects/c--Users-user-Desktop-Ai-Claude-PixelArtTool/memory/reference_o6_meeting_summary.md`

**Nova's approved proposals:**
- Single animation mode (no character/non-character sub-modes)
- Pose template picker with two categories: Character Poses (Idle, Walk, Jump) + Object/Effect Poses (Rotation, Pulse, Flicker)
- Region tools gated by sprite size (24×24+), not by category
- Onion skinning, frame strip, Play/Pause with FPS control
- Below 24×24: region tools grayed out with tooltip

## Pending Work
- ~~Phase 3: Unit tests~~ ✅ Done
- ~~Phase 3: Convention hardening~~ ✅ Done
- ~~Phase 4: MVP QA gate~~ ✅ Done — v0.1.0-mvp pushed 2026-03-15
- ~~Phase 6: O1+O2+O3+O5~~ ✅ Done — v0.2.0 pushed 2026-03-15
- ~~Phase 5: Docs~~ ✅ Complete 2026-03-15
- ~~O6-1: Architecture~~ ✅ Complete 2026-03-18
- ~~O6-2: UI Shell~~ ✅ Complete 2026-03-18
- **NEXT: O6-3 — Region Tools** (Nova wires region panel UI: add/remove, color picker, shift controls)
- Post-O6: Option F (image generation API → Trace pipeline, pending Director funding)
