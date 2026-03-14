# PixelArtTool — Full Project Roadmap

**Created:** 2026-03-13
**Author:** Orchestrator
**Approved by:** Director (Eitan)

---

## Context

The PixelArtTool scaffold was completed on 2026-03-13. The codebase is ~85% implemented — most modules have working code. This roadmap maps the path from current state to a shipped, tested, push-ready v0.1.0 (MVP), with an optional post-MVP sprint to v0.2.0.

The plan accounts for all team touchpoints: Director approvals, Nova design sessions, Viktor QA gates, and inter-team collaboration — not just coding tasks.

---

## Overall Vision

**One-line:** A standalone Electron desktop app that bridges artistic intent and the `fillRect` sprite engine used in the Director's games.

**Pipeline:**
`description / reference image → Claude Vision → style enforcement → PNG export → png2sprite.js → paste-ready pxAt() code`

**End state:** The Director opens the tool, types a description or loads a reference image, hits Generate, adjusts a few pixels manually, clicks Export, and pastes working `pxAt()` sprite code directly into Ages of War. Total time from concept to code: under 5 minutes.

---

## Feature Registry

### Mandatory (MVP — must ship before first push)

| # | Feature | Current State |
|---|---------|---------------|
| M1 | Drawing canvas: pencil, eraser, fill, eyedropper | ✅ Done |
| M2 | Palette management (6-color, max 8) | ✅ Done |
| M3 | Undo/redo (50-step) | ✅ Done |
| M4 | Reference image side panel | ✅ Done |
| M5 | Export pxAt() code + clipboard | ✅ Done |
| M6 | Save/load PNG | ✅ Done |
| M7 | AI sprite generation (text + reference → canvas) | ⚠️ Partial — static system prompt, no JSON validation |
| M8 | Style enforcement — palette reduction (max 6 colors) | ❌ Missing — `enforce.js` not created |
| M9 | Unit tests for all pure-logic modules | ❌ Missing — `tests/` empty |

### Optional (post-MVP, Director selects at Phase 4 retrospective)

| # | Feature | Effort | Value |
|---|---------|--------|-------|
| O1 | Outline detection in `enforce.js` | Medium | High |
| O2 | Sprite dimension presets (16×22, 16×16, 8×8…) | Low | High daily-use |
| O3 | Auto-palette extraction from reference image | Medium | Good UX |
| O4 | Style presets (Shovel Knight / Metal Slug modes) | Medium | Medium |
| O5 | Electron packaged distribution (installer) | Low | Operational |
| O6 | Animation frame support | **High — separate sprint** | Future |
| O7 | Refactor greedy rect algorithm — shared module for `exporter.js` + `png2sprite.js` | Low | Code health |

---

## Team Reference

| Handle | Role | Gate authority |
|--------|------|----------------|
| Director | Vision, final approval, push authorization | All checkpoints + every git push |
| Orchestrator | Implementation lead, inter-team coordination | Owns code output |
| Nova | All visual/UX/aesthetic decisions | UI changes + AI quality |
| Viktor | Code quality, convention compliance, tests, pre-push gate | Blocks push if BLOCKED |

**Activate:** `/nova` · `/viktor`
**Communication format:** `**[Speaker] → @[Recipient]:** message`

---

## Schedule Overview

| Phase | Name | Days | Token % | Mandatory |
|-------|------|------|---------|-----------|
| 0 | Kickoff & Audit | Day 1 (morning) | 5% | Yes |
| 1 | MVP Completion (enforce.js) | Days 1–3 | 30% | Yes |
| 2 | AI Generation Quality | Days 2–4 | 20% | Yes |
| 3 | Testing & Convention Hardening | Days 3–5 | 20% | Yes |
| 4 | MVP QA Gate & First Push | Day 5 | 10% | Yes |
| 5 | Docs & Memory Updates | Day 6 | 5% | Yes |
| 6 | Post-MVP Optional Sprint | Days 6–8 | 7% | No |
| 7 | v1.1 QA Gate & Release Push | Day 8 | 3% | No |
| | **TOTAL** | **8 days** | **100%** | |

> Phase 6 budget assumes Director selects O1+O2+O3+O5. Selecting O6 (animation) adds ~15–20% and 3–4 days — treat as a separate roadmap.

---

