# Orchestrator — Working Memory

## Current Project
**Pixel Art Tool** — v0.2.0 shipped. O6 Animation sprint in progress. O6-5 complete, O6-6 next.
**Studio vision confirmed (2026-04-02):** indie game dev studio, Godot, Game One = linear action-platformer.

## Active Phase
**O6-6 Full QA Gate + Release — NEXT (as of 2026-04-03)**
- O6-5 Export & Integration complete — Director live-tested, zero comments, Viktor PASS WITH NOTES (A1+A2 resolved)
- O6-6 is the final phase: Viktor full pipeline, state persistence (6.1b), final live test, memory updates, v0.3.0-animation tag

## Completed: O6-5 Export & Integration — 2026-04-03
- Refactored `exporter.js`: extracted `_toHex` and `_generateFromPixels` as shared core
- `Exporter.generateMultiFrame(baseName, useLoff, frames, w, h)`: N frames → `baseName_f0`, `_f1`... with `// Frame N` headers
- 1-frame special case: no `_f0` suffix (Viktor V9)
- `Exporter.toSpritesheetBase64(frames, w, h)`: horizontal strip compositor via offscreen canvas
- Empty-array guards on both new methods (Viktor A2)
- `OutputPanel` rewritten for dual-mode: `updateMode(isAnim)` switches title, buttons, hint, placeholder
- Flash timer race fix: `_saveTimer` + `_copyTimer` cleared on mode switch (Viktor A1)
- `AnimationPanel.show()`/`hide()` calls `OutputPanel.updateMode()`
- HTML: added `id="export-panel-title"`, `id="func-name-label"`, hint div `id="func-name-hint"`
- Reuses existing `save-png` and `copy-to-clipboard` IPC — no new channels
- `animation-export.test.js`: 10 new tests (multi-frame naming, 1-frame, lOff, empty frame, spritesheet math)
- 137 tests passing, 10 suites, zero failures
- Viktor QA: PASS WITH NOTES — A1 (save button label race) + A2 (empty array guard) — both resolved
- Director live demo: all exit criteria met, zero comments

