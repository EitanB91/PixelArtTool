# O6 Animation Sprint — Full Roadmap Plan

**Created:** 2026-03-17
**Last updated:** 2026-04-02
**Author:** Orchestrator
**Status:** Active — O6-1 through O6-4 complete, PW Evo 1 complete + pushed. Pre-named regions done (D2). O6-5 Export next. State persistence (Option A) slotted in O6-6 Activity 6.1b.

---

## Context

The Pixel Art Tool is at v0.2.0. All MVP features and the optional O1–O3+O5 post-MVP features are
shipped and QA-approved. O6 (Animation frame support) is the Director's highest-priority next
sprint — described as the original core motivation for building the tool. Characters need to feel
alive, not be frozen stickers.

**Spike results (2026-03-16 — all 5 criteria passed):**
- S3 ✓ Idle breathing (torso/arms -1Y reads as life)
- S4 ✓ Walk mid-stride (leg split + arm swap reads as stride)
- S5 ✓ 4fps preview animates (animation perceived, not flicker)

Green light for full sprint. This roadmap is the execution plan.

---

## Sprint Goal

Deliver a functional, platformer-focused animation editor integrated into the Pixel Art Tool.
End state: the Director can load a 32×32 sprite, define regions, apply a Walk/Idle/Jump
template, preview the animation in-app at 4–8fps, export multi-frame `pxAt()` code, and
save a spritesheet PNG — ready for Ages of War.

**Target tag:** `v0.3.0-animation`

---

## Locked Decisions (from planning meeting 2026-03-15 + post-spike 2026-03-16)

| # | Decision |
|---|----------|
| D1 | Animation mode as a distinct tab (easy toggle between Sprite and Animation) |
| D2 | Single animation mode — no character/non-character sub-modes |
| D3 | Pose template picker: Character Poses (Idle, Walk, Jump) + Object/Effect Poses (Rotation, Pulse, Flicker) |
| D4 | Region tools gated by sprite size: available at 24×24+, grayed out below with tooltip |
| D5 | Animation works at any sprite size (manual frame editing always available) |
| D6 | Pose priority: Idle → Jump → Walk. Fighting deferred. |
| D7 | Approach C — hybrid: region marking + algorithmic shifts + optional AI cleanup |
| D8 | Architecture must support Approach B (AI frame generation) as future plug-in |
| D10 | Sprint 1 genre: platformer only (side-view walk/idle/jump) |
| D11 | Walk variants (top-down, isometric) deferred to Sprint 2 |
| D12 | Depth ordering (Z-layers per region) deferred to Sprint 2 — optional field on region struct |
| D13 | Background fill for vacated pixels: transparent / bg color (industry standard) |

---

## Open Items — Must Resolve at Kickoff (Blocking)

### OPEN-1: History Model ✅ RESOLVED — 2026-03-17

**Decision: Option A — Per-frame undo** (Director confirmed)

Each frame owns its own undo stack. `History` IIFE becomes a `makeHistory()` factory.
Ctrl+Z undoes edits on the **current frame only**. Industry standard (Aseprite, Photoshop).
Phase 1 Activity 1.1: refactor `history.js` to factory pattern + update `canvas.js` wiring.

### OPEN-2: Export Format Details (non-blocking but must confirm)

Confirmed concept: spritesheet PNG + per-frame `pxAt()` functions.
- Spritesheet layout: **horizontal strip** (frame 0 at x=0, frame 1 at x=W, etc.) — recommended
- Function naming: `baseName_f0`, `baseName_f1` ... using existing func-name input
- Frame delimiter: `// Frame 0` comment before each function — recommended

---

## Nova's UI Vision (Approved Design — from planning meeting 2026-03-15)

**Tab bar:** "Sprite" tab | "Animation" tab — above the main layout. Easy toggle.

**When Animation tab is active:**

**Left toolbar:**
- All existing tools remain (pencil, eraser, fill, eyedropper)
- New: Region Paint tool button. Grayed out + tooltip `"Region tools available at 24×24+"` for small sprites

**Canvas area:**
- Drawing canvas unchanged — dominant element, same as Sprite mode
- Onion skin overlay: separate `<canvas>` behind main canvas, pointer-events none, ~25% opacity
  - Previous frame: blue-tinted ghost
  - Next frame: orange-tinted ghost
- Region overlay: separate `<canvas>` on top of drawing canvas, pointer-events none, ~50% opacity
  - Semi-transparent colored squares show each region's pixel assignments

