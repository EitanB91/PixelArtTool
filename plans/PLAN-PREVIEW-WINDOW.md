# Animation Preview Window — Evolution 1 Workplan

**Created:** 2026-03-31
**Authors:** Orchestrator + Nova (Design Lead)
**Status:** Awaiting Director approval
**Scope:** Evolution 1 only — basic animation preview in a separate BrowserWindow

---

## Context

The Pixel Art Tool is mid-O6 animation sprint (Phases O6-1 through O6-3 complete, 127 tests passing).
The animation editor works: frame strip, playback, pose templates, region tools. But the animator
has no clean preview — the editor's own playback loop shares the workspace canvas, making it hard
to judge how the sprite will look in-game.

**This plan delivers a dedicated Animation Preview Window** — a separate Electron BrowserWindow that
renders the animated sprite on a clean stage, independently from the editor workspace.

**Director's confirmed decisions:**
- Always-on-top: default OFF, with toggle button — YES
- Opening: manual via "Open Preview" button click — NOT auto-open
- Mini frame strip: lives in BOTH the editor (for editing context) and the preview (for inspection
  without switching focus)

**Grand vision context:** This tool is evolving toward an indie game dev studio pipeline (Godot).
Design for growth but build only what's needed now.

---

## Design Spec Summary (Nova)

**Window properties:**
- Separate `BrowserWindow` with its own HTML/CSS/JS — fully self-contained renderer
- Default size: 400x360px (enough for canvas + controls + mini strip)
- Resizable, minimum 300x280
- `alwaysOnTop`: false by default, togglable via header button
- Dark theme consistent with main editor (shares CSS variables)

**Layout (top to bottom):**
1. **Header bar** — "PREVIEW" title + pin/unpin (always-on-top toggle) + background selector
2. **Stage canvas** — centered sprite rendered at configurable zoom (2x–8x), clean background
3. **Playback controls** — Play/Pause + FPS display (synced from editor) + frame counter
4. **Mini frame strip** — read-only thumbnails, click-to-inspect (pauses playback, highlights frame)

**Communication model:**
- One-way data push: editor → main process → preview (IPC relay)
- Bidirectional FPS sync: FPS changes in either window update both
- Preview never writes to frame data — it is a read-only view
- Preview window lifecycle managed by main process; closing preview does not affect editor

---

## New Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `src/preview/preview.html` | Standalone HTML for the preview BrowserWindow. Loads preview.css and preview.js. Has its own CSP meta tag. Contains: header bar, stage canvas, playback controls row, mini frame strip container. |
| 2 | `src/preview/preview.js` | Self-contained renderer script. Owns: its own playback loop (independent `setInterval`), canvas rendering at configurable zoom, mini frame strip rendering, play/pause controls, FPS display, background mode switching, always-on-top toggle via IPC. Receives frame data from main process via IPC. |
| 3 | `src/preview/preview.css` | Preview window styles. Imports shared CSS custom properties from main.css (via `:root` variable duplication or a shared `variables.css` extract). Dark theme. Compact layout optimized for small window. |
| 4 | `src/preview/preview-preload.js` | Preload script for the preview BrowserWindow. Exposes a scoped `previewApi` object via `contextBridge` with receive-only IPC listeners + the always-on-top toggle + FPS-change-back channel. |

---

## Files to Modify

| # | File | Changes |
|---|------|---------|
| 1 | `src/main.js` | Add `createPreviewWindow()` function (BrowserWindow config, preload path, lifecycle). Add IPC handlers: `open-preview-window` (creates/focuses window), `preview:push-frames` relay (editor→preview), `preview:push-active-frame` relay, `preview:set-fps` relay, `preview:set-always-on-top` (calls `win.setAlwaysOnTop()`), `preview:fps-changed` reverse relay (preview→editor). Track `previewWindow` variable; clean up on close. |
| 2 | `src/ui/animation-panel.js` | Add "Open Preview" button in the animation panel DOM. Add `_pushToPreview()` helper that serializes current frame data and sends via IPC. Hook `_pushToPreview()` into: `syncAfterDraw()`, `_navigateToFrame()`, `_applyTemplate()`, `show()` (initial push on mode enter). Wire FPS sync from editor→preview on `fpsSelect` change. Add `_receivePreviewFpsChange()` to handle reverse sync. |
| 3 | `src/index.html` | Add "Open Preview" button inside `#animation-panel` (in the animation section, below the onion skin toggle). No new script tags needed (preview window loads its own scripts). |
| 4 | `src/styles/main.css` | Add styling for the "Open Preview" button (`.btn-open-preview` class — accent border, icon hint). |
| 5 | `src/preload.js` | Add `openPreviewWindow()`, `pushFramesToPreview()`, `pushActiveFrameToPreview()`, `setPreviewFps()` methods to the existing `api` object. Add `onPreviewFpsChanged(callback)` listener for reverse FPS sync. |

