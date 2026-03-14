# Viktor — QA Memory: Pixel Art Tool

## Project Status
- Scaffolded: 2026-03-13
- Implementation: ~95% complete as of 2026-03-14
- Tests: Jest configured in `package.json`, zero test files written (OPEN — blocking Phase 3)
- Last pushed commit: `000dc92` (README) — Phase 1+2 work at `c9df7b6`

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

## Chain-of-Thought Prompt Change (2026-03-14)
- `generate.js` system prompt updated: model now writes a region plan before outputting JSON
- JSON extractor updated: finds first `{` in response, strips plan text before parse
- maxTokens overhead bumped by 200 to account for plan text
- Result: simple sprites (mushroom) ✅ game-asset quality. Complex characters (cave dweller) ❌ still fails — confirmed model ceiling
- Decision: AI generation scoped to simple sprites for MVP. Complex characters → Trace workflow.
- Option F (image gen API → Trace) added to ROADMAP as O8 — post-MVP, pending Director funding

## Viktor's Standing Notes
- Tests: Phase 3 is the gate. Until then, `npm test` exits code 1. This is expected but not acceptable forever.
- `png2sprite.js` is shared with other projects — flag any external import additions immediately.
- API key handling: confirmed secure — key stays in main process, renderer gets only boolean + results.
- A10 (greedy rect duplication) deferred to post-MVP O7.