## Phase 0 — Kickoff & Audit ✅ COMPLETE 2026-03-14
**Day 1 morning | 5% budget | Mandatory**

| Activity | Who | Output |
|----------|-----|--------|
| 0.1 Director Briefing — confirm MVP scope, approve feature list | Director + All | ✅ Approval Checkpoint #1 — **APPROVED 2026-03-14** |
| 0.2 Orchestrator full codebase audit — trace every module, catalog state | Orchestrator | ✅ Complete 2026-03-14 |
| 0.3 Viktor pre-audit read-only pass — log findings to `viktor-memory.md` | Viktor | ✅ Complete 2026-03-14 — 5 blockers, 10 advisories |
| 0.4 Nova enforce UX decision | Nova + Director | ✅ Complete — auto-enforce with toggle |

**Phase 0 Audit Result: 5 BLOCKERS found — must be resolved before Phase 1 coding begins.**

---

## Phase 1 — Blocker Fixes + MVP Completion
**Days 1–3 | 30% budget | Mandatory**
*Runs in parallel with Phase 2 from Day 2*

### Phase 1 — Part A: Blocker Fixes (prerequisite — do before any new code)

| # | Fix | Who | Files touched |
|---|-----|-----|---------------|
| B1 | Export public `redraw()` from canvas IIFE, update `generate.js` to call it | Orchestrator | `canvas.js`, `generate.js` |
| B2 | Fix History sequence: zero pixels manually (no `clear()`), write all pixels, then `History.push()` once | Orchestrator | `generate.js` |
| B3 | Move API calls to `main.js` — new IPC channel `generate-sprite`. Renderer sends prompt, main calls Claude, returns result only. Key never leaves main. | Orchestrator | `main.js`, `preload.js`, `client.js`, `generate.js` |
| B4 | Decide + document Jest strategy for IIFE modules before Phase 3 | Viktor + Orchestrator | `tests/` setup |
| B5 | Disable Generate button during API call, re-enable on complete/error | Orchestrator | `app.js` |

**Advisories bundled into Part A (same files, zero extra cost):**
- **A7** — update hardcoded model + fix outdated API version string (in `client.js`, same pass as B3)
- **A9** — remove unused `@anthropic-ai/sdk` from `package.json` (same pass as B3)
- **A1** — add JS bounds validation to canvas resize in `toolbar.js` (2 lines)
- **A2** — add UI feedback when palette hits 8-color limit (1 line in `palette-panel.js`)
- **A3** — sanitize `result.ext` in `reference-panel.js` against allowed types (3 lines)
- **A6** — clear existing timeout before setting new one in `output-panel.js` (1 line)

### Phase 1 — Part B: enforce.js + Pipeline

| Activity | Who | Output |
|----------|-----|--------|
| 1.1 enforce.js UX — **decided**: auto-enforce after generation, with artist toggle to disable | Nova + Director | ✅ Approval Checkpoint #2 — **APPROVED** |
| 1.2 Implement `src/ai/enforce.js` | Orchestrator | Working `enforce.js` module |
| 1.3 Wire enforce into generation pipeline (post-`_applyGrid`) | Orchestrator | End-to-end: generate → enforce → canvas |
| 1.4 Team sync: Nova verifies UI, Viktor spot-check | Nova + Viktor | Green light to Phase 3 |

**`enforce.js` spec:**
- IIFE module pattern (no `require`, no imports — matches all other modules)
- `reduce(pixels, maxColors=6)` — nearest-neighbor Euclidean RGB color merging
- `detectOutline(pixels, w, h)` — **stub only at MVP**, implement at Phase 6 (O1)
- Must call `History.push()` after applying changes
- No `fs` operations, no DOM manipulation beyond `statusEl`
- Load order in `index.html`: after `generate.js`, before `exporter.js`

---

## Phase 2 — AI Generation Quality
**Days 2–4 | 20% budget | Mandatory**
*Runs in parallel with Phase 1*

| Activity | Who | Output |
|----------|-----|--------|
**Approach: Split authorship (Approach C) — approved by Director 2026-03-14**
Nova writes the artistic vision section. Orchestrator writes the output format section. Nova reviews the *combined* prompt before it ships to verify the seam between sections is seamless.

