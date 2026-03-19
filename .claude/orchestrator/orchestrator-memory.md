# Orchestrator — Working Memory

## Current Project
**Pixel Art Tool** — v0.2.0 shipped. O6 Animation sprint in progress.
**Phase O6-3 complete (2026-03-19).** Phase O6-4 (Export & Spritesheet) is next.

## Active Phase
**O6-4 — Export & Spritesheet**
- Extend exporter.js for multi-frame pxAt() code generation
- Spritesheet PNG export (horizontal strip)
- Update output-panel.js for animation export buttons
- Extend png2sprite.js with --spritesheet flag (must stay self-contained)
- Viktor runs full QA pipeline

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
- **Phase O6-3 (Region Workflow & Pose Generation): 127 tests passing — PASS WITH NOTES (B1 region button display regression, A1 perf fix, A2 stale JSDoc)**

## Session Bookend Duty (V&V Layer 2)
- At session start: read `budget-ledger.json`, give Director 1-line V&V status
- At session end: append session summary to `usage-log.jsonl` (actors, categories, duration)

## Open Items
- **O6-4: Export & Spritesheet — next phase.**
- D12: depth ordering deferred to Sprint 2 (not needed for platformer side-view)
- D13: background fill uses transparent/bg color (industry standard)
- O4 (AI style transfer) — deferred, post-MVP
- Option F (complex character generation) — deferred, post-MVP
- **Carry-forward (low priority, not blocking O6):**
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

Original files also exist in `~/.claude/plans/` (Claude Code's internal plan store).

## Notes
_Update this file at session compaction and at every phase transition._
