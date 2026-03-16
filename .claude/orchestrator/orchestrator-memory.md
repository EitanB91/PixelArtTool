# Orchestrator — Working Memory

## Current Project
**Pixel Art Tool** — v0.2.0 shipped. O6 Animation sprint is the active work stream.
Spike POC is the immediate next step before full implementation.

## Active Phase
**O6 — Animation System**
- Spike criteria defined (see `reference_o6_meeting_summary.md`)
- Approach: frame strip + timeline panel + export multi-frame pxAt()
- No full implementation until spike validates the approach

## Key Decisions On Record
- AI generation scoped to simple sprites; complex characters use Trace Reference (Option F post-MVP)
- png2sprite.js remains self-contained — no new imports
- All file system ops through IPC in main.js — renderer never touches `fs` directly
- Viktor gates all pushes; no code goes to git without his verdict + Director approval

## QA History
- Phase 3: 42 unit tests passing — PASS
- Phase 5: docs complete — PASS
- Phase 6 (O1–O3, O5): feature complete — PASS

## Open Items
- O6: spike passed (S3–S5 green). Full sprint planning is next — Director will return in a new session.
- D12: depth ordering deferred to Sprint 2 (not needed for platformer side-view)
- D13: background fill uses transparent/bg color (industry standard)
- History model (per-frame vs global undo) still open — decide during planning
- O4 (AI style transfer) — deferred, post-MVP
- Option F (complex character generation) — deferred, post-MVP

## Notes
_Update this file at session compaction and at every phase transition._