**Below canvas — Frame Strip:**
- Horizontal scrollable row of thumbnail `<canvas>` elements (32×32px display, scaled from sprite size)
- Active frame: amber highlight border (`#FFC107`)
- Frame index label below each thumbnail
- `+` button at right edge to add new frame
- Click to navigate, drag to reorder

**Right panels (new Animation panel at top of stack):**
- Pose Template Picker — two sections:
  - **Character Poses:** Idle | Walk | Jump (clickable chips)
  - **Object/Effect Poses:** Rotation | Pulse | Flicker (clickable chips)
- "Apply Template" button
- Onion Skin toggle (checkbox + label)
- Region panel: list of defined regions (color swatch + name + delete button), "New Region" button
- Background fill control: transparent checkbox + color swatch

**Playback controls (below frame strip):**
- Play/Pause button
- FPS selector: `<select>` with options 1 | 2 | 4 | 8 | 12 fps
- Frame counter: `"Frame 2 / 4"`

**Existing right panels** (Palette, Reference, AI Generate, Export) remain unchanged below the Animation panel.

**Dark theme** consistent throughout. Canvas remains the dominant element in all states.

---

## New Files to Create

| File | Module | Purpose |
|------|--------|---------|
| `src/animation/frames.js` | `AnimFrames` IIFE | Frame data model, per-frame history |
| `src/animation/regions.js` | `AnimRegions` IIFE | Region definition, pixel assignment, shift engine |
| `src/animation/pose-templates.js` | `PoseTemplates` IIFE | Template registry + generator functions |
| `src/animation/timeline.js` | `Timeline` IIFE | Playback controller (FPS, play/pause, frame navigation) |
| `src/ui/animation-panel.js` | `AnimationPanel` IIFE | Animation mode UI controller |
| `tests/animation-frames.test.js` | — | Unit tests for AnimFrames |
| `tests/animation-regions.test.js` | — | Unit tests for AnimRegions (shift engine) |
| `tests/animation-export.test.js` | — | Unit tests for multi-frame export |

## Files to Modify

| File | Change |
|------|--------|
| `src/core/history.js` | Factory pattern `makeHistory()` if Option A chosen |
| `src/core/canvas.js` | Wire region paint tool; frame-swap on navigate |
| `src/app.js` | Extend `AppState`, init animation modules, tab switching |
| `src/export/exporter.js` | Add `generateMultiFrame()` + `toSpritesheetBase64()` |
| `src/index.html` | Add 5 new script tags in correct load order |
| `src/main.js` | Add `save-spritesheet` IPC handler |

---

## Viktor's QA Gate Map

**Viktor's ruling (based on his standing rules and this sprint's scope):**

> *"Six phases, three full pipeline runs, two targeted audits, one structural check.
> You want me to babysit every commit? Nyet. You want me to catch every real bug before
> it poisons the next phase? Da. This is the map."*

| After Phase | Gate Type | What Viktor runs |
|-------------|-----------|-----------------|
| Phase 1 (Architecture) | Light structural audit | File structure, conventions, test suite still green, no regressions |
| Phase 2 (UI Shell) | UI audit | Layout present, disabled states correct, tooltips correct, dark theme consistent |
| Phase 3 (Region Tools) | **Full 8-step pipeline** | First real logic — shift engine correctness is a hard gate |
| Phase 4 (Pose Templates) | Targeted functional audit | Template output quality, playback interval memory, onion skin |
| Phase 5 (Export) | Code review only | Export edge cases, no full pipeline |
| Phase 6 (QA + Release) | **Full 8-step pipeline** | Pre-push gate — always, non-negotiable |

---

## Silas's Budget Assessment

**Silas's spoken take:**
> *"Oh, no new API routes? You're telling me this whole sprint costs effectively NOTHING
> in real API dollars? ...I'm going to need a moment. I've prepared seventeen panic speeches
> and now you've rendered them all useless. The INJUSTICE."*

**Real numbers (from `budget-ledger.json`):**

| Resource | Available | O6 Sprint Usage | Post-Sprint |
|----------|-----------|-----------------|-------------|
| Claude API (app) | $4.00 usable | ~$0.00 (no new AI routes) | $4.00 remaining |
| Claude Code (Pro) sessions | Resets every 5hr | ~16-22 sessions across 3-4 weeks | Within Pro plan |
| Claude Code weekly | Resets every 7 days | ~40-60% per week (2-3 sessions/week) | Normal |
| Alert level | Normal | Stays Normal throughout | Normal |

**Per-phase budget (real numbers):**