---

## IPC Channel Definitions

All channels use Electron's `ipcMain.handle` / `ipcRenderer.invoke` (request/response) or
`ipcMain.on` / `webContents.send` (fire-and-forget push) as appropriate.

### Editor → Main Process

| Channel | Direction | Payload | Notes |
|---------|-----------|---------|-------|
| `preview:open` | invoke | `{ width, height }` | Creates or focuses preview window. Returns `true`. |
| `preview:push-frames` | send | `{ frames: [{ pixels: Array }], width, height, activeIndex, fps }` | Full frame data push. Sent on: template apply, mode enter, frame add/remove. `pixels` is a plain Array (serializable), not Uint8ClampedArray. |
| `preview:push-active` | send | `{ frameIndex, pixels: Array, width, height }` | Lightweight single-frame update. Sent on: `syncAfterDraw()` (after each draw stroke), `_navigateToFrame()`. |
| `preview:set-fps` | send | `{ fps: number }` | FPS changed in editor. Relay to preview. |

### Main Process → Preview Window

| Channel | Direction | Payload | Notes |
|---------|-----------|---------|-------|
| `preview:receive-frames` | send (to preview webContents) | Same as `preview:push-frames` | Main relays editor's full push to preview renderer. |
| `preview:receive-active` | send (to preview webContents) | Same as `preview:push-active` | Main relays single-frame update. |
| `preview:receive-fps` | send (to preview webContents) | `{ fps: number }` | FPS change from editor. |

### Preview Window → Main Process → Editor

| Channel | Direction | Payload | Notes |
|---------|-----------|---------|-------|
| `preview:fps-changed` | send (from preview) | `{ fps: number }` | User changed FPS in preview. Main relays to editor. |
| `preview:set-on-top` | invoke (from preview) | `{ onTop: boolean }` | Toggle always-on-top. Main calls `previewWindow.setAlwaysOnTop()`. Returns new state. |

### Main Process → Editor (reverse relay)

| Channel | Direction | Payload | Notes |
|---------|-----------|---------|-------|
| `editor:receive-preview-fps` | send (to main webContents) | `{ fps: number }` | FPS changed in preview, relayed back to editor. |

---

## Implementation Phases

### Phase PW-1: Window Infrastructure (3–4 hours)

**Goal:** Preview window opens from the editor, loads its own HTML, IPC channels are wired
end-to-end (skeleton payloads). No rendering logic yet — just a dark rectangle that proves
the architecture works.

| # | Activity | Who | Output |
|---|----------|-----|--------|
| 1.1 | Create `src/preview/preview.html` — minimal HTML shell: header bar ("PREVIEW" title, pin button placeholder), empty `<canvas id="previewCanvas">`, playback controls row (Play/Pause, FPS display, frame counter), empty `<div id="preview-strip">` | Orchestrator | HTML file loads in BrowserWindow |
| 1.2 | Create `src/preview/preview.css` — duplicate `:root` CSS variables from main.css, style header/canvas/controls/strip layout. Compact dark theme. | Nova + Orchestrator | Preview window is styled |
| 1.3 | Create `src/preview/preview-preload.js` — `contextBridge.exposeInMainWorld('previewApi', {...})` with: `onReceiveFrames(cb)`, `onReceiveActive(cb)`, `onReceiveFps(cb)`, `setAlwaysOnTop(bool)`, `sendFpsChanged(fps)` | Orchestrator | Preload exposes scoped API |
| 1.4 | Create `src/preview/preview.js` — skeleton: `DOMContentLoaded` listener, cache DOM refs, register `previewApi.onReceiveFrames()` and `previewApi.onReceiveActive()` callbacks (log to console for now) | Orchestrator | Preview JS loads without errors |
| 1.5 | Modify `src/main.js` — add `createPreviewWindow()`: BrowserWindow config (400x360, min 300x280, `alwaysOnTop: false`, preload: `preview-preload.js`), load `preview.html`. Track `var previewWindow = null`. Wire `preview:open` handler. Wire relay handlers for all IPC channels. Clean up `previewWindow` reference on `closed` event. | Orchestrator | Window opens and closes cleanly |
| 1.6 | Modify `src/preload.js` — add preview IPC methods to `api` object: `openPreviewWindow()`, `pushFramesToPreview(data)`, `pushActiveFrameToPreview(data)`, `setPreviewFps(fps)`, `onPreviewFpsChanged(cb)` | Orchestrator | Editor can invoke preview channels |
| 1.7 | Modify `src/ui/animation-panel.js` — add "Open Preview" button (`#btn-open-preview`) to DOM setup in `init()`. Wire click handler: `window.api.openPreviewWindow()`. Place button in animation panel below onion skin toggle. | Orchestrator | Button opens preview window |
| 1.8 | Modify `src/index.html` — add `<button id="btn-open-preview">Open Preview</button>` inside `#animation-panel`, after the onion skin toggle row | Orchestrator | Button exists in DOM |
| 1.9 | Modify `src/styles/main.css` — style `#btn-open-preview` (full width, accent border, slightly larger font to distinguish from other controls) | Nova | Button fits the dark theme |
| 1.10 | Smoke check: `npm start`, switch to Animation tab, click "Open Preview", verify window opens with dark background and header text. Close preview, verify no crash. Reopen, verify reuse (not duplicate windows). | Orchestrator | Architecture verified |
| 1.11 | Playwright screenshot: preview window open alongside editor | Orchestrator | `tests/screenshots/preview-window-shell-{date}.png` |

