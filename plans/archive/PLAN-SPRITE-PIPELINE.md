# O6 Animation Sprint 1 — Full Roadmap

## Context

PixelArtTool v0.2.0 shipped 2026-03-15 with all MVP + optional features complete (42 tests passing). The O6 Animation Sprint is the Director's highest priority — the original motivating vision for the tool. Spike POC passed all 5 criteria on 2026-03-16 (region-based frame generation at 32x32, Idle breathing + Walk mid-stride at 4fps). This roadmap covers the full Sprint 1 implementation: platformer side-view animations only.

**Sprint scope (locked decisions D1-D13):** Single animation mode, Approach C (region marking + algorithmic shifts), platformer side-view only, Idle/Jump/Walk priority, region tools gated at 24x24+, depth ordering deferred to Sprint 2.

---

## Pre-Sprint: Lock Open Decisions

Two decisions must be resolved at Sprint Kickoff before any code:

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| **History model** | Per-frame undo | Current History stores full pixel arrays. Global undo across all frames = massive memory. Per-frame keeps same profile, matches user expectation (undo affects current frame only). |
| **Export format** | Horizontal spritesheet PNG + per-frame `pxAt()` functions | `_drawSprite_idle_0(ctx,bx,by)`, `_drawSprite_idle_1(ctx,bx,by)` + wrapper with frame index. Matches Ages of War engine consumption pattern. |

---

## Sprint Kickoff Meeting

**Attendees:** Director, Orchestrator, Nova, Viktor, Silas
**Agenda:**
1. Director confirms sprint scope (platformer side-view, Idle/Jump/Walk)
2. Lock open decisions (history model, export format)
3. Silas reads budget status, sets sprint ceiling
4. Nova presents animation UI vision overview
5. Viktor confirms QA checkpoint placement
6. Orchestrator presents phase dependency graph
7. Director approval to begin Phase 1

**Resources:** ~500 tokens | No API calls

---

## Phase 1: Data Model & Frame Engine (Foundation)

**Goal:** Build animation data model (frames, regions, poses) and frame generation engine. Pure logic — no UI. Fully unit-testable.

**Why first:** Everything depends on this. UI can't bind without a data model. Export can't work without frames.

### Tasks

| # | Task | Team | Resources |
|---|------|------|-----------|
| 1.1 | Create `src/core/animation.js` — AnimationState IIFE: frames array, currentFrame, fps, mode toggle, addFrame/removeFrame/duplicateFrame/reorderFrame, getCurrentFrame/setCurrentFrame | Orchestrator | ~2000 tokens |
| 1.2 | Create `src/core/region.js` — Region model IIFE (port from spike): region def `{name, bounds, priority, pixels}`, `extractRegions()`, `generateFrame()`, `canUseRegions()` gate | Orchestrator | ~1500 tokens |
| 1.3 | Create `src/core/pose.js` — Pose templates IIFE: Character (Idle/Walk/Jump) + Object (Rotation/Pulse/Flicker), `getPoseShifts(poseName, frameIdx, totalFrames)`, `listPoses()` | Orchestrator | ~1000 tokens |
| 1.4 | Extend `src/core/history.js` — FrameHistory wrapper: per-frame History instance, `switchFrame(idx)`, backward compatible with sprite mode | Orchestrator | ~500 tokens |
| 1.5 | Extend `AppState` in `app.js` — add `mode: 'sprite'`, `animationState: null` | Orchestrator | ~300 tokens |
| 1.6 | Wire `PixelCanvas` — when animation mode active, `getPixels()`/`setPixels()` delegate to current frame | Orchestrator | ~500 tokens |

### QA Checkpoint (Viktor — Micro-QA)
- IIFE pattern compliance in all new files
- No `require`/`fs` in renderer modules
- Script load order correct in `index.html`
- AppState remains single source of truth
- **Est:** ~400 tokens

