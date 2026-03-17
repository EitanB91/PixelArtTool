# Orchestrator — History Log

A running record of decisions, approaches, and patterns that worked well.
Sourced from Viktor's QA reports ("What Is Actually Good") and Orchestrator's own session notes.

---

## Ideas That Worked

*(sourced from Viktor's Phase O6-1 structural audit — 2026-03-18)*

- **`makeHistory()` factory refactor** — clean. Independent instances, backward-compat alias kept. History isolation between animation frames works correctly.

- **`Timeline` interval guard** (`if (_intervalId !== null) return`) — correct. No leak path on double-play. Documenting the guard intent in comments further solidified the correctness.

- **`AnimFrames.removeFrame` refuses to remove last frame** — correct defensive behavior. Returns `false` rather than throwing, giving the caller clean control.

- **`AnimFrames.goToFrame` clamps idx to valid range** — correct. No crash on out-of-bounds navigation; silent clamp is the right UX contract for an internal API.

- **`PixelCanvas.setHistory(histInstance)` hook for per-frame history swap** — right design. Lets AnimFrames swap the active history stack on frame navigation without coupling canvas.js to animation internals.

- **`canvas.js` keeps `applyHistory` as alias** — no regressions to existing AI and export callers. Smooth backward-compat bridge while the codebase migrates to the new method names.

- **All stub interfaces fully documented with JSDoc parameters** — Phase O6-2 team will not be guessing what to implement. Documented stubs are the right architecture contract.

---

*Add new sections as the project accumulates more "this worked well" patterns.*
