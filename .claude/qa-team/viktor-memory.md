# Viktor — QA Memory: Pixel Art Tool

## Project Status
- Scaffolded: 2026-03-13
- v0.1.0-mvp: pushed 2026-03-15 (commit `a1f877c`)
- v0.2.0: pushed 2026-03-15 (commit `888700f`) — O1+O2+O3+O5 complete
- O6 Animation sprint: Phase O6-1 complete (2026-03-18) — PASS WITH NOTES
- Tests: 87 passing ✅ (42 original + 45 new animation tests)
- **Next: Phase O6-2 — UI Shell (Nova leads, Playwright screenshot required)**

## Phase 0.3 Pre-Audit — Full Findings (2026-03-14)

### BLOCKING — all resolved ✅

| # | File | Issue | Status |
|---|------|-------|--------|
| B1 | `src/ai/generate.js` | Called `PixelCanvas._redraw()` directly | ✅ Fixed — public `redraw` exported |
| B2 | `src/ai/generate.js` | History sequence broken | ✅ Fixed — zero-in-place, single push |
| B3 | `src/ai/client.js` + `src/main.js` | API key passed to renderer | ✅ Fixed — API calls in main.js only |
| B4 | All modules | IIFE pattern — Jest cannot import | ✅ Strategy documented in `tests/TESTING_STRATEGY.md` — tests written in Phase 3 |
| B5 | `src/app.js` | Generate button not disabled during API call | ✅ Fixed |

### ADVISORY — all resolved ✅

| # | File | Issue | Status |
|---|------|-------|--------|
| A1 | `src/ui/toolbar.js` | No JS bounds validation on canvas resize | ✅ Fixed |
| A2 | `src/core/palette.js` | Silent fail at 8-color limit | ✅ Fixed |
| A3 | `src/ui/reference-panel.js` | `result.ext` unsanitized | ✅ Fixed — allowlist added |
| A4 | `src/ai/generate.js` | No JSON schema validation | ✅ Fixed |
| A5 | `src/ai/generate.js` | `2048` magic number max tokens | ✅ Fixed — adaptive formula |
| A6 | `src/ui/output-panel.js` | Copy timeout stacking | ✅ Fixed |
| A7 | `src/ai/client.js` | Hardcoded model + outdated API version | ✅ Fixed — `claude-sonnet-4-6` |
| A8 | `src/ai/generate.js` | No markdown fence stripping | ✅ Fixed |
| A9 | `package.json` | Unused `@anthropic-ai/sdk` dependency | ✅ Fixed — removed |
| A10 | `exporter.js` + `png2sprite.js` | Greedy rect algorithm duplicated | ⚠️ Known — deferred to O7 |

## Phase 2 QA Run (2026-03-14) — PASS WITH NOTES

### Bugs found and fixed in-session

| # | File | Bug | Status |
|---|------|-----|--------|
| N1 | `generate.js:115` | Status text overwrote enforce message | ✅ Fixed |
| N2 | `reference-panel.js:19` | `AppState.referenceExt` stored raw `'jpg'` | ✅ Fixed |

### Advisories from Phase 2 QA (Phase 3 cleanup — Activity 3.5)

| # | File | Item | Status |
|---|------|------|--------|
| V-A1 | `src/main.js` | `require()` calls inside handler body | ✅ Fixed — moved to top-level |
| V-A2 | `src/ui/reference-panel.js` | `console.log` debug line | ✅ Fixed — removed |
| V-A3 | `src/main.js` | `nativeImage` not in top-level destructure | ✅ Fixed |
| V-A4 | `src/ui/reference-panel.js` | `img.src = ''` spurious request | ✅ Fixed — `removeAttribute('src')` |

## Trace Reference QA Run (2026-03-14) — PASS WITH NOTES

**Scope:** CSP fix, auto-size, clearReference wiring
**New bugs found:** Zero
**Advisories:** V-A1 through V-A4 (all now resolved in same session)

## Convention Reminders
*(Viktor notes any conventions that have been violated more than once)*

- `require()` inside function bodies — happened in `trace-reference` handler. Watch for this pattern in future IPC handlers.
- Global singleton `History` bypassed by external callers — happened in O6-1 (generate.js, enforce.js). Fix: always use `PixelCanvas.pushToHistory()`, never the global directly.

## QA Run History