| 2.1 Nova writes artistic vision section of system prompt (silhouette, palette, composition) | Nova | Prompt section in `nova-memory.md` |
| 2.2 Orchestrator writes output format section (JSON schema, one-shot example, fence handling) | Orchestrator | Prompt section drafted |
| 2.3 Nova reviews combined prompt — verifies tone seam, approves | Nova | Combined prompt signed off |
| 2.4 Orchestrator implements: combined prompt + JSON validation + adaptive `maxTokens` | Orchestrator | Updated `generate.js` |
| 2.5 Nova + Director live test session: 3 generation runs, quality approval | Nova + Director | ✅ Approval Checkpoint #3 |

**`generate.js` enhancements:**
- Strip markdown fences before `JSON.parse()`
- Validate parsed structure (`w`, `h`, `palette`, `grid`) before calling `_applyGrid`
- One-shot example in system prompt to reduce malformed responses
- Conditional prompt path: text-only vs text+reference image
- Adaptive `maxTokens` based on sprite dimensions (hardcoded 2048 truncates large sprites)

---

## Phase 3 — Testing & Convention Hardening
**Days 3–5 | 20% budget | Mandatory**
*Requires Phase 1 substantially complete (enforce.js must exist)*

| Activity | Who | Output |
|----------|-----|--------|
| 3.1 Viktor convention audit (QA steps 1–4) — returns blocking items to Orchestrator | Viktor | Issues list |
| 3.2 Orchestrator fixes all blocking convention violations | Orchestrator | Fixed files |
| 3.3 Write unit tests for all pure-logic modules | Orchestrator (Viktor defines criteria) | Test files in `tests/` |
| 3.4 Viktor runs `npm test` + completes QA steps 5–7 + drafts Director report | Viktor | QA report |

**Test files to write:**

| File | Key edge cases |
|------|---------------|
| `tests/palette.test.js` | `addColor` dedup + max-8 cap, `removeColor` min-1 floor |
| `tests/history.test.js` | `push` max-50 eviction, undo/redo stacks, reset |
| `tests/exporter.test.js` | Single rect, two disjoint rects, transparent pixels, 1×1 sprite |
| `tests/enforce.test.js` | ≤6 colors (identity), >6 colors (reduction), all-transparent (no crash) |

> ⚠️ Risk: IIFE modules have no exports — Jest cannot import them directly. Viktor must confirm the test strategy in 3.1 before Orchestrator writes any test files.

**Viktor's convention audit focus (3.1):**
- `enforce.js`: no `fs`, no `require`, no parallel AppState
- `index.html`: script load order correct after adding `enforce.js`
- `app.js`: AppState is single source of truth
- `client.js`: API key never logged in error messages (especially after B3 restructure)
- **A10**: flag greedy rect algorithm duplication (`exporter.js` vs `png2sprite.js`) — document as known issue, defer refactor to post-MVP (png2sprite.js is shared with game projects)

**Activity 3.5 — Advisory cleanup (from Viktor Phase 2 QA report):**

| # | File | Item |
|---|------|------|
| V-A1 | `src/main.js` | Move `require('pngjs')` and `require('electron')/nativeImage` from inside `trace-reference` handler body to top-level imports |
| V-A2 | `src/ui/reference-panel.js` | Remove `console.log` debug line (line 16) before release |
| V-A3 | `src/main.js` | Add `nativeImage` to the top-level Electron destructure |

---

## Phase 4 — MVP QA Gate & First Push
**Day 5 | 10% budget | Mandatory — nothing is pushed without this gate**

| Activity | Who | Output |
|----------|-----|--------|
| 4.1 Viktor delivers structured QA report to Director | Viktor → Director | Report: scope, bugs, conventions, tests, verdict |
| 4.2 Director review + approval decision | Director | ✅ Approval Checkpoint #4 |
| 4.3 Orchestrator commits + pushes MVP | Orchestrator | Tag `v0.1.0-mvp` on remote |
| 4.4 Team retrospective + Director decision on post-MVP sprint | All | ✅ Approval Checkpoint #5 |

**Viktor report format:**
```
**Viktor → @Director:** QA Report — MVP Scope
Verdict: [PASS / PASS WITH NOTES / BLOCKED]
```

---

## Phase 5 — Docs & Memory Updates
**Day 6 | 5% budget | Mandatory**