### Tests (Orchestrator)
| Suite | Cases |
|-------|-------|
| `tests/animation.test.js` | addFrame, removeFrame min-1 floor, duplicateFrame deep copy, reorderFrame bounds, currentFrame switching |
| `tests/region.test.js` | extractRegions from spike data, generateFrame with shifts, canUseRegions gate (23x23 vs 24x24) |
| `tests/pose.test.js` | getPoseShifts correct dx/dy per pose, Walk frame count, listPoses categories |
**Est:** ~1700 tokens

### Phase 1 Gate
- **Viktor full QA pipeline** (~800 tokens): code structure, bugs, readability, conventions, tests, report
- **Review meeting:** Director reviews Viktor's report, approves/blocks Phase 2
- **Live test:** `npm test` — all new + existing tests pass

### Phase 1 Budget (Silas)
| Category | Tokens |
|----------|--------|
| Code generation | 5,800 |
| Tests | 1,700 |
| QA (micro + full) | 1,200 |
| Meetings | 800 |
| **Phase 1 Total** | **9,500** |
| API cost | $0.00 |
| CC session usage | ~15-20% daily |

---

## Phase 2: Animation UI (Nova's Vision)

**Goal:** Build the full animation UI — mode toggle, frame strip, play/pause, region tools panel, onion skinning, pose picker. Wire to Phase 1 data model.

**Dependency:** Phase 1 complete

### Nova Design Session (Phase 2 Kickoff)
Nova finalizes layout details with Director:
- Animation tab position (topbar toggle)
- Frame strip height and placement (below canvas)
- Region panel placement (right panel, animation-only section)
- CSS variables consistent with existing dark theme
- **Est:** ~600 tokens

### Tasks

| # | Task | Team | Resources |
|---|------|------|-----------|
| 2.1 | Add animation mode toggle to topbar (`toolbar.js` + `index.html`) — "Sprite Mode" / "Animation Mode" button, shows/hides animation UI | Orchestrator | ~500 tokens |
| 2.2 | Create `src/ui/frame-strip.js` — horizontal thumbnail row below canvas, click to select, "+" to add, "-" to remove, active frame highlight, auto-refresh thumbnails on pixel change | Orchestrator | ~1500 tokens |
| 2.3 | Create `src/ui/play-controls.js` — Play/Pause with `setInterval` frame cycling, FPS slider (1-12, default 4), frame counter "Frame 2/6" | Orchestrator | ~800 tokens |
| 2.4 | Create `src/ui/region-panel.js` — region list with color overlays, region name/priority editing, "Apply Pose" button, grayed out below 24x24 with tooltip | Orchestrator | ~1200 tokens |
| 2.5 | Create `src/ui/pose-picker.js` — two-category selector (Character Poses / Object Poses), selection triggers frame generation, preview "generates N frames" | Orchestrator | ~700 tokens |
| 2.6 | Implement onion skinning in `canvas.js` — toggle button, prev frame at 20% opacity, next at 10%, animation mode only | Orchestrator | ~800 tokens |
| 2.7 | Update `index.html` — new grid row for frame strip, animation panel section, script tags in correct load order | Orchestrator | ~600 tokens |
| 2.8 | Update `styles/main.css` — frame strip, animation toolbar, region overlay, pose picker styles | Orchestrator (Nova reviews) | ~800 tokens |

### QA Checkpoint (Viktor — Micro-QA)
- All new UI modules follow IIFE pattern
- Script load order (no dependency violations)
- Animation UI hides completely in sprite mode (no visual regression)
- CSS doesn't break existing panels
- **Est:** ~500 tokens

### Live Test Session (Orchestrator + Playwright)
1. Toggle animation mode on/off — verify UI appears/disappears
2. Add 3 frames, navigate between them
3. Draw on frame 2, verify frame 1 unchanged
4. Play animation, verify cycling at set FPS
5. Enable onion skinning, verify ghost overlay
6. Screenshots to `tests/screenshots/`
- **Est:** ~600 tokens

