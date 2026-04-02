# PixelArtTool — Master Roadmap

**Created:** 2026-03-13
**Last updated:** 2026-04-02
**Author:** Orchestrator
**Approved by:** Director (Eitan)

---

## Studio Context

The PixelArtTool is a studio pipeline asset for an indie game dev studio (Godot, PC games).
It bridges artistic intent and game-ready sprite code. The tool serves the games — not the
other way around.

**Studio decisions (2026-04-02 team meeting):**
- Engine: Godot (C#/C++)
- First game: linear action-platformer, dark/slight-fantasy aesthetic, 8-12 levels
- Sprite sizes: mixed approach (32×32 base, 48-64 for key characters, 16×16 tiles)
- Tool evolves based on game needs, not a standalone feature roadmap

**Pipeline:**
`draw / trace reference → style enforcement → PNG export → png2sprite.js → pxAt() code`
`(future: PNG → Godot spritesheet import)`

---

## Current Status — v0.2.0 shipped, O6 animation sprint in progress

| Milestone | Status | Tag | Date |
|-----------|--------|-----|------|
| v0.1.0 MVP | ✅ Shipped | `v0.1.0-mvp` | 2026-03-15 |
| v0.2.0 Post-MVP | ✅ Shipped | `v0.2.0` | 2026-03-15 |
| O6 Animation (O6-1 to O6-4) | ✅ Complete | — | 2026-03-18 to 2026-03-31 |
| Preview Window Evo 1 (PW-1 to PW-3) | ✅ Complete + pushed | `80fae58` | 2026-04-02 |
| O6-5 Export & Integration | ⏸ Paused | — | — |
| Pre-named regions (UX fix) | 🔜 Next priority | — | — |
| v0.3.0-animation | 🎯 Target | — | TBD |

**Tests:** 127 passing across 9 suites. Zero regressions.

---

## Feature Registry

### Shipped (v0.1.0 MVP)

| # | Feature | Status |
|---|---------|--------|
| M1 | Drawing canvas: pencil, eraser, fill, eyedropper, zoom 2×–24× | ✅ |
| M2 | Palette management (6-color default, max 8, add/remove) | ✅ |
| M3 | Undo/redo (50-step) | ✅ |
| M4 | Reference image side panel | ✅ |
| M5 | Export pxAt() code + clipboard | ✅ |
| M6 | Save/load PNG | ✅ |
| M7 | AI sprite generation (simple sprites/objects — complex chars use Trace) | ✅ |
| M8 | Style enforcement — palette reduction + outline detection, auto-enforce toggle | ✅ |
| M9 | Unit tests for all pure-logic modules (42 tests) | ✅ |

### Shipped (v0.2.0 Post-MVP)

| # | Feature | Status |
|---|---------|--------|
| O1 | Outline detection in enforce.js | ✅ |
| O2 | Sprite dimension presets (16×16, 16×22, 32×32, 64×64, 8×8) | ✅ |
| O3 | Auto-palette extraction from reference image | ✅ |
| O5 | Electron packaged distribution (NSIS installer + portable) | ✅ |

### O6 Animation Sprint (in progress)

| Phase | Feature | Status |
|-------|---------|--------|
| O6-1 | Architecture & data model (AnimFrames, AnimRegions, PoseTemplates, Timeline) | ✅ Complete |
| O6-2 | UI shell (animation tab, bottom bar, pose chips, region panel, canvas layering) | ✅ Complete |
| O6-3 | Region workflow, pose generation, shift engine | ✅ Complete |
| O6-4 | Pose template engine (Idle/Walk/Jump/Rotation/Pulse/Flicker) | ✅ Complete |
| PW-1/2/3 | Preview Window Evolution 1 (separate BrowserWindow, sync, playback) | ✅ Complete + pushed |
| **Regions UX** | **Pre-named regions (head, torso, arms, legs) — ASAP priority** | 🔜 Next |
| O6-5 | Export & Integration (spritesheet PNG + multi-frame pxAt) | ⏸ Paused — after regions UX |

### Future / Deferred

| # | Feature | Notes |
|---|---------|-------|
| O4 | Style presets (Shovel Knight / Metal Slug modes) | Post-animation |
| O7 | Refactor greedy rect algorithm (exporter.js + png2sprite.js dedup) | Code health, low priority |
| O8 | Option F — external image gen API → Trace pipeline | Post-MVP, requires funding |
| PW-Evo2 | Preview: docked panel with detach capability (replaces separate window) | Design TBD — Nova |
| Godot | Godot spritesheet export integration (Phase 7+) | After Game One definition |

---

## Completed Phases (v0.1.0 + v0.2.0)

All original phases 0–7 are complete. Detailed history preserved in `archive/PLAN-MVP-V010-DRAFT.md`.

| Phase | Name | Result |
|-------|------|--------|
| 0 | Kickoff & Audit | ✅ 5 blockers found and fixed |
| 1 | MVP Completion (enforce.js + blocker fixes) | ✅ |
| 2 | AI Generation Quality (chain-of-thought prompt) | ✅ |
| 3 | Testing & Convention Hardening (42 tests) | ✅ Viktor PASS |
| 4 | MVP QA Gate & First Push | ✅ v0.1.0-mvp tagged |
| 5 | Docs & Memory Updates | ✅ |
| 6 | Post-MVP Sprint (O1+O2+O3+O5) | ✅ |
| 7 | v0.2.0 QA Gate & Release Push | ✅ v0.2.0 tagged |

---

## Active Sprint: O6 Animation + UX Fixes

**Full sprint plan:** [PLAN-O6-ANIMATION-SPRINT.md](PLAN-O6-ANIMATION-SPRINT.md)
**Preview window plan:** [PLAN-PREVIEW-WINDOW.md](PLAN-PREVIEW-WINDOW.md) (Evo 1 complete)

### Immediate Priority: Pre-Named Regions

Director decision (2026-04-02): regions must have pre-existing names, not free-form text.

**Required names:** `head`, `torso`, `left-arm`, `right-arm`, `left-leg`, `right-leg`
**Escape hatch:** "Add Custom" option for `weapon`, `shield`, `effect`, or user-defined
**Why:** Pose templates already look for these names. Free-form naming creates a silent failure path — user types "Head" instead of "head" and the Walk template produces no movement. Pre-defined names close the loop.

**After regions UX:** Live test with Director → then proceed to O6-5 Export.

### O6-5 Export (paused, resumes after regions)

- Spritesheet PNG (horizontal strip)
- Multi-frame pxAt() code export
- Per-frame function naming (`baseName_f0`, `baseName_f1`)
- Frame delimiter comments

---

## Path to v0.3.0-animation

```
Pre-named regions (UX fix)
    │
    ▼
Director live test (regions + preview)
    │
    ▼
O6-5 Export & Integration
    │
    ▼
Viktor full QA pipeline
    │
    ▼
Director approval → tag v0.3.0-animation → push
```

---

## Path to Game One

```
v0.3.0-animation shipped
    │
    ▼
Game One constraint document (scope, levels, mechanics, art budget)
    │
    ▼
Godot spike (import spritesheet, get character walking)
    │
    ▼
Studio bootstrap (new project, new CLAUDE.md, team carries over)
    │
    ▼
PixelArtTool → maintenance track (features driven by game needs)
```

---

## Team Meeting Decisions Log

### 2026-04-02 — PW-3 Review + Studio Vision

| # | Decision |
|---|----------|
| D1 | PixelArtTool stays alive, continues development with roadmap tweaks |
| D2 | Pre-named regions — ASAP priority, must live test with preview before proceeding |
| D3 | Tech stack stays JS/Electron (tool and game don't share language) |
| D4 | Game One: linear action-platformer, dark/slight-fantasy aesthetic, 8-12 levels, mixed-size sprites |
| D5 | PW-3 pushed (Viktor PASS WITH NOTES, all findings resolved) |

---

## Team Reference

| Handle | Role | Gate authority |
|--------|------|----------------|
| Director | Vision, final approval, push authorization | All checkpoints + every git push |
| Orchestrator | Implementation lead, inter-team coordination | Owns code output |
| Nova | All visual/UX/aesthetic decisions | UI changes + AI quality |
| Viktor | Code quality, convention compliance, tests, pre-push gate | Blocks push if BLOCKED |
| Silas | Budget & resource management (V&V) | Budget alerts + API lock |

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Electron + JS/HTML5 Canvas | Best fit for pixel art tool: canvas API, overlay layering, cross-platform |
| All fs ops through IPC in main.js | Security: renderer never touches filesystem |
| IIFE module pattern | No bundler, explicit load order in index.html |
| Per-frame undo (history factory) | Industry standard (Aseprite, Photoshop). `makeHistory()` in history.js |
| AI generation scoped to simple sprites | Complex characters use Trace. Model ceiling confirmed. |
| png2sprite.js self-contained | Shared across game projects. No new imports. |
| Preview window self-contained | Own HTML/CSS/JS, own preload. IPC namespace: `preview:*` / `editor:*` |
| Pre-named regions (pending impl) | Pose templates expect specific names. Free-form creates silent failures. |

---

## QA History Summary

| Version/Phase | Verdict | Tests |
|---------------|---------|-------|
| Phase 3 (codebase audit) | PASS | 42 |
| Phase 7 / v0.2.0 | PASS | 42 |
| O6-1 Architecture | PASS WITH NOTES | 87 |
| O6-2 UI Shell | PASS WITH NOTES | 87 |
| O6-3 Region Workflow | PASS WITH NOTES | 127 |
| O6-4 Pose Templates | PASS WITH NOTES | 127 |
| PW-3 Preview Sync | PASS WITH NOTES | 127 |

**Convention repeat offender:** CSS `.tool-btn.anim-only { display: none }` — must use explicit `style.display = 'flex'`, never empty string.

---

## Archive

Completed/superseded plans moved to `plans/archive/`:
- `PLAN-MVP-V010-DRAFT.md` — original MVP plan (v0.1.0 shipped)
- `PLAN-NOVA-BOOTSTRAP.md` — Nova design team bootstrap (completed)
- `PLAN-O6-ANIMATION-SPRINT-EARLY-DRAFT.md` — early O6 draft (superseded)
- `PLAN-SPRITE-PIPELINE.md` — png2sprite.js pipeline (implemented)