| Phase | CC Sessions | CC Weekly % | API $ | Calendar Days |
|-------|-------------|-------------|-------|---------------|
| Kickoff Meeting | 0.5 | ~5% | $0.00 | 0.5 day |
| O6-1: Architecture | 2-3 | ~20-30% | $0.00 | 2-3 days |
| O6-2: UI Shell | 3-4 | ~30-40% | $0.00 | 2-3 days |
| O6-3: Region Tools | 3-5 | ~30-50% | $0.00 | 3-4 days |
| O6-4: Templates | 4-5 | ~40-50% | $0.00 | 3-4 days |
| O6-5: Export | 1-2 | ~10-20% | $0.00 | 1-2 days |
| O6-6: QA + Release | 2-3 | ~20-30% | $0.00 | 2-3 days |
| **Sprint Total** | **~16-22** | **spans 3-4 weeks** | **$0.00** | **~14-19 days** |

*CC = Claude Code Pro plan. Sessions reset every 5 hours. Weekly cap resets every 7 days.
Sprint spans multiple resets — weekly usage never exceeds ~50-60% in any single week.*

---

---

## PRE-SPRINT: Kickoff Meeting

**Format:** Director + Orchestrator. Nova + Silas on standby.
**Duration:** 30–45 minutes
**Blocks:** Phase O6-1 cannot start until OPEN-1 (History Model) is resolved.

| Item | Who | Output |
|------|-----|--------|
| Resolve OPEN-1 — History Model (Option A or B) | Director decides | Architecture confirmed |
| Confirm OPEN-2 — Export format details | Director + Orchestrator | Export spec locked |
| Silas: set sprint soft limits (if any) | Director + Silas | Logged in `budget-ledger.json` |
| Nova: confirm UI vision for Phase 2 | Nova + Director | ✅ Approval Checkpoint #O6-1 |
| Greenlight Phase O6-1 | Director | Sprint begins |

**Resources:** 0.5 Claude Code session, $0.00 API, ~0.5 day

---

## Phase O6-1: Architecture & Data Model

**Days 1–3 | Mandatory — all subsequent phases build on this**

**Goal:** All new skeleton files exist with documented interfaces. IPC channels registered.
Data structures finalized. Zero UI. Zero logic beyond stubs. `npm test` green. `npm start` clean.

### Activities

| # | Activity | Who | Output |
|---|----------|-----|--------|
| 1.1 | Refactor `history.js` to `makeHistory()` factory (if Option A) | Orchestrator | `history.js` updated, `canvas.js` wiring updated |
| 1.2 | Create `src/animation/frames.js` — `AnimFrames` IIFE | Orchestrator | Frame data model, add/remove/navigate, per-frame history |
| 1.3 | Create `src/animation/regions.js` — `AnimRegions` IIFE (stubs) | Orchestrator | Region struct with optional `zOrder` field (D12 future-proof) |
| 1.4 | Create `src/animation/pose-templates.js` — `PoseTemplates` IIFE (stubs) | Orchestrator | Template registry, all 6 generators return `[basePixels]` |
| 1.5 | Create `src/animation/timeline.js` — `Timeline` IIFE | Orchestrator | play/pause/fps/onFrameChange interface |
| 1.6 | Create `src/ui/animation-panel.js` — `AnimationPanel` IIFE (stubs) | Orchestrator | init/show/hide/refresh stubs |
| 1.7 | Extend `AppState` in `app.js`: `animationMode`, `activeFrameIndex`, `activeRegionId`, `animBackgroundFill` | Orchestrator | `app.js` updated |
| 1.8 | Add `save-spritesheet` IPC handler to `main.js` (stub) | Orchestrator | IPC channel registered |
| 1.9 | Update `index.html` script load order | Orchestrator | 5 new script tags, correct order |
| 1.10 | Write `tests/animation-frames.test.js` | Orchestrator | Frame add/remove/navigate + history isolation tests |
| 1.11 | Write `tests/animation-regions.test.js` (partial — stubs only) | Orchestrator | Region struct tests (shift engine tests in Phase 3) |
| 1.12 | Smoke check: `npm start` + `npm test` | Orchestrator | App works as v0.2.0, all tests green |
| 1.13 | Viktor light structural audit | Viktor | Structural verdict |
| 1.14 | Director architecture walkthrough (15 min) | Director + Orchestrator | ✅ Approval Checkpoint #O6-2 |

### Phase Exit Criteria
- All 5 new files exist with documented stub interfaces
- `npm test` green (42 original + new animation frame tests)
- `npm start` — no crash, app identical to v0.2.0 (animation dormant)
- `AppState` has all animation fields
- Viktor structural audit: no blocking findings
- Director has reviewed data structures and greenlit Phase 2