### Phase 2 Gate
- **Viktor full QA** (~800 tokens): UI state consistency, frame strip memory cleanup, keyboard shortcuts still work
- **Review meeting:** Nova reviews screenshots against vision, Director approves
- **Est meeting:** ~400 tokens

### Phase 2 Budget (Silas)
| Category | Tokens |
|----------|--------|
| Code generation | 6,900 |
| Design session | 600 |
| Live test | 600 |
| QA (micro + full) | 1,300 |
| Meetings | 1,000 |
| **Phase 2 Total** | **10,400** |
| API cost | $0.00 |
| CC session usage | ~20-25% daily |

---

## Phase 3: Region Workflow & Pose Generation (Integration)

**Goal:** Wire the full end-to-end workflow: mark regions on sprite, pick pose template, system generates animation frames. Spike's proven logic meets the UI.

**Dependency:** Phase 1 + Phase 2 complete

### Tasks

| # | Task | Team | Resources |
|---|------|------|-----------|
| 3.1 | Implement rect selection tool for region marking on canvas — new "region-select" tool mode, click-drag rectangle, prompt for region name, colored border overlay | Orchestrator | ~1000 tokens |
| 3.2 | Wire pose template → frame generation pipeline: user selects pose → extract regions → apply shifts → generate N frames → add to frame strip | Orchestrator | ~800 tokens |
| 3.3 | Implement Idle pose: 2-frame breathing (frame 0: base, frame 1: torso/arms -1Y) | Orchestrator | ~400 tokens |
| 3.4 | Implement Jump pose: 3-frame (standing → crouch → airborne) | Orchestrator | ~500 tokens |
| 3.5 | Implement Walk pose: 4-frame cycle (base → L-fwd → passing → R-fwd) | Orchestrator | ~600 tokens |
| 3.6 | Implement Object poses: Rotation (4-frame), Pulse (2-frame), Flicker (2-frame) | Orchestrator | ~600 tokens |
| 3.7 | Manual frame editing — verify drawing tools work per-frame, per-frame undo correct, frame isolation | Orchestrator | ~400 tokens |

### QA Checkpoint (Viktor — Micro-QA)
- Region extraction edge cases (boundary overlap, empty region)
- Pose generation doesn't corrupt base frame
- Manual edits after pose generation persist correctly
- **Est:** ~500 tokens

### Tests
| Suite | Cases |
|-------|-------|
| `tests/region-workflow.test.js` | Full pipeline: define regions → apply idle → verify 2 frames with correct shifts |
| Add to `tests/region.test.js` | Edge: region outside sprite, zero-pixel region, overlapping regions |
| Add to `tests/pose.test.js` | Walk 4-frame: each frame unique and symmetric |
**Est:** ~1000 tokens

### Live Test Session (Full E2E)
1. Draw/load 32x32 character sprite
2. Enter animation mode, mark 5 regions (head, torso, l-arm, r-arm, legs)
3. Apply Idle pose → verify 2 breathing frames
4. Clear, apply Walk pose → verify 4-frame cycle
5. Play at 4fps, verify animation quality
6. Edit frame 2 manually, verify frame isolation
7. Screenshots to `tests/screenshots/`
- **Est:** ~800 tokens

### Phase 3 Gate
- **Viktor full QA** (~800 tokens): data integrity (base frame mutation?), region overlap, frame strip sync
- **Review meeting:** Director tests workflow live, Nova reviews animation quality
- **Est meeting:** ~400 tokens

### Phase 3 Budget (Silas)
| Category | Tokens |
|----------|--------|
| Code generation | 4,300 |
| Tests | 1,000 |
| Live test | 800 |
| QA (micro + full) | 1,300 |
| Meeting | 400 |
| **Phase 3 Total** | **7,800** |
| API cost | $0.00 |
| CC session usage | ~15-18% daily |

---