## Completed: Pre-Named Regions (D2) — 2026-04-02
- Replaced free-form `+ New Region` button with `<select id="region-preset">` dropdown
- 6 presets: head, torso, left-arm, right-arm, left-leg, right-leg
- Custom escape hatch: greyed out for now (`prompt()` doesn't fire in Electron renderer) — future discussion
- `_syncPresetDropdown()`: disables used names, re-enables on remove
- Preset regions get static labels, custom regions get editable inputs
- Overlay opacity: 50% → ~24% (hex `80` → `3D`)
- Viktor QA: PASS WITH NOTES — 4 advisory items, all resolved

## Completed: PW-3 — Editor-to-Preview Sync + Polish (pushed 2026-04-02, commit 80fae58)
- Full editor-to-preview sync, bidirectional FPS, throttled push
- Viktor QA: PASS WITH NOTES — B1+A1+A2 all resolved

## O6 Animation Sprint Status
- O6-1 through O6-5: COMPLETE
- O6-6 (Full QA Gate + Release): NEXT
- Preview Window (PW evolution): PW-1 through PW-3 complete

## Key Decisions On Record
- AI generation scoped to simple sprites; complex characters use Trace Reference (Option F post-MVP)
- png2sprite.js remains self-contained — no new imports
- All file system ops through IPC in main.js — renderer never touches `fs` directly
- Viktor gates all pushes; no code goes to git without his verdict + Director approval
- V&V team (Silas) created 2026-03-17 — owns budget tracking, resource allocation, usage monitoring
- API budget model: Remaining Balance goes down, Floor is untouchable, Usable Budget is the monthly cap
- At floor: ONLY the Director can authorize API usage — no agent override
- Monitoring: Option A (4 layers — hooks + bookends + cron + on-demand)
- Silas Scale for spoken reports; budget-ledger.json always has real numbers
- **O6 history model: Option A — per-frame undo. `makeHistory()` factory in history.js.**
- **External pixel mutators (generate.js, enforce.js) call `PixelCanvas.pushToHistory()` — never the global `History` singleton.**
- **O6-2 UI: tabs in topbar (not separate row), frame strip + playback in bottom bar, animation panel at top of right panels**
- **O6-3 pose generators: region-based (by name lookup) with no-region fallbacks.**
- **Preview window is self-contained: own HTML/CSS/JS, own preload, no shared renderer modules.**
- **IPC namespace: `preview:*` for editor→preview, `editor:*` for preview→editor reverse relay.**
- **Preview is read-only: never writes to frame data. One-way data push from editor.**
- **Director complimented Nova's preview design (2026-04-01) — keep that layout direction.**
- **Export: 1-frame animation uses base name only (no _f0 suffix) — Viktor V9.**

## Environment Issue (Pre-existing)
- `ELECTRON_RUN_AS_NODE=1` is set in Claude Code's shell environment, which prevents Electron from launching as a desktop app. Must `unset ELECTRON_RUN_AS_NODE` before `npm start`. Not a code issue — environment-level.

## O6-3 Lessons Learned
- **CSS `.tool-btn.anim-only { display: none }` trap:** Must use explicit `style.display = 'flex'`, never empty string.
- **Performance during drag operations:** `refreshRegionOnly()` — lightweight path for per-pixel ops.
- **Shift engine design:** Read-clear-write three-phase approach. D12 depth ordering deferred to Sprint 2.

## QA History
- Phase 3: 42 unit tests passing — PASS
- Phase 5: docs complete — PASS
- Phase 6 (O1–O3, O5): feature complete — PASS
- Phase O6-1: 87 tests — PASS WITH NOTES
- Phase O6-2: 87 tests — PASS WITH NOTES
- Phase O6-3: 127 tests — PASS WITH NOTES
- Phase O6-4: 127 tests — PASS WITH NOTES
- Phase PW-1/PW-2: 127 tests — smoke check PASS
- Phase PW-3: 127 tests — Viktor PASS WITH NOTES
- Pre-Named Regions (D2): 127 tests — Viktor PASS WITH NOTES
- **Phase O6-5: 137 tests — Viktor PASS WITH NOTES (A1 label race + A2 empty guard — both resolved)**

## Session Bookend Duty (V&V Layer 2)
- At session start: read `budget-ledger.json`, give Director 1-line V&V status
- At session end: append session summary to `usage-log.jsonl` (actors, categories, duration)

## Team Meeting Decisions (2026-04-02)
| # | Decision |
|---|----------|
| D1 | PixelArtTool stays alive, continues development with roadmap tweaks |
| D2 | Pre-named regions — ASAP, must live test with preview before proceeding |
| D3 | Tech stack stays JS/Electron |
| D4 | Game One: linear action-platformer, dark/slight-fantasy, 8-12 levels, mixed-size sprites (32×32 base, 48-64 key chars) |
| D5 | PW-3 pushed |

## Open Items
- **O6-6: Full QA Gate + Release — NEXT**
- **O6-6 Activity 6.1b: Persist animation state across tab switches (Option A)**
- Custom region escape hatch — greyed out, `prompt()` broken in Electron renderer, future discussion
- D12: depth ordering deferred to Sprint 2 (not needed for platformer side-view)
- D13: background fill uses transparent/bg color (industry standard)
- O4 (AI style transfer) — deferred, post-MVP
- Option F (complex character generation) — deferred, post-MVP
- **Carry-forward (low priority, not blocking):**
  - A10: greedy rect algorithm duplicated in `exporter.js` + `png2sprite.js` — deferred to O7
  - P3-A2: eyedropper pushes unnecessary history entry — code comment, deferred
  - P3-A3: `trace-reference` IPC handler has no `try/catch` — raw pngjs error reaches user
  - O6-2-A2: Next-frame and Play buttons use same `▶` glyph — cosmetic, future polish

## Plans Directory
All plan and roadmap files live in `plans/` at project root.

| File | Description |
|------|-------------|
| `plans/ROADMAP-FULL.md` | Full project roadmap (all phases 0–7, feature registry) |
| `plans/PLAN-O6-ANIMATION-SPRINT.md` | O6 animation sprint — full roadmap (active, approved 2026-03-18) |
| `plans/PLAN-O6-ANIMATION-SPRINT-EARLY-DRAFT.md` | O6 sprint — earlier planning draft |
| `plans/PLAN-MVP-V010-DRAFT.md` | Original MVP v0.1.0 plan (early draft) |
| `plans/PLAN-SPRITE-PIPELINE.md` | Sprite pipeline / png2sprite.js Path B plan |
| `plans/PLAN-NOVA-BOOTSTRAP.md` | Nova design team bootstrap + full-window canvas plan |
| `plans/PLAN-PREVIEW-WINDOW.md` | Preview Window Evolution 1 workplan (PW-1 through PW-3) |
| `plans/MEETING-PW3-REVIEW.md` | Team meeting agenda — Director live test review, 4 UX concerns, roadmap direction |

## Notes
_Update this file at session compaction and at every phase transition._