### Resources
| Resource | Estimate |
|----------|----------|
| Claude Code | 2–3 sessions (~20–30% weekly) |
| API (app) | $0.00 |
| Time | 2–3 days |
| Tools | `npm test`, `npm start` |

---

## Phase O6-2: UI Shell

**Days 3–6 | Mandatory — UI chrome must be approved before logic is built on top of it**

**Goal:** The animation tab exists in the DOM. All UI elements are painted — frame strip, Play/Pause,
FPS selector, pose picker, onion skin toggle, region panel. Nothing is wired to logic. Director
approves the visual design before Phase 3 begins.

### Activities

| # | Activity | Who | Output |
|---|----------|-----|--------|
| 2.1 | Design session: Nova refines animation tab layout | Nova | HTML/CSS plan for all animation UI elements |
| 2.2 | Implement animation tab HTML + CSS in `index.html` / `main.css` | Nova | All UI chrome rendered |
| 2.3 | Wire tab switching in `app.js` (show/hide animation panel) | Orchestrator | Tab toggle works |
| 2.4 | Seed frame 0 from current canvas on animation mode enter | Orchestrator | `AnimFrames` seeded |
| 2.5 | Restore frame pixels on animation mode exit | Orchestrator | Canvas restored cleanly |
| 2.6 | Frame strip container (empty — no thumbnails yet, just `+` button) | Nova | Strip placeholder |
| 2.7 | Playback controls row (Play/Pause + FPS select + frame counter) | Nova | Controls visible, non-functional |
| 2.8 | Pose template picker chips (two categories) | Nova | Chips visible, no click handlers |
| 2.9 | Onion skin toggle checkbox | Nova | Checkbox visible |
| 2.10 | Region panel: header + list placeholder + "New Region" button | Nova | Panel structure visible |
| 2.11 | Region paint tool button in toolbar: grayed out + tooltip for < 24×24 | Nova | Size gate CSS + data attribute |
| 2.12 | Canvas layering: onion canvas + region overlay canvas | Orchestrator | Z-index stacking confirmed |
| 2.13 | Background fill control (transparent checkbox + color swatch) | Nova | Control visible |
| 2.14 | Defensive guard: `Timeline.pause()` called on animation mode exit | Orchestrator | No interval leaks |
| 2.15 | Playwright smoke check: screenshot of animation tab UI | Orchestrator | `tests/screenshots/anim-ui-shell-{date}.png` |
| 2.16 | Viktor UI audit | Viktor | Blocking gate before Phase 3 |
| 2.17 | Director live UI review (15–20 min) | Director + Nova | ✅ Approval Checkpoint #O6-3 |

### Phase Exit Criteria
- Clicking "Animation" tab shows animation UI; clicking "Sprite" tab hides it cleanly
- All UI elements from Nova's vision are present (frame strip, controls, picker, panel)
- Region tool grayed out + tooltip correct for sprites < 24×24 at runtime
- Dark theme consistent with rest of app
- Playwright screenshot saved as evidence
- Existing sprite mode: no regressions
- Viktor: no blocking UI findings
- Director: visual sign-off before any logic is written

### Resources
| Resource | Estimate |
|----------|----------|
| Claude Code | 3–4 sessions (~30–40% weekly) |
| API (app) | $0.00 |
| Time | 2–3 days |
| Tools | `playwright-cli` (screenshot), `npm start` |

---

## Phase O6-3: Region Tools

**Days 7–11 | Most complex implementation phase**

**Goal:** Region painting works. The shift engine moves regions correctly. Size gating is
runtime-functional. Background fill is implemented. The animator can define named regions
and use them as the foundation for template generation.

### Activities