## Phase 4: Export & Spritesheet (Output)

**Goal:** Export animation frames as spritesheet PNG + per-frame `pxAt()` code. Complete the pipeline from creation to game-ready code.

**Dependency:** Phase 3 complete

### Tasks

| # | Task | Team | Resources |
|---|------|------|-----------|
| 4.1 | Extend `exporter.js` — multi-frame `pxAt()` generation: `_drawSprite_idle_0()`, `_drawSprite_idle_1()`, wrapper function with frame index, header comment (count/fps/pose) | Orchestrator | ~1200 tokens |
| 4.2 | Implement spritesheet PNG export — horizontal strip, 1px transparent gap, new IPC channel `save-spritesheet` in `main.js` + `preload.js` | Orchestrator | ~800 tokens |
| 4.3 | Update `output-panel.js` — "Export All Frames" + "Save Spritesheet PNG" buttons in animation mode, preview all functions, clipboard copy | Orchestrator | ~600 tokens |
| 4.4 | Update `tools/png2sprite.js` — new `--spritesheet --frames N --fw W` flag, splits strip into N frames, generates per-frame functions. Stays self-contained (pngjs + fs only). | Orchestrator | ~800 tokens |

### QA Checkpoint (Viktor — Micro-QA)
- Exported `pxAt()` code is syntactically valid JS
- Spritesheet PNG dimensions correct (frameW * count + gaps)
- `png2sprite.js` remains self-contained, single-frame mode unbroken
- **Est:** ~400 tokens

### Tests
| Suite | Cases |
|-------|-------|
| Add to `tests/exporter.test.js` | Multi-frame: 2 frames → 2 functions + wrapper, names correct |
| `tests/spritesheet.test.js` | Strip layout: 3 frames 16x16 → 50x16 PNG, correct pixel data per frame |
**Est:** ~800 tokens

### Live Test Session
1. 32x32 character → Idle animation (2 frames)
2. Export pxAt() → verify 2 functions + wrapper
3. Copy to clipboard, paste into test HTML, verify renders
4. Save spritesheet PNG, verify dimensions
5. Run `png2sprite.js --spritesheet` on saved PNG, verify matches
- **Est:** ~600 tokens

### Phase 4 Gate
- **Viktor full QA** (~800 tokens): pxAt() correctness, spritesheet alignment, png2sprite.js backward compat
- **Review meeting:** Director pastes code into Ages of War test harness, confirms it works
- **Est meeting:** ~400 tokens

### Phase 4 Budget (Silas)
| Category | Tokens |
|----------|--------|
| Code generation | 3,400 |
| Tests | 800 |
| Live test | 600 |
| QA (micro + full) | 1,200 |
| Meeting | 400 |
| **Phase 4 Total** | **6,400** |
| API cost | $0.00 |
| CC session usage | ~12-15% daily |

---

## Phase 5: Polish, Edge Cases & Final Sprint QA Gate

**Goal:** Harden edge cases, add keyboard shortcuts, Nova UX review, comprehensive testing, Viktor's final sprint-level QA gate.

**Dependency:** Phases 1-4 complete

### Tasks

| # | Task | Team | Resources |
|---|------|------|-----------|
| 5.1 | Edge case hardening — canvas resize in animation mode (all frames resize), mode switch handling (keep frame 0?), PNG load in animation mode (becomes frame 0), clear behavior | Orchestrator | ~800 tokens |
| 5.2 | Keyboard shortcuts — Left/Right: prev/next frame, Space: play/pause, Shift+D: duplicate, Delete: remove frame | Orchestrator | ~400 tokens |
| 5.3 | Nova UX review — review all animation UI screenshots, flag misalignments, approve or request changes | Nova | ~400 tokens |
| 5.4 | Fix Nova-flagged issues | Orchestrator | ~500 tokens (est.) |
| 5.5 | Final test suite expansion — integration tests, edge case tests, target 60+ tests total (42 existing + ~20 new) | Orchestrator | ~800 tokens |
| 5.6 | Comprehensive live test — full workflow at 16x16 (no regions), 24x24 (regions activate), 32x32, 64x64, every pose, every export | Orchestrator | ~600 tokens |