**Phase Exit Criteria:**
- "Open Preview" button visible in animation panel
- Click opens a separate BrowserWindow with dark theme
- Closing and reopening works without errors or duplicate windows
- All IPC channels registered (no rendering yet)
- `npm start` clean, no regressions
- `npm test` green (no test changes needed — this is infrastructure)

---

### Phase PW-2: Preview Rendering + Playback (3–4 hours)

**Goal:** The preview window renders the animated sprite on a clean stage. Its own playback
loop runs independently. Background options work. Mini frame strip shows thumbnails.

| # | Activity | Who | Output |
|---|----------|-----|--------|
| 2.1 | Implement `preview.js` — `_renderFrame(pixels, w, h)`: draw pixel data onto `previewCanvas` at calculated zoom. Center sprite on stage. Respect background mode (transparent checkerboard / solid color / black). | Orchestrator | Sprite renders in preview |
| 2.2 | Implement `preview.js` — frame data storage: `_frames[]` array, `_activeIndex`, `_width`, `_height`. Populated by `onReceiveFrames` callback. | Orchestrator | Preview holds its own frame copy |
| 2.3 | Implement `preview.js` — `_startPlayback()` / `_stopPlayback()`: own `setInterval` at current FPS, cycles through `_frames[]`, calls `_renderFrame()`. Play/Pause button toggles. | Orchestrator | Independent playback loop |
| 2.4 | Implement `preview.js` — FPS display: shows current FPS value. `onReceiveFps` callback updates the value and restarts interval if playing. | Orchestrator | FPS syncs from editor |
| 2.5 | Implement `preview.js` — frame counter: "Frame N / Total" text, updates on each tick | Orchestrator | Frame position visible |
| 2.6 | Implement `preview.js` — mini frame strip: render thumbnail `<canvas>` elements for each frame (reuse thumbnail rendering logic — same algorithm as `_renderThumb` in animation-panel.js, duplicated here since preview is self-contained). Click thumbnail pauses playback and shows that frame. Active frame highlighted with amber border. | Orchestrator | Mini strip functional |
| 2.7 | Implement `preview.js` — background mode selector: 3 options — checkerboard (default, shows transparency), solid color, black. Header dropdown or button cycle. | Nova + Orchestrator | Background options work |
| 2.8 | Implement `preview.js` — always-on-top toggle: pin/unpin button in header. Calls `previewApi.setAlwaysOnTop(bool)`. Visual state (icon/highlight) reflects current mode. | Orchestrator | Pin toggle works |
| 2.9 | Implement `preview.js` — `onReceiveActive` handler: update the single frame in `_frames[idx]` without replacing the entire array. Re-render if that frame is currently displayed. | Orchestrator | Lightweight updates work |
| 2.10 | Implement `preview.js` — auto-zoom calculation: fit sprite to available canvas area with integer zoom levels (2x, 3x, 4x... up to 8x). Recalculate on window resize. | Orchestrator | Sprite fills preview canvas proportionally |
| 2.11 | Smoke check: open preview, apply Walk template in editor, verify 4 frames appear in preview strip, playback animates, FPS display matches editor | Orchestrator | Rendering verified |
| 2.12 | Playwright screenshot: preview showing animated sprite with mini strip | Orchestrator | `tests/screenshots/preview-rendering-{date}.png` |

