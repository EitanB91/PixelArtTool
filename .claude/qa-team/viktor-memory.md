# Viktor — QA Memory: Pixel Art Tool

## Project Status
- Scaffolded: 2026-03-13
- Implementation: ~85% complete as of 2026-03-14
- Tests: Jest configured in `package.json`, zero test files written (OPEN — blocking Phase 3)

## Phase 0.3 Pre-Audit — Full Findings (2026-03-14)

### BLOCKING (must resolve before Phase 1)

| # | File | Issue | Status |
|---|------|-------|--------|
| B1 | `src/ai/generate.js` | Calls `PixelCanvas._redraw()` directly — private method (underscore convention). Fix: export public `redraw()` from canvas IIFE. | Open |
| B2 | `src/ai/generate.js` | History sequence broken: `clear()` pushes empty state, then pixels written directly, then `History.push()`. Undo returns empty canvas instead of pre-generation state. Fix: zero pixels manually (no History), write all, then push once. | Open |
| B3 | `src/ai/client.js` + `src/main.js` | API key passed plaintext to renderer via IPC. API calls happen in renderer. Fix: move `AIClient.chat()` to main process. Renderer sends prompt via IPC, main calls Claude, returns result only. Key never leaves main. | Open — **not in original roadmap, significant architectural change** |
| B4 | All modules | IIFE pattern — no `module.exports`. Jest cannot import modules. Test strategy must be decided before Phase 3. | Open |
| B5 | `src/app.js` | Generate button not disabled during API call. Rapid clicks fire multiple concurrent requests, corrupt history, waste tokens. Fix: disable on start, re-enable on complete/error. | Open |

### ADVISORY (non-blocking, log for sprint)

| # | File | Issue |
|---|------|-------|
| A1 | `src/ui/toolbar.js` | Canvas resize has no JS bounds validation — HTML min/max bypassable via DevTools |
| A2 | `src/core/palette.js` | `addColor()` fails silently at 8-color limit — no UI feedback |
| A3 | `src/ui/reference-panel.js` | `result.ext` used unsanitized in `img.src` — minor XSS vector |
| A4 | `src/ai/generate.js` | No JSON schema validation before `_applyGrid()` — crashes on malformed AI response |
| A5 | `src/ai/generate.js` | `2048` max tokens is magic number — truncates large sprites |
| A6 | `src/ui/output-panel.js` | Copy button timeout stacks on rapid click — cosmetic flicker |
| A7 | `src/ai/client.js` | Model hardcoded as `claude-opus-4-6`; API version string `2023-06-01` outdated |
| A8 | `src/ai/generate.js` | No markdown fence stripping before JSON.parse — AI sometimes wraps output |
| A9 | `package.json` | `@anthropic-ai/sdk` listed as dependency but never imported (API called via fetch) |
| A10 | `exporter.js` + `png2sprite.js` | Greedy rect algorithm duplicated in both files |

### CLEAN — confirmed correct (2026-03-14)
IPC security model ✅ · FS isolation ✅ · ZOOM display-only/export 1× ✅ · AppState centralization ✅ · Script load order ✅ · PNG export pipeline ✅ · Flood fill boundary checks ✅ · Error handling in client.js ✅ · All IPC channels matched ✅ · History push-once-per-stroke ✅

## Convention Reminders
*(Viktor notes any conventions that have been violated more than once)*

*(none yet)*

## QA Run History

| Date | Scope | Verdict | Notes |
|------|-------|---------|-------|
| — | — | — | First run pending |

## Viktor's Standing Notes
- Test runner not yet set up. First priority when implementation begins.
- `png2sprite.js` is shared with other projects — flag any external import additions immediately.
- API key handling: watch every new file that touches `client.js` or IPC channels.