### Final Sprint QA Gate (Viktor — FULL PIPELINE)
1. Code structure & organization (all new files)
2. Bug & edge case check (animation-specific)
3. Readability & maintainability review
4. Convention compliance (CLAUDE.md rules)
5. Full test suite (`npm test` — 60+ tests)
6. Return issues → Orchestrator fixes → re-test
7. Director report with verdict: PASS / PASS WITH NOTES / BLOCKED
- **Est:** ~1200 tokens

### Phase 5 Gate
- Viktor's final report to Director
- Director decides: **SHIP** or **FIX**
- **Est meeting:** ~400 tokens

### Phase 5 Budget (Silas)
| Category | Tokens |
|----------|--------|
| Code/fixes | 2,500 |
| Nova review | 400 |
| Tests | 800 |
| Live test | 600 |
| Final QA | 1,200 |
| Meeting | 400 |
| **Phase 5 Total** | **5,900** |
| API cost | $0.00 |
| CC session usage | ~10-12% daily |

---

## Sprint Retrospective (All Hands)

**Attendees:** Director, Orchestrator, Nova, Viktor, Silas
**Agenda:**
1. What went well / what was harder than expected
2. Sprint 2 backlog review: depth ordering, top-down walk, isometric walk, fighting poses, Approach B (AI frame gen)
3. Silas final budget report
4. All team members update their memory files
- **Est:** ~500 tokens

---

## Total Sprint Budget (Silas Summary)

| Phase | Tokens | API Cost | CC Session % |
|-------|--------|----------|-------------|
| Sprint Kickoff | 500 | $0.00 | 1% |
| Phase 1: Data Model | 9,500 | $0.00 | 15-20% |
| Phase 2: Animation UI | 10,400 | $0.00 | 20-25% |
| Phase 3: Region Workflow | 7,800 | $0.00 | 15-18% |
| Phase 4: Export | 6,400 | $0.00 | 12-15% |
| Phase 5: Polish & Gate | 5,900 | $0.00 | 10-12% |
| Retrospective | 500 | $0.00 | 1% |
| **SPRINT TOTAL** | **~41,000** | **$0.00** | **~75-90%** |
| Contingency (10%) | ~4,000 | — | — |
| **GRAND TOTAL** | **~45,000** | **$0.00** | — |

### If AI Cleanup Pass Is Enabled (Optional Add-On)

AI cleanup sends each generated frame to Claude Sonnet for pixel-level polish. Per call: ~$0.005-0.01.

| Scenario | Est. API Cost |
|----------|---------------|
| All sprint poses, single pass (17 frames) | $0.10-0.17 |
| With dev/debug iterations (3-5x) | $0.30-0.85 |
| With multiple sprite sizes tested (5-8x) | $0.50-1.35 |
| **Realistic sprint total** | **$0.50-1.00** |

**With AI cleanup, revised budget:**

| | Without AI Cleanup | With AI Cleanup |
|---|---|---|
| Token cost | ~45,000 | ~45,000 |
| API cost | $0.00 | $0.50-1.00 |
| Usable budget remaining | $4.00 | $3.00-3.50 |
| Alert level | NORMAL | NORMAL |

**Silas notes:**
- **Without AI cleanup:** Zero API spend. Approach C is entirely algorithmic. The $4.00 usable budget stays untouched.
- **With AI cleanup:** $0.50-1.00 API spend. Still well within budget (75-87.5% usable remaining). Alert stays NORMAL.
- **Claude Code session usage is the binding constraint.** Sprint spans 3-4 sessions across 2-3 days. Target 1-2 phases per session.
- **AI cleanup is opt-in per phase.** Director can enable/disable it at any gate. No upfront commitment needed.
- **Current budget health:** $4.87 remaining, $4.00 usable, $0.87 floor. Alert: NORMAL (>30% usable).