| Date | Scope | Verdict | Notes |
|------|-------|---------|-------|
| 2026-03-14 | Phase 2 + enforce.js + Trace Reference (first full run) | PASS WITH NOTES | 2 bugs found+fixed in-session; 4 advisories noted |
| 2026-03-14 | Trace Reference fixes (CSP, auto-size, clearReference) | PASS WITH NOTES | 0 bugs; advisories all resolved same session |
| 2026-03-14 | Phase 3 — full codebase convention audit + test suite | PASS | 1 blocking fix (P3-A1); 42 tests written and passing |
| 2026-03-15 | Phase 7 — O1+O2+O3+O5 additions | PASS | 2 advisories fixed in-session; v0.2.0 tagged |
| 2026-03-18 | Phase O6-1 — Architecture & Data Model (initial) | BLOCKED | B1: History singleton regression in generate.js + enforce.js |
| 2026-03-18 | Phase O6-1 — Re-check after B1 fix | PASS WITH NOTES | B1 resolved; A1/A2 addressed; 87/87 tests green |

## Chain-of-Thought Prompt Change (2026-03-14)
- `generate.js` system prompt updated: model now writes a region plan before outputting JSON
- JSON extractor updated: finds first `{` in response, strips plan text before parse
- maxTokens overhead bumped by 200 to account for plan text
- Result: simple sprites (mushroom) ✅ game-asset quality. Complex characters (cave dweller) ❌ still fails — confirmed model ceiling
- Decision: AI generation scoped to simple sprites for MVP. Complex characters → Trace workflow.
- Option F (image gen API → Trace) added to ROADMAP as O8 — post-MVP, pending Director funding

## Phase 3 QA Run (2026-03-14) — PASS ✅

**Scope:** Full codebase convention audit + test suite creation
**Blocking items found:** 1 (P3-A1)
**Blocking items resolved:** 1 ✅

| # | File | Issue | Status |
|---|------|-------|--------|
| P3-A1 | `src/ai/enforce.js:72` | `var i` declared twice in `reduce()` — second loop used `i` instead of `j` | ✅ Fixed |

**Advisories (non-blocking, carry-forward):**

| # | File | Item | Status |
|---|------|------|--------|
| P3-A2 | `src/core/canvas.js` | `mousedown` pushes history for eyedropper even though canvas doesn't change | ⚠️ Code comment added O6-1; still deferred |
| P3-A3 | `src/main.js` | `trace-reference` handler has no `try/catch` — raw pngjs error reaches user | ⚠️ Still open, low priority |

**Tests written:**
- `tests/palette.test.js` — 10 tests ✅
- `tests/history.test.js` — 16 tests ✅
- `tests/exporter.test.js` — 9 tests ✅
- `tests/enforce.test.js` — 7 tests ✅
- **Total: 42 tests, 4 suites, 0 failures**

## Phase O6-1 QA Run (2026-03-18) — PASS WITH NOTES ✅

**Scope:** Architecture & Data Model — history.js factory, 5 new animation skeleton files, AppState extension, IPC stub, index.html load order, 2 new test suites
**Blocking items found:** 1 (B1) — found and fixed in same session
**Advisories addressed:** 2 (A1 deprecation comment, A2 code comment)

| # | File | Issue | Status |
|---|------|-------|--------|
| O6-B1 | `generate.js:187/226`, `enforce.js:153` | `History.push()` calling orphaned global singleton instead of canvas-internal `_history` | ✅ Fixed — `PixelCanvas.pushToHistory()` added and called at all 3 sites |

**New tests:**
- `tests/animation-frames.test.js` — 31 tests ✅ (frame CRUD + per-frame history isolation)
- `tests/animation-regions.test.js` — 24 tests ✅ (region struct + size gate)
- **Total: 87 tests, 6 suites, 0 failures**

## Viktor's Standing Notes
- Tests: 87 passing. v0.1.0-mvp, v0.2.0, O6-1 all shipped clean.
- `png2sprite.js` is shared with other projects — flag any external import additions immediately.
- API key handling: confirmed secure — key stays in main process, renderer gets only boolean + results.
- A10 (greedy rect duplication) deferred to O7 — still open.
- P3-A2 (eyedropper history) — code comment added, still deferred.
- P3-A3 (trace-reference no try/catch) — still open, low priority.
- **O6-2 gate: UI audit. Playwright screenshot is required evidence. No screenshot = no PASS.**
- Next: Phase O6-2 — UI Shell. Nova leads HTML/CSS; Orchestrator wires tab switch + canvas layering.