| # | Activity | Who | Output |
|---|----------|-----|--------|
| 3.1 | Implement `AnimRegions.addRegion/removeRegion/paintPixel/unpaintPixel/getAll/clear` | Orchestrator | Full `regions.js` implementation |
| 3.2 | Implement `AnimRegions.renderOverlay(ctx, zoom)` | Orchestrator | Colored semi-transparent region overlay |
| 3.3 | Wire region paint tool into canvas event system (`mousedown`/`mousemove` when tool = 'region-paint') | Orchestrator | `canvas.js` updated |
| 3.4 | Implement `AnimRegions.shiftRegion(regionId, dx, dy, backgroundFill)` | Orchestrator | Shift engine: correct pixel movement, clipping, fill |
| 3.5 | Apply shift to active frame + push to per-frame history | Orchestrator | Undo works after region shift |
| 3.6 | Region panel: add/remove regions, color picker, name editing, active region selection | Nova | `animation-panel.js` region section wired |
| 3.7 | Arrow key + button shift controls in region panel | Nova | Shift controls UI wired |
| 3.8 | Runtime size gate: `AnimationPanel.updateSizeGate(w, h)` — blocks tool use below 24×24 | Orchestrator | Size gate enforced in code (not just CSS) |
| 3.9 | Background fill control: `AppState.animBackgroundFill` toggle | Orchestrator | Transparent vs color fill works |
| 3.10 | Extend `tests/animation-regions.test.js` — full shift engine tests | Orchestrator | Edge cases: shift to edge, out-of-bounds clip, zero-pixel region, background fill modes |
| 3.11 | Smoke check: paint 32×32 sprite, define head/torso/legs regions, shift torso up 1px, verify | Orchestrator | Manual verification |
| 3.12 | Playwright screenshot: region overlay visible on test sprite | Orchestrator | `tests/screenshots/region-tool-{date}.png` |
| 3.13 | Viktor **full 8-step QA pipeline** | Viktor | **HARD GATE** — PASS required before Phase 4 |
| 3.14 | Director live demo: define regions, shift one, verify result (20 min) | Director + Orchestrator | ✅ Approval Checkpoint #O6-4 |

### Phase Exit Criteria
- User can select region paint tool, paint pixels, see colored overlay
- Multiple named regions with distinct colors can coexist without overlap
- Shifting a region: pixels move correctly, vacated pixels fill per `animBackgroundFill` setting
- Out-of-bounds pixels are clipped (no crash)
- Below 24×24: region tool is non-interactive at runtime (code-enforced, not just CSS)
- `npm test` green including all region shift tests
- Playwright screenshot saved
- Viktor: PASS verdict
- Director: live demo approved

### Resources
| Resource | Estimate |
|----------|----------|
| Claude Code | 3–5 sessions (~30–50% weekly) |
| API (app) | $0.00 |
| Time | 3–4 days |
| Tools | `npm test`, `playwright-cli`, `npm start` |

---

## Phase O6-4: Pose Template Engine

**Days 11–15 | Core feature — this is what the Director wanted from day one**

**Goal:** Templates generate multi-frame animations from a base sprite. All 6 templates work.
The full pipeline is live: pick template → Apply → frames in strip → Play → animation previews.
Onion skinning works. No-region fallbacks give usable output for sprites without defined regions.

### Activities

| # | Activity | Who | Output |
|---|----------|-----|--------|
| 4.1 | Implement **Idle template** (2 frames: torso/arms -1Y on frame 2) | Orchestrator | S3-validated breathing motion |
| 4.2 | Implement **Walk template** (4 frames: leg split + arm swap, S4-validated) | Orchestrator | Recognizable walk cycle |
| 4.3 | Implement **Jump template** (3 frames: crouch → extend → tuck) | Orchestrator | Jump sequence |
| 4.4 | Implement **Rotation template** (4–8 frames: nearest-neighbor pixel rotation) | Orchestrator | Object rotation animation |
| 4.5 | Implement **Pulse template** (2 frames: inward 1px shrink) | Orchestrator | Pulse/contract effect |
| 4.6 | Implement **Flicker template** (3 frames: base → checkerboard transparent → base) | Orchestrator | Flash/flicker effect |
| 4.7 | No-region fallbacks for character templates (crude but functional) | Orchestrator | Templates work before regions are defined |
| 4.8 | Wire template picker chips → "Apply Template" button → `PoseTemplates.generate()` → `AnimFrames.addFrame()` × N | Orchestrator | End-to-end pipeline: pick → generate → strip |
| 4.9 | Frame strip thumbnail rendering: `AnimationPanel.renderFrameStrip()` | Orchestrator | Thumbnails update correctly after template apply |
| 4.10 | Frame strip click navigation: clicking thumbnail calls `Timeline.goToFrame(idx)` | Orchestrator | Frame navigation works |
| 4.11 | Wire `Timeline.play/pause` to Play/Pause button | Orchestrator | Playback starts/stops |
| 4.12 | Wire FPS selector to `Timeline.setFps(value)` | Orchestrator | FPS changes take effect |
| 4.13 | Implement onion skinning in `AnimationPanel` (prev frame blue ghost, next frame orange ghost) | Orchestrator | Onion skin overlays correct frames |
| 4.14 | Wire onion skin toggle checkbox | Orchestrator | Toggle shows/hides overlay |
| 4.15 | Template picker: selected chip highlight state, loading indicator during generation | Nova | UX polish on template UI |
| 4.16 | Spine resize guard: warn dialog if canvas resized while animation has > 1 frame | Orchestrator | No silent frame destruction |
| 4.17 | Template apply replaces existing frames (documented in code comment — decided here) | Orchestrator | Re-apply is deterministic |
| 4.18 | Smoke check: 32×32 sprite → define regions → apply Walk → Play at 4fps → observe | Orchestrator | Full pipeline verified |
| 4.19 | Playwright screenshot: animation panel with 4 frames in strip, play state | Orchestrator | `tests/screenshots/walk-animation-{date}.png` |
| 4.20 | Viktor targeted functional audit | Viktor | Blocking gate: playback leaks, template output, onion correctness |
| 4.21 | Director live test session (30 min): full animation workflow end-to-end | Director + Nova + Orchestrator | ✅ Approval Checkpoint #O6-5 |

