# Team Meeting — PW-3 Director Live Test Review

**Date:** Next session (scheduled after 2026-04-02)
**Called by:** Director
**Attendees:** Director, Orchestrator, Nova, Viktor

---

## Agenda

### 1. Director Live Test Results
- PW-3 sync code works: frames push, FPS syncs bidirectionally, throttle works, edge cases handled
- Viktor QA: PASS WITH NOTES (B1 FPS mismatch + A1 double push + A2 dangling timer — all fixed)
- 127 tests passing, zero regressions
- **But:** Director identified 4 significant UX/workflow concerns during hands-on testing

### 2. Discussion: Director's 4 Points

**Point 1 — Preview button UX confusion**
- Preview button only appears in animation tab
- Opening preview before animation mode shows "Switch to Animation mode" message
- Confusing flow: user opens preview → sees error-like message → switches tab → has to reopen or wait
- Question: auto-switch to anim tab? Better messaging? Different button placement?

**Point 2 — Separate window vs docked panel**
- Separate BrowserWindow was the approved PW plan
- Director feedback: workflow feels disconnected, "a little weird"
- Alternative: docked preview panel inside main window with detach/re-attach capability
- This would be a significant rework (PW Evolution 2 redesign)
- Need Nova's input on layout feasibility

**Point 3 — Static sprite during playback (no visible movement)**
- NOT a code bug — pose templates require named regions to shift pixels
- Without regions (`head`, `left-leg`, etc.), Walk/Idle produces identical frames
- Root cause: UX doesn't guide user through the region → name → apply workflow
- First-time user expectation: click "Walk" → see walking animation. Reality: nothing moves.
- Question: Do we need a guided workflow? Auto-region detection? Better empty-state messaging?

**Point 4 — Region tool issues**
- Region overlay colors appear to replace sprite pixels visually (possible z-index/opacity rendering issue — needs investigation)
- Onion skin mode also affected
- No undo for region paint operations (known limitation from O6-3)
- Even with regions, playback didn't produce dynamic sprite (ties back to Point 3)
- Question: Is the region overlay a rendering bug? Should region operations support undo?

### 3. Review: Big Roadmap + PW Phases
- Review `plans/ROADMAP-FULL.md` — where does animation stand in the full picture?
- Review `plans/PLAN-PREVIEW-WINDOW.md` — PW-1/2/3 complete, but is the direction right?
- Review `plans/PLAN-O6-ANIMATION-SPRINT.md` — O6-1 through O6-4 done, O6-5 pending
- Should O6-5 (Export) wait until workflow is solid?

### 4. Decision: What Next?
Options on the table:
- **Continue as-is:** Push PW-3, proceed to O6-5 Export
- **Remap plans:** Fix UX workflow before proceeding (region guidance, preview redesign)
- **Hybrid:** Push PW-3 code (it works), but reprioritize next phase to UX fixes
- **Full rethink:** Pause feature work, hold design session with Nova on animation UX

---

## Pre-Meeting Action Items
- [ ] Orchestrator: investigate region overlay rendering (Point 4) — is it a bug or z-index issue?
- [ ] Nova: prepare layout options for docked vs detached preview
- [ ] Viktor: no action needed, pipeline passed
- [ ] Orchestrator: have roadmap context loaded and ready for review
