# Orchestrator — Working Memory

## Current Project
**Pixel Art Tool** — v0.2.0 shipped. O6 Animation sprint in progress.
**Phase O6-1 complete (2026-03-18).** Phase O6-2 (UI Shell) begins next session.

## Active Phase
**O6-2 — UI Shell**
- All architecture is in place (O6-1 done)
- Nova owns the animation tab layout and all UI chrome
- Orchestrator wires tab switching, canvas layering, defensive Timeline.pause() guard
- No logic, no region tools, no playback yet — UI only
- Playwright screenshot required before Viktor's UI audit

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

## QA History
- Phase 3: 42 unit tests passing — PASS
- Phase 5: docs complete — PASS
- Phase 6 (O1–O3, O5): feature complete — PASS
- **Phase O6-1 (Architecture & Data Model): 87 tests passing — PASS WITH NOTES (B1 found+fixed in-session)**

## Session Bookend Duty (V&V Layer 2)
- At session start: read `budget-ledger.json`, give Director 1-line V&V status
- At session end: append session summary to `usage-log.jsonl` (actors, categories, duration)

## Open Items
- **O6-2: UI Shell — next phase. Nova leads layout; Orchestrator wires tab switch + canvas layering.**
- D12: depth ordering deferred to Sprint 2 (not needed for platformer side-view)
- D13: background fill uses transparent/bg color (industry standard)
- O4 (AI style transfer) — deferred, post-MVP
- Option F (complex character generation) — deferred, post-MVP
- **Carry-forward (low priority, not blocking O6):**
  - A10: greedy rect algorithm duplicated in `exporter.js` + `png2sprite.js` — deferred to O7
  - P3-A3: `trace-reference` IPC handler has no `try/catch` — raw pngjs error reaches user

## Notes
_Update this file at session compaction and at every phase transition._