**Live test session agenda (4.21):**
1. Load existing sprite → switch to Animation tab
2. Apply Idle template (no regions) → verify 2-frame breathing at 4fps
3. Define regions (head, torso, legs) → re-apply Idle → compare quality
4. Apply Walk template → verify 4-frame cycle at 4fps
5. Apply Jump template → verify 3-frame sequence
6. Toggle onion skin → verify ghost frames visible
7. Try object template (Rotation) on a coin sprite

### Phase Exit Criteria
- All 6 templates produce correct frame counts and readable animation
- Idle/Walk/Jump: work without regions (fallback) AND with regions (quality)
- Play/Pause + FPS selector wired and functional
- Onion skin shows correct prev/next frame ghosts, toggle works
- Frame strip thumbnails update + click navigation works
- No interval leak: rapid Play/Pause 10× does not increase CPU
- Playwright screenshot saved
- Viktor: PASS verdict
- Director live test session: approved

### Resources
| Resource | Estimate |
|----------|----------|
| Claude Code | 4–5 sessions (~40–50% weekly) |
| API (app) | $0.00 (no AI routes; optional cleanup pass TBD) |
| Time | 3–4 days |
| Tools | `npm start`, `playwright-cli`, manual visual inspection |

---

## Phase O6-5: Export & Integration

**Days 15–17 | Short but critical — the output of all this work reaches the game engine here**

**Goal:** Multi-frame `pxAt()` code exports correctly. Spritesheet PNG saves. Export panel updated
for animation mode. Existing single-frame export behavior unchanged.

### Activities

| # | Activity | Who | Output |
|---|----------|-----|--------|
| 5.1 | Add `Exporter.generateMultiFrame(funcName, framesArray)` to `exporter.js` | Orchestrator | N functions: `baseName_f0`, `_f1` ... with `// Frame N` headers |
| 5.2 | Add `Exporter.toSpritesheetBase64(framesArray, w, h)` — horizontal strip compositor | Orchestrator | Offscreen canvas → base64 PNG |
| 5.3 | Reuse existing `save-png` IPC channel for spritesheet save | Orchestrator | No new IPC channel needed |
| 5.4 | Update export panel: in animation mode, show "Export Animation" + "Save Spritesheet PNG" | Nova | Export panel UI updated |
| 5.5 | Func-name label update: "Base func name:" + hint text in animation mode | Nova | UX clarity |
| 5.6 | Copy to clipboard: multi-frame code copies correctly | Orchestrator | Clipboard works for multi-frame |
| 5.7 | Write `tests/animation-export.test.js` | Orchestrator | Known 2-frame animation → assert function names + pixel rects |
| 5.8 | Smoke check: full pipeline → export code → verify output structure | Orchestrator | Manual verification |
| 5.9 | Viktor code review (advisory level — no full pipeline) | Viktor | Edge case check: 1-frame, empty frames, large frame counts |
| 5.10 | Director export demo (10 min): export Walk animation code, save spritesheet | Director | ✅ Approval Checkpoint #O6-6 |

### Phase Exit Criteria
- Multi-frame pxAt() export: N functions, correct naming, `// Frame N` delimiters
- Spritesheet PNG: all frames composited horizontally, correct pixel dimensions
- Clipboard: multi-frame code copies correctly
- Single-frame export (Sprite mode): unchanged, all existing tests still pass
- `npm test` green including export tests
- Director: export output approved

### Resources
| Resource | Estimate |
|----------|----------|
| Claude Code | 1–2 sessions (~10–20% weekly) |
| API (app) | $0.00 |
| Time | 1–2 days |
| Tools | `npm test`, `npm start`, manual file inspection |

---

## Phase O6-6: Full QA Gate + Release

**Days 17–20 | Non-negotiable — nothing ships without this**

