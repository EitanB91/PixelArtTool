# Orchestrator — Working Memory

## Current Project
**Pixel Art Tool** — v0.2.0 shipped. O6 Animation sprint in progress. Preview Window evolution in progress.
**Phase PW-3 code complete (2026-04-01).** Pending: Viktor full QA pipeline + Director live demo.

## Active Phase
**PW-3 — Editor-to-Preview Sync + Polish — CODE COMPLETE (2026-04-01)**
- `_pushToPreview()`: serializes all frames as plain Arrays, sends via `pushFramesToPreview` IPC
- `_pushActiveToPreview(idx)`: lightweight single-frame push with 100ms throttle (trailing push ensures final state)
- `_clearPreview()`: sends empty frames on animation mode exit → preview shows "No animation" message
- Hooked into: `syncAfterDraw()` (draw strokes), `_navigateToFrame()` (frame nav), `_applyTemplate()` (template apply), `show()` (mode enter), `hide()` (mode exit), `btn-add-frame` (add frame)
- Bidirectional FPS sync: editor `fpsSelect` → `preview:set-fps` → preview. Preview FPS select → `preview:fps-changed` → editor `fpsSelect` + `Timeline.setFps()`. Loop guard via `_syncingFps` flag in both windows.
- Preview FPS display upgraded from static `<span>` to `<select>` dropdown (2/4/6/8/12 fps options)
- Edge cases handled: preview opened before anim mode (shows message), preview closed mid-edit (IPC silently no-ops via main.js guard), rapid draw throttle (100ms min interval + trailing push)
- CSS: styled `#preview-fps-select` with dark theme, hover/focus accent border
- 127 tests passing, zero regressions
- App launches clean, no JS errors

**Viktor QA: PASS WITH NOTES (2026-04-02)**
- B1: FPS option mismatch editor vs preview — FIXED (both now `1,2,4,6,8,12`)
- A1: Double IPC push in btn-add-frame / _applyTemplate — FIXED (`skipPreviewPush` param)
- A2: Dangling throttle timer on mode exit — FIXED (cleared in `hide()`)
- All findings resolved and re-verified by Viktor. 127 tests green.

**Director live demo (2026-04-02): 4 concerns raised — push HELD pending team meeting.**
1. Preview button UX confusion (message before anim mode)
2. Separate window feels disconnected — consider docked panel
3. Static sprite during playback — no movement without named regions (UX gap, not code bug)
4. Region overlay appears to replace pixels visually (possible rendering bug) + no region undo

**Decision: Option C — pause, assemble full team next session for design review.**
**Meeting agenda saved: `plans/MEETING-PW3-REVIEW.md`**
**Git push NOT approved — waiting on team meeting outcome.**

## O6 Animation Sprint Status
- O6-1 through O6-4: COMPLETE
- O6-4 Director live test (Activity 4.21): still pending
- O6-5 (Export & Integration): pending — after Director approval
- Preview Window (PW evolution): PW-1 complete, PW-2 complete, PW-3 complete (Viktor PASS WITH NOTES)

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
- **O6-3 pose generators: region-based (by name lookup) with no-region fallbacks. Character poses look for 'head', 'torso', 'left-arm', 'right-arm', 'left-leg', 'right-leg'. Object poses (rotation, pulse, flicker) don't use regions.**
- **Preview window is self-contained: own HTML/CSS/JS, own preload, no shared renderer modules.**
- **IPC namespace: `preview:*` for editor→preview, `editor:*` for preview→editor reverse relay.**
- **Preview is read-only: never writes to frame data. One-way data push from editor.**
- **Director complimented Nova's preview design (2026-04-01) — keep that layout direction.**

## Environment Issue (Pre-existing)
- `ELECTRON_RUN_AS_NODE=1` is set in Claude Code's shell environment, which prevents Electron from launching as a desktop app. Must `unset ELECTRON_RUN_AS_NODE` before `npm start`. Not a code issue — environment-level.

## O6-3 Lessons Learned
- **CSS `.tool-btn.anim-only { display: none }` trap:** This CSS rule hides the region-paint button by default. Any code that makes it visible MUST use explicit `style.display = 'flex'`, never empty string. This bit us in O6-2 (B1) and again in O6-3 (B1 regression). Viktor's warning: "first time is accident, second time is coincidence, third time is enemy action." **Always check display property when toggling `.anim-only` elements.**
- **Performance during drag operations:** Calling full `refresh()` per pixel during region-paint drag was too expensive (rebuilds frame strip DOM). Solution: `refreshRegionOnly()` — lightweight path that only updates overlay + region list. Apply this pattern to any future per-pixel operation in animation mode.
- **Shift engine design:** Read-clear-write three-phase approach works cleanly. Multiple sequential shifts on the same pixel array can cause inter-region conflicts (region A writes into region B's space). D12 depth ordering in Sprint 2 will address this.

## QA History
- Phase 3: 42 unit tests passing — PASS
- Phase 5: docs complete — PASS
- Phase 6 (O1–O3, O5): feature complete — PASS
- Phase O6-1 (Architecture & Data Model): 87 tests passing — PASS WITH NOTES
- Phase O6-2 (UI Shell): 87 tests passing — PASS WITH NOTES (B1 region button display fix)
- Phase O6-3 (Region Workflow & Pose Generation): 127 tests passing — PASS WITH NOTES (B1 region button display regression, A1 perf fix, A2 stale JSDoc)
- **Phase O6-4 (Pose Template Engine): 127 tests passing — PASS WITH NOTES (A1 stale input on resize cancel fix, A2 stale header comment fix)**
- **Phase PW-1 (Preview Infrastructure): 127 tests passing — smoke check PASS (no Viktor audit yet)**
- **Phase PW-2 (Preview Rendering + Playback): 127 tests passing — smoke check PASS (no Viktor audit yet, full QA at PW-3)**
- **Phase PW-3 (Editor-to-Preview Sync + Polish): 127 tests passing — Viktor PASS WITH NOTES (B1+A1+A2 all resolved)**

## Session Bookend Duty (V&V Layer 2)
- At session start: read `budget-ledger.json`, give Director 1-line V&V status
- At session end: append session summary to `usage-log.jsonl` (actors, categories, duration)

## Open Items
- **O6-4 Activity 4.21: Director live test session — still pending.**
- **O6-5: Export & Integration — next phase after Director approval.**
- **PW-3: Viktor PASS WITH NOTES. Director live demo raised 4 UX concerns. Push held. Team meeting next session.**
- **Team meeting agenda: `plans/MEETING-PW3-REVIEW.md` — review Director's 4 points, roadmap, decide direction.**
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
All plan and roadmap files live in `plans/` at project root. Canonical copies with meaningful names:

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
