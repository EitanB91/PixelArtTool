# Viktor — QA Memory: Pixel Art Tool

## Project Status
- Scaffolded: 2026-03-13
- v0.1.0-mvp: pushed 2026-03-15 (commit `a1f877c`)
- v0.2.0: pushed 2026-03-15 (commit `888700f`) — O1+O2+O3+O5 complete
- Tests: 42 passing ✅
- Phase 5 (Docs): completed 2026-03-15 — `docs/USAGE.md` + `docs/ARCHITECTURE.md` written
- Next: O6 Animation frames sprint (separate roadmap)

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
| A10 | `exporter.js` + `png2sprite.js` | Greedy rect algorithm duplicated | ⚠️ Known — deferred to post-MVP (O7) |

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

## QA Run History

| Date | Scope | Verdict | Notes |
|------|-------|---------|-------|
| 2026-03-14 | Phase 2 + enforce.js + Trace Reference (first full run) | PASS WITH NOTES | 2 bugs found+fixed in-session; 4 advisories noted |
| 2026-03-14 | Trace Reference fixes (CSP, auto-size, clearReference) | PASS WITH NOTES | 0 bugs; advisories all resolved same session |
| 2026-03-14 | Phase 3 — full codebase convention audit + test suite | PASS | 1 blocking fix (P3-A1); 42 tests written and passing |

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

**Advisories (non-blocking, deferred to Phase 6):**

| # | File | Item |
|---|------|------|
| P3-A2 | `src/core/canvas.js` | `mousedown` pushes history for eyedropper even though canvas doesn't change |
| P3-A3 | `src/main.js` | `trace-reference` handler has no `try/catch` — raw pngjs error reaches user |

**Tests written:**
- `tests/palette.test.js` — 10 tests ✅
- `tests/history.test.js` — 16 tests ✅
- `tests/exporter.test.js` — 9 tests ✅
- `tests/enforce.test.js` — 7 tests ✅
- **Total: 42 tests, 4 suites, 0 failures**

## Phase 7 QA Run (2026-03-15) — PASS ✅

**Scope:** Phase 6 additions — O1 (outline detection), O2 (presets), O3 (extract palette), O5 (build config + icon)
**Blocking items found:** 0
**Advisories found and fixed in-session:** 2

| # | File | Issue | Status |
|---|------|-------|--------|
| P7-A1 | `src/ai/enforce.js:5` | Stale comment — said "stub" after O1 was implemented | ✅ Fixed |
| P7-A2 | `src/ui/reference-panel.js:22` | Extract palette handler missing `catch` | ✅ Fixed |

**Tests:** 42 passing ✅
**Tag pushed:** `v0.2.0`

## O6 Animation Sprint — Planning Complete (2026-03-15)

Full meeting summary: `.claude/projects/c--Users-user-Desktop-Ai-Claude-PixelArtTool/memory/reference_o6_meeting_summary.md`

**Viktor's spike criteria (S1–S5):** approved by Director. Must pass before full sprint commitment. ~2 hours, no UI code, pure pixel manipulation test. See meeting summary for details.

**Status:** Spike (POC) is next step.

## Viktor's Standing Notes
- Tests: 42 passing. Both v0.1.0-mvp and v0.2.0 shipped clean.
- `png2sprite.js` is shared with other projects — flag any external import additions immediately.
- API key handling: confirmed secure — key stays in main process, renderer gets only boolean + results.
- A10 (greedy rect duplication) deferred to O7 — still open.
- P3-A2 (eyedropper history), P3-A3 (trace-reference no try/catch) — still open, low priority.
- Next: O6 Animation sprint — spike first, then full roadmap.