**Goal:** Viktor runs his full 8-step pipeline against the entire O6 feature set. All blocking
issues resolved. Director conducts final live test session. Memory files updated. Tag pushed.

### Activities

| # | Activity | Who | Output |
|---|----------|-----|--------|
| 6.1 | Viktor **full 8-step QA pipeline** — entire O6 feature set | Viktor | Structured report to Director |
| 6.1b | **Persist animation state across tab switches** — keep frames + regions in memory on Sprite↔Animation switch. Only reset on explicit New/resize. (Option A, Director decision 2026-04-02) | Orchestrator | No data loss on accidental tab switch |
| 6.2 | Bug fixes: all blocking issues flagged by Viktor + 6.1b | Orchestrator + Nova | Fixed files, re-reviewed by Viktor |
| 6.3 | Viktor re-audits fixed items, issues final verdict | Viktor | PASS / PASS WITH NOTES / BLOCKED |
| 6.4 | Director final live test session — full end-to-end walkthrough (30 min) | Director | ✅ Approval Checkpoint #O6-7 (Final) |
| 6.5 | Orchestrator updates `orchestrator-memory.md` | Orchestrator | O6 complete, Sprint 2 deferred items |
| 6.6 | Nova updates `nova-memory.md` | Nova | Animation UI decisions, visual notes |
| 6.7 | Viktor updates `viktor-memory.md` | Viktor | QA run history, standing notes |
| 6.8 | Silas: final O6 sprint budget report, update `budget-ledger.json` + `usage-log.jsonl` | Silas | V&V ledger current |
| 6.9 | Update `ROADMAP.md`: O6 marked complete, O6-Sprint-2 stub added | Orchestrator | Roadmap current |
| 6.10 | `git commit` + `git tag v0.3.0-animation` + `git push` | Orchestrator | **Only after Director's explicit approval** |

**Viktor's full QA probe list (from his identity + sprint-specific edge cases):**

| # | Probe |
|---|-------|
| V1 | All new files: IIFE pattern, `'use strict'`, correct load order in `index.html` |
| V2 | No `import/export`, no `require()` in renderer, no `fs` in renderer |
| V3 | Shift engine: pixel lands at correct position, out-of-bounds clipped, background fill applied |
| V4 | Playback: rapid Play/Pause 10× — no setInterval leak (CPU stable) |
| V5 | Tab switch mid-playback: Timeline.pause() called, pixels restored to current frame |
| V5b | Tab switch Anim→Sprite→Anim: frames, regions, and painted pixels fully preserved |
| V6 | Apply template twice: replaces frames (no duplication), comment in code confirms intent |
| V7 | Undo on frame 2 does not affect frame 1 (per-frame history, if Option A) |
| V8 | Resize canvas in animation mode with > 1 frame: warn dialog appears, no silent data loss |
| V9 | Export 1-frame animation: single function, no `_f0` suffix confusion |
| V10 | `npm test` — all tests pass, no skips: 42 original + animation suites |

**Director final live test session agenda (6.4):**
1. Open app → load a 32×32 sprite
2. Switch to Animation tab → apply Idle template → play at 4fps
3. Define 3 regions → re-apply Idle → compare against no-region version
4. Apply Walk template → play at 4fps → verify walk cycle reads correctly
5. Apply Jump template → play → verify crouch/extend/tuck
6. Toggle onion skin on/off
7. Navigate frame strip by clicking thumbnails
8. Export code → paste into text editor → verify `baseName_f0`, `_f1` ... structure
9. Save spritesheet PNG → open in image viewer → verify horizontal strip
10. Switch back to Sprite mode → verify existing tools still work

### Phase Exit Criteria
- Viktor verdict: PASS or PASS WITH NOTES (BLOCKED = no push)
- All blocking issues resolved and re-verified by Viktor
- Director: explicit "push it" / "approved" / "ship it"
- All memory files updated
- `ROADMAP.md` updated
- Tag `v0.3.0-animation` pushed to remote

### Resources
| Resource | Estimate |
|----------|----------|
| Claude Code | 2–3 sessions (~20–30% weekly) |
| API (app) | $0.00 |
| Time | 2–3 days |
| Tools | `npm test`, `playwright-cli` (Viktor independent verification), `git` |

---

## Director Approval Checkpoints