**Phase Exit Criteria:**
- Preview window renders sprite at appropriate zoom on clean background
- Own playback loop runs independently from editor
- Background mode selector works (checkerboard / solid / black)
- Mini frame strip shows correct thumbnails with active highlight
- Click thumbnail in preview pauses playback and shows that frame
- Always-on-top toggle works
- Frame counter updates during playback
- `npm start` clean, no regressions

---

### Phase PW-3: Editor-to-Preview Sync + Polish (2–3 hours)

**Goal:** Every edit in the editor pushes live to the preview. FPS sync is bidirectional.
The preview experience is polished and ready for Viktor's QA gate.

| # | Activity | Who | Output |
|---|----------|-----|--------|
| 3.1 | Modify `animation-panel.js` — `_pushToPreview()` helper: serialize all frames as `{ frames: [...], width, height, activeIndex, fps }`. Convert `Uint8ClampedArray` to plain `Array` for IPC serialization. | Orchestrator | Serialization helper ready |
| 3.2 | Hook `_pushToPreview()` into `syncAfterDraw()` — send `preview:push-active` with just the modified frame (lightweight) | Orchestrator | Draw strokes push live |
| 3.3 | Hook full `_pushToPreview()` into `_applyTemplate()` — send `preview:push-frames` after template generates all frames | Orchestrator | Template apply syncs all frames |
| 3.4 | Hook `_pushToPreview()` into `_navigateToFrame()` — send `preview:push-active` to sync active frame highlight | Orchestrator | Frame navigation syncs |
| 3.5 | Hook `_pushToPreview()` into `show()` — initial full push when entering animation mode | Orchestrator | Preview gets data on mode enter |
| 3.6 | Hook into `hide()` — send empty-frames signal or close preview when exiting animation mode (Director preference: keep window open but show "No animation" message) | Orchestrator | Clean state on mode exit |
| 3.7 | Wire FPS sync: editor `fpsSelect` change → `preview:set-fps`. Preview FPS change → `preview:fps-changed` → editor updates `fpsSelect` value and `Timeline.setFps()`. Guard against infinite loop (ignore incoming sync if value matches current). | Orchestrator | Bidirectional FPS sync |
| 3.8 | Handle `btn-add-frame` — after adding a frame in editor, push full frames to preview | Orchestrator | New frames appear in preview |
| 3.9 | Edge case: preview opened before animation mode → show "Switch to Animation mode to preview" message | Orchestrator | Graceful empty state |
| 3.10 | Edge case: preview window closed mid-edit → all `pushToPreview` calls silently no-op (guard on `previewWindow !== null` in main.js relay handlers) | Orchestrator | No crashes on closed preview |
| 3.11 | Edge case: rapid draw strokes → throttle `preview:push-active` to max ~10 pushes/sec to avoid IPC flooding | Orchestrator | Performance guard |
| 3.12 | CSS polish pass on preview window: ensure consistent sizing, scrollbar styling, focus states | Nova | Preview looks polished |
| 3.13 | Smoke check: full workflow — draw sprite, enter animation mode, open preview, apply template, edit frame, change FPS in both directions, close/reopen preview | Orchestrator | Full sync verified |
| 3.14 | Playwright screenshots: preview synced with editor showing walk animation | Orchestrator | `tests/screenshots/preview-synced-{date}.png` |
| 3.15 | Viktor **full QA pipeline** on all preview-related code | Viktor | **HARD GATE** — PASS required |
| 3.16 | Director live demo: full preview workflow (15–20 min) | Director + Orchestrator | Approval checkpoint |

**Phase Exit Criteria:**
- Every draw stroke, frame navigation, and template apply pushes to preview in real-time
- FPS changes in either window update both (no infinite loops)
- Closing preview window does not crash the editor
- Opening preview before animation mode shows a helpful message
- Throttling prevents IPC flooding on rapid drawing
- All existing tests pass (`npm test`)
- Viktor PASS verdict
- Director approval

---

## IPC Relay Architecture Diagram