| Activity | Who | Output |
|----------|-----|--------|
| 5.1 Write `docs/USAGE.md` | Orchestrator | User-facing usage guide |
| 5.2 Write `docs/ARCHITECTURE.md` | Orchestrator | Module map, IPC channels, state flow |
| 5.3 Nova updates `nova-memory.md` | Nova | Actual vs planned, open design questions |
| 5.4 Viktor updates `viktor-memory.md` | Viktor | Closed MVP issues log, QA run history |
| 5.5 Director quick review of USAGE.md | Director | Confirmed (non-blocking) |

---

## Phase 6 — Post-MVP Optional Sprint
**Days 6–8 | 7% budget | Contingent on Director decision at Phase 4.4**

Recommended set: **O1 + O2 + O3 + O5** (outline detection, dimension presets, auto-palette, distribution).
**O6 (Animation frames) explicitly deferred — warrants its own roadmap.**

Mini-process per feature:
1. Nova approves any UI changes
2. Orchestrator implements + self-reviews against CLAUDE.md
3. Viktor runs targeted QA
4. All features batched into a single push at Phase 7

---

## Phase 7 — v1.1 QA Gate & Release Push
**Day 8 | 3% budget | Contingent on Phase 6**

| Activity | Who | Output |
|----------|-----|--------|
| 7.1 Viktor full QA on Phase 6 additions | Viktor | QA report |
| 7.2 Viktor Director report | Viktor → Director | ✅ Approval Checkpoint #6 |
| 7.3 Director approves → Orchestrator pushes | Director + Orchestrator | Tag `v0.2.0` on remote |
| 7.4 All memory files updated | Nova + Viktor + Orchestrator | Team memory reflects shipped state |

---

## Director Approval Checkpoints

| # | Phase | Trigger | Blocks |
|---|-------|---------|--------|
| 1 | 0.1 | Kickoff — MVP scope confirmed | Phase 1 start |
| 2 | 1.1 | Nova's enforce.js UI spec | enforce.js implementation |
| 3 | 2.4 | Live AI generation quality test | Phase 3 start |
| 4 | 4.2 | Viktor's MVP QA report | First git push |
| 5 | 4.4 | Retrospective go/no-go | Phase 6 start |
| 6 | 7.3 | Viktor's v1.1 QA report | v1.1 push |

---

## Dependency Graph

```
Phase 0 (Kickoff)
  ├── Phase 1 (enforce.js MVP) ──────────────────────┐
  └── Phase 2 (AI quality)    ──────────────────────┤
                                                     ▼
                                        Phase 3 (Tests + Hardening)
                                                     │
                                                     ▼
                                        Phase 4 (MVP QA Gate + Push)
                                            │              │
                                            ▼              └─ Director "stop" → END
                                        Phase 5 (Docs)
                                            │
                                            ▼
                                        Phase 6 (Optional Sprint)
                                            │
                                            ▼
                                        Phase 7 (v1.1 QA + Push)
```

---

## Risk Register

| Risk | Probability | Mitigation |
|------|------------|------------|
| AI returns JSON wrapped in markdown fences | High | Phase 2.3: fence-stripping pre-pass before `JSON.parse` |
| `enforce.js` palette reduction degrades sprite quality | Medium | Nova reviews visual output in Phase 1.4; edge case tests in Phase 3.3 |
| Jest can't import IIFE modules | Medium | Phase 3.1: Viktor confirms test strategy before any test files are written |
| `_redraw()` private access in `generate.js` breaks on refactor | Medium | Phase 3.1: Viktor flags; Orchestrator adds public `redraw()` export |
| Animation scope creep delays v1.1 indefinitely | High if selected | O6 explicitly deferred to separate sprint |

---

## Critical Files

| File | Why it matters |
|------|---------------|
| `src/ai/enforce.js` | New file — most complex Phase 1 deliverable |
| `src/ai/generate.js` | Modified by Phases 1.3, 2.2, 2.3 |
| `src/index.html` | Script load order updated for enforce.js |
| `src/core/canvas.js` | `_redraw()` access pattern — Viktor audit in Phase 3.1 |
| `tests/*.test.js` | All new — empty directory at start |
| `.claude/design-team/nova-memory.md` | Enforce UI spec + AI prompt criteria |
| `.claude/qa-team/viktor-memory.md` | Pre-audit findings seed the entire QA pipeline |