| # | Phase | Trigger | Blocks |
|---|-------|---------|--------|
| O6-1 | Kickoff | Nova's UI vision confirmed, OPEN-1 resolved | Phase O6-1 start |
| O6-2 | Phase 1 exit | Viktor structural audit passed, architecture reviewed | Phase O6-2 start |
| O6-3 | Phase 2 exit | Viktor UI audit passed, visual sign-off | Phase O6-3 start |
| O6-4 | Phase 3 exit | Viktor full QA passed, live region demo | Phase O6-4 start |
| O6-5 | Phase 4 exit | Viktor functional audit passed, live animation demo | Phase O6-5 start |
| O6-6 | Phase 5 exit | Export approved | Phase O6-6 start |
| O6-7 | Phase 6 final | Viktor full QA passed, final live test | git push |

---

## Dependency Graph

```
Kickoff (resolve OPEN-1, OPEN-2)
  │
  ▼
Phase O6-1: Architecture & Data Model
  │  (Viktor structural audit + Director approval)
  ▼
Phase O6-2: UI Shell
  │  (Viktor UI audit + Director visual approval)
  ▼
Phase O6-3: Region Tools
  │  (Viktor full QA + Director live demo)
  ▼
Phase O6-4: Pose Template Engine
  │  (Viktor functional audit + Director live test session)
  ▼
Phase O6-5: Export & Integration
  │  (Viktor code review + Director export demo)
  ▼
Phase O6-6: Full QA Gate + Release
       (Viktor full QA + Director final approval → git push v0.3.0-animation)
```

---

## Architectural Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Per-frame history refactor larger than estimated | Low-Medium | Phase 1 slips 1 day | If Option A grows, descope to Option B for Sprint 1; per-frame history becomes Sprint 2 upgrade |
| Onion skin canvas z-index conflicts with region overlay | Medium | UI looks wrong | Allocate explicit time in Phase 2 for canvas layering. Explicit z-index on all three canvas elements. |
| Template generators poor quality for small sprites | High | Expected, not a bug | No-region fallbacks are intentional minimums. Tooltip: "Best results at 32×32 with regions defined" |
| Playback setInterval leaks on rapid tab switching | Medium | Memory/CPU leak | `Timeline.pause()` called on animation mode exit — wired in Phase 2 even before play is live |
| Sprite resize destroys frames silently | Low | Data loss | Resize guard (warn dialog) implemented in Phase 4, probed by Viktor in Phase 6 |
| Template "Apply" on an existing animation — ambiguity | Medium | Surprising behavior | Replace frames on re-apply. Decision documented in code comment. Confirmed at Phase 4. |

---

## Deferred to Sprint 2

| Item | Decision |
|------|----------|
| D11 — Top-down walk | Sprint 2 backlog |
| D11 — Isometric walk | Sprint 2 backlog |
| D12 — Depth ordering (Z-layers per region) | Data model has optional `zOrder` field (future-proof) — logic deferred |
| D8 — Approach B (AI frame generation) | Architecture supports plug-in — deferred until Director funds API |
| D6 — Fighting poses | Deferred |
| Per-frame history (if Option B chosen at kickoff) | Sprint 2 upgrade if needed |

---

## Critical Files

| File | Why it matters |
|------|---------------|
| `src/core/history.js` | Requires factory refactor if Option A. Determines animation undo architecture. |
| `src/animation/regions.js` | Shift engine correctness is the spine of the whole template system |
| `src/animation/pose-templates.js` | The Director's core motivation — 6 generator functions |
| `src/animation/timeline.js` | Playback correctness + interval lifecycle — Viktor will probe hard |
| `src/core/canvas.js` | Region paint tool integration point, frame-swap on navigate |
| `src/app.js` | AppState extension + tab switching + all module init calls |
| `src/export/exporter.js` | Multi-frame extension of existing greedy rect algorithm |
| `src/index.html` | Script load order = dependency graph for all IIFE modules |

---

## Verification Plan

**End-to-end test (after Phase 6):**
1. `npm start` — app launches clean
2. Open existing sprite (32×32 or larger)
3. Animation tab → Idle template (no regions) → Play 4fps → breathing perceived ✓
4. Define 3 regions → Walk template → Play 4fps → walk cycle perceived ✓
5. Jump template → Play → crouch/extend/tuck perceived ✓
6. Rotation on a coin sprite → Play → rotation perceived ✓
7. Onion skin: toggle on → ghost frames visible on canvas ✓
8. Frame strip: click any thumbnail → canvas shows that frame ✓
9. Export → code output has `_f0`, `_f1` ... functions ✓
10. Save spritesheet PNG → open in image viewer → horizontal strip ✓
11. `npm test` → all tests pass (42 + animation suites) ✓
12. Switch back to Sprite mode → draw a pixel → export pxAt() → existing workflow intact ✓