```
┌─────────────────────┐         ┌──────────────────┐         ┌────────────────────┐
│   Editor Renderer    │         │   Main Process    │         │  Preview Renderer   │
│  (animation-panel.js)│         │    (main.js)      │         │   (preview.js)      │
│                     │         │                  │         │                    │
│  syncAfterDraw() ──────────►  preview:push-active ──────►  onReceiveActive()   │
│  applyTemplate() ──────────►  preview:push-frames ──────►  onReceiveFrames()   │
│  fpsSelect change ─────────►  preview:set-fps ──────────►  onReceiveFps()      │
│                     │         │                  │         │                    │
│  onPreviewFpsChanged ◄────── editor:receive-fps ◄──────── preview:fps-changed  │
│                     │         │                  │         │                    │
│  openPreviewWindow() ─────►  preview:open                  │                    │
│                     │         │      │                     │                    │
│                     │         │      └─► createPreviewWindow()                  │
└─────────────────────┘         └──────────────────┘         └────────────────────┘
```

---

## Data Serialization Notes

Electron IPC uses structured clone for message passing. `Uint8ClampedArray` is transferable but
can be slow for large frame counts. Strategy:

- **Full push (`preview:push-frames`):** Convert each frame's `pixels` from `Uint8ClampedArray`
  to a plain `Array` before sending. Preview reconstructs to `Uint8ClampedArray` on receipt.
  Used sparingly (template apply, mode enter, frame add/remove).

- **Active push (`preview:push-active`):** Single frame only. Lightweight. Used on every draw
  stroke (throttled to ~10/sec) and frame navigation.

- **Frame limit sanity:** Evolution 1 targets 2–8 frames max (pose templates produce 2–4).
  At 32x32 RGBA, each frame is ~4KB. Even 8 frames is ~32KB per full push — negligible.

---

## Viktor QA Gate Map

| After Phase | Gate Type | What Viktor Runs |
|-------------|-----------|-----------------|
| PW-1 (Infrastructure) | Light structural audit | File structure, preload security (contextIsolation), IPC channel naming, no regressions |
| PW-2 (Rendering) | Targeted functional audit | Playback correctness, memory leaks (interval cleanup), zoom calculation, thumbnail rendering |
| PW-3 (Sync + Polish) | **Full QA pipeline** | IPC relay correctness, edge cases (close/reopen, mode exit, empty state), FPS sync loop guard, throttle effectiveness, full regression |

---

## Where Future Evolutions Plug In

These are NOT part of Evolution 1. Noted here so the architecture accommodates them.

| Evolution | What | Where It Plugs In |
|-----------|------|-------------------|
| **Evo 2: Stage backgrounds** | Selectable game-context backgrounds (sky, dungeon, grass platform) behind the sprite | `preview.js` — extend background mode selector. Add `preview:set-background` IPC channel. Background images loaded as assets in `src/preview/backgrounds/`. |
| **Evo 3: Multi-sprite preview** | Place multiple sprites on stage (player + enemy + projectile) to see interactions | `preview.js` — extend `_frames` to a map of sprite slots. New `preview:push-sprite-slot` IPC. Canvas renders multiple sprites at relative positions. |
| **Evo 4: Speed/timing controls** | Per-frame hold durations, ease-in/out, ping-pong playback, reverse | `preview.js` — extend playback loop to read per-frame `holdMs` values. Add `preview:push-timing` IPC. Preview controls get timing UI. |
| **Evo 5: Export from preview** | "Save GIF" / "Save spritesheet" buttons directly in preview window | `preview-preload.js` — add export IPC channels. `preview.js` — add export UI. Main process handles file save dialogs. Reuses existing `save-spritesheet` handler pattern. |

---

## Resource Estimate

| Phase | Effort | API Cost | Calendar |
|-------|--------|----------|----------|
| PW-1: Infrastructure | 3–4 hours (1 CC session) | $0.00 | 1 day |
| PW-2: Rendering + Playback | 3–4 hours (1 CC session) | $0.00 | 1 day |
| PW-3: Sync + Polish + QA | 2–3 hours (1 CC session) | $0.00 | 1 day |
| **Total** | **~8–11 hours (2–3 CC sessions)** | **$0.00** | **~3 days** |

No API spend — this is pure Electron/JS infrastructure. All within normal Claude Code Pro plan usage.

---

## Approval Checkpoint

This plan requires Director approval before implementation begins.

**Director sign-off items:**
1. Three-phase structure (Infrastructure → Rendering → Sync) — approved?
2. IPC channel naming convention (`preview:*` namespace) — approved?
3. Preview window self-contained (own HTML/CSS/JS, no shared renderer modules) — approved?
4. Mini frame strip in preview is read-only (click-to-inspect only, no editing) — approved?
5. FPS bidirectional sync design — approved?
6. Future evolution plug-in points noted but NOT built — approved?