---

## Dependency Graph

```
Sprint Kickoff (lock decisions)
        │
        v
Phase 1: Data Model & Frame Engine
        │
        v
Phase 2: Animation UI  ◄── Nova design session
        │
        v
Phase 3: Region Workflow & Pose Generation
        │
        v
Phase 4: Export & Spritesheet
        │
        v
Phase 5: Polish, Edge Cases, Final QA Gate
        │
        v
Sprint Retrospective
```

Strictly sequential — animation is a vertical feature, each layer depends on the one below.

---

## Risk Register

| Risk | Prob | Impact | Mitigation |
|------|------|--------|------------|
| Per-frame History memory blowout (8+ frames, 64x64) | Med | High | Cap 12 frames, 20 undo steps per frame (not 50), lazy alloc |
| Onion skinning performance on large sprites | Low | Med | Offscreen canvas, re-render only on frame change |
| Region marking UX confusion | Med | Med | Nova reviews Phase 5, clear tooltips, default region presets |
| Frame strip thumbnail jank | Med | Low | Throttle refresh to 2fps, requestAnimationFrame debounce |
| Walk cycle looks wrong at small sizes | Med | High | Gate walk to 32x32+ if 24x24 looks bad, document |
| Canvas resize loses frame data | Low | High | Deep copy all frames on resize, warn on shrink |
| Session limit hit mid-phase | Med | Med | 1-2 phases per session, memory updates at boundaries |
| png2sprite.js spritesheet flag breaks existing usage | Low | High | Opt-in flag only, regression test for single-frame |

---

## Files Summary

### New Files (12)
| File | Purpose |
|------|---------|
| `src/core/animation.js` | Animation state, frame management |
| `src/core/region.js` | Region model, extraction, frame generation |
| `src/core/pose.js` | Pose template definitions |
| `src/ui/frame-strip.js` | Frame thumbnail strip |
| `src/ui/play-controls.js` | Play/Pause/FPS controls |
| `src/ui/region-panel.js` | Region marking tools |
| `src/ui/pose-picker.js` | Pose template selector |
| `tests/animation.test.js` | Animation model tests |
| `tests/region.test.js` | Region model tests |
| `tests/pose.test.js` | Pose template tests |
| `tests/region-workflow.test.js` | Integration workflow tests |
| `tests/spritesheet.test.js` | Spritesheet export tests |

### Modified Files (11)
| File | Changes |
|------|---------|
| `src/core/canvas.js` | Onion skinning, animation mode delegation |
| `src/core/history.js` | FrameHistory wrapper |
| `src/app.js` | Animation AppState fields, mode toggle |
| `src/ui/toolbar.js` | Mode toggle, region-select tool |
| `src/index.html` | New UI elements, script tags, grid row |
| `src/styles/main.css` | Animation UI styles |
| `src/export/exporter.js` | Multi-frame pxAt() generation |
| `src/ui/output-panel.js` | Animation export buttons |
| `src/main.js` | save-spritesheet IPC channel |
| `src/preload.js` | save-spritesheet bridge |
| `tools/png2sprite.js` | --spritesheet flag |

---

## Verification Plan

After each phase, run:
1. `npm test` — all tests pass (growing from 42 → 60+)
2. `npm start` — app launches, no crash
3. Playwright smoke test — feature-specific interaction + screenshots
4. Viktor QA pipeline — full review before Director approval

Final sprint verification:
1. Full E2E: draw sprite → animation mode → mark regions → apply pose → preview → export pxAt() → save spritesheet
2. Paste exported code into HTML test harness → renders correctly
3. `png2sprite.js --spritesheet` round-trip → matches
4. All 60+ tests green
5. Viktor PASS verdict + Director approval → push
