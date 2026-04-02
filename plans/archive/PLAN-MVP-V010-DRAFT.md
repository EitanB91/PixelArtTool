# PixelArtTool — Full Project Roadmap

**Created:** 2026-03-13
**Author:** Orchestrator
**Requested by:** Director (Eitan)

---

## Context

The PixelArtTool scaffold was completed on 2026-03-13. The codebase is ~85% implemented — most modules have working code. This plan maps the path from current state to a shipped, tested, push-ready v0.1.0 (MVP), with an optional post-MVP sprint to v0.2.0.

The plan was designed to account for all team touchpoints: Director approvals, Nova design sessions, Viktor QA gates, and inter-team collaboration — not just coding tasks.

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

## Phase 0 — Kickoff & Audit
**Day 1 morning | 5% budget | Mandatory**

| Activity | Who | Output |
|----------|-----|--------|
| 0.1 Director Briefing — confirm MVP scope, approve feature list | Director + All | ✅ Approval Checkpoint #1 |
| 0.2 Orchestrator full codebase audit — trace every module, catalog state | Orchestrator | Internal audit findings |
| 0.3 Viktor pre-audit read-only pass — log findings to `viktor-memory.md` before any new code | Viktor | Pre-audit issues in `viktor-memory.md` |
| 0.4 Nova design review — where does enforce UI live? auto vs manual? | Nova + Director | Design decisions in `nova-memory.md` |

**Viktor's pre-audit focus:**
- No tests exist (log as finding)
- `generate.js` calls `PixelCanvas._redraw()` directly — fragile private access (advisory)
- `History.push` called once after batch grid write — correct but must be documented
- CSP in `index.html` blocks external scripts — confirm `enforce.js` needs no new fetches

---

## Phase 1 — MVP Completion
**Days 1–3 | 30% budget | Mandatory**
*Runs in parallel with Phase 2 from Day 2*

| Activity | Who | Output |
|----------|-----|--------|
| 1.1 Nova design session: enforce.js UX spec (auto vs button, where status appears) | Nova + Orchestrator | Spec in `nova-memory.md` → ✅ Approval Checkpoint #2 |
| 1.2 Implement `src/ai/enforce.js` | Orchestrator | Working `enforce.js` module |
| 1.3 Wire enforce into generation pipeline (post-`_applyGrid`) | Orchestrator | End-to-end: generate → enforce → canvas |
| 1.4 Team sync: Nova verifies UI, Viktor spot-check | Nova + Viktor | Green light to Phase 3 |

**`enforce.js` spec:**
- IIFE module pattern (matches all other modules — no `require`, no imports)
- `reduce(pixels, maxColors=6)` — nearest-neighbor Euclidean RGB color merging
- `detectOutline(pixels, w, h)` — **stub only at MVP**, implement at Phase 6 (O1)
- Must call `History.push()` after applying changes
- No `fs` operations, no DOM manipulation beyond `statusEl`
- Add `<script src="ai/enforce.js">` to `index.html` between `client.js` and `generate.js`

---

## Phase 2 — AI Generation Quality
**Days 2–4 | 20% budget | Mandatory**
*Runs in parallel with Phase 1*

| Activity | Who | Output |
|----------|-----|--------|
| 2.1 Nova brainstorm: quality criteria + enhanced system prompt text | Nova + Orchestrator | Prompt draft in `nova-memory.md` |
| 2.2 Implement enhanced system prompt in `generate.js` | Orchestrator | Updated `generate.js` |
| 2.3 Error resilience: JSON fence-stripping, schema validation, adaptive `maxTokens` | Orchestrator | Robust `generate.js` |
| 2.4 Nova + Director live test session: 3 generation runs, quality approval | Nova + Director | ✅ Approval Checkpoint #3 |

**`generate.js` enhancements:**
- Strip markdown fences before `JSON.parse()`
- Validate parsed structure (`w`, `h`, `palette`, `grid` present + correct types) before calling `_applyGrid`
- One-shot example in system prompt to reduce malformed responses
- Conditional prompt path: text-only vs text+reference (extract silhouette/color mood from image)
- Adaptive `maxTokens` based on sprite dimensions (current hardcoded 2048 truncates large sprites)

---

## Phase 3 — Testing & Convention Hardening
**Days 3–5 | 20% budget | Mandatory**
*Requires Phase 1 substantially complete (enforce.js must exist)*

| Activity | Who | Output |
|----------|-----|--------|
| 3.1 Viktor convention audit (steps 1–4 of QA pipeline) — returns blocking items | Viktor | Issues list → blocking items to Orchestrator |
| 3.2 Orchestrator fixes all blocking convention violations | Orchestrator | Fixed files |
| 3.3 Write unit tests for all pure-logic modules | Orchestrator (Viktor defines criteria) | Test files in `tests/` |
| 3.4 Viktor runs `npm test` + completes QA steps 5–7 + drafts Director report | Viktor | QA report (PASS / PASS WITH NOTES / BLOCKED) |

**Test files to write:**

| File | Key edge cases |
|------|---------------|
| `tests/palette.test.js` | `addColor` dedup + max-8 cap, `removeColor` min-1 floor |
| `tests/history.test.js` | `push` max-50 eviction, undo/redo stacks, reset |
| `tests/exporter.test.js` | Single rect, two disjoint rects, transparent pixels, 1×1 sprite |
| `tests/enforce.test.js` | ≤6 colors (identity), >6 colors (reduction), all-transparent (no crash) |

> ⚠️ Risk: IIFE modules have no exports — Jest cannot import them directly. Tests must extract and test the pure algorithm logic as standalone functions, or use a test-helper file that reimplements the pure functions. Viktor must confirm the test strategy in 3.1 before Orchestrator writes test files.

**Viktor's convention audit focus (3.1):**
- `enforce.js`: no `fs`, no `require`, no parallel state
- `generate.js`: `_redraw()` private access → recommend adding public `redraw()` export (advisory)
- `index.html`: script load order after adding `enforce.js`
- `app.js`: AppState is single source of truth — verify enforce/generate don't shadow it
- `client.js`: API key never logged in error messages

---

## Phase 4 — MVP QA Gate & First Push
**Day 5 | 10% budget | Mandatory — nothing is pushed without this gate**

| Activity | Who | Output |
|----------|-----|--------|
| 4.1 Viktor delivers structured QA report to Director | Viktor → Director | Report: scope, bugs, conventions, tests, verdict |
| 4.2 Director review + approval decision | Director | ✅ Approval Checkpoint #4 — approve / fix-then-push / reject |
| 4.3 Orchestrator commits + pushes MVP | Orchestrator | `feat: MVP complete — enforce.js, tests, AI quality` tag `v0.1.0-mvp` |
| 4.4 Team retrospective + Director decision on post-MVP sprint | All | ✅ Approval Checkpoint #5 — go/no-go for Phase 6 |

**Viktor report format:**
```
**Viktor → @Director:** QA Report — MVP Scope (src/ai/enforce.js, tests/, src/ai/generate.js)
Verdict: [PASS / PASS WITH NOTES / BLOCKED]
...
```

---

## Phase 5 — Docs & Memory Updates
**Day 6 | 5% budget | Mandatory**

| Activity | Who | Output |
|----------|-----|--------|
| 5.1 Write `docs/USAGE.md` — prerequisites, install, tool guide, AI workflow, export | Orchestrator | `docs/USAGE.md` |
| 5.2 Write `docs/ARCHITECTURE.md` — module map, IPC channels, state flow, pixel coordinate system | Orchestrator | `docs/ARCHITECTURE.md` |
| 5.3 Nova updates `nova-memory.md` — actual vs planned, open design questions | Nova | Updated `nova-memory.md` |
| 5.4 Viktor updates `viktor-memory.md` — close MVP issues log, update QA run history | Viktor | Updated `viktor-memory.md` |
| 5.5 Director quick review of USAGE.md | Director | Confirmed (non-blocking) |

---

## Phase 6 — Post-MVP Optional Sprint
**Days 6–8 | 7% budget | Contingent on Director decision at Phase 4.4**

Director selects from the optional feature list. Recommended starting set: **O1 + O2 + O3 + O5** (outline detection, dimension presets, auto-palette, packaged distribution).

**O6 (Animation frames) is explicitly deferred to a separate sprint** — it requires significant changes to canvas, history, exporter, and app.js, and warrants its own roadmap.

Each feature follows this mini-process:
1. Nova approves any UI changes before implementation
2. Orchestrator implements, self-reviews against CLAUDE.md conventions
3. Viktor runs targeted QA (abbreviated — focus on new pure-logic test coverage + convention compliance)
4. All features batched into a single push at Phase 7

---

## Phase 7 — v1.1 QA Gate & Release Push
**Day 8 | 3% budget | Contingent on Phase 6**

| Activity | Who | Output |
|----------|-----|--------|
| 7.1 Viktor full QA on Phase 6 additions | Viktor | QA report |
| 7.2 Viktor Director report | Viktor → Director | ✅ Approval Checkpoint #6 |
| 7.3 Director approves → Orchestrator pushes `v0.2.0` | Director + Orchestrator | Tag `v0.2.0` on remote |
| 7.4 Update all team memory files | Nova + Viktor + Orchestrator | Memory files reflect shipped v1.1 state |

---

## Director Approval Checkpoints

| # | Phase | Trigger | Blocks |
|---|-------|---------|--------|
| 1 | 0.1 | Kickoff alignment — MVP scope confirmed | Phase 1 start |
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
| Jest can't import IIFE modules | Medium | Phase 3.1: Viktor confirms test strategy before Orchestrator writes any test files |
| `_redraw()` private method access in `generate.js` breaks on refactor | Medium | Phase 3.1: Viktor flags; Orchestrator adds public `redraw()` export to IIFE |
| Phase 6 animation scope creep delays v1.1 indefinitely | High if selected | O6 explicitly deferred to separate sprint in this plan |

---

## Critical Files

| File | Why it matters |
|------|---------------|
| `src/ai/enforce.js` | New file — most complex Phase 1 deliverable |
| `src/ai/generate.js` | Modified by Phase 1.3, Phase 2.2, Phase 2.3 |
| `src/index.html` | Script load order updated for enforce.js |
| `src/core/canvas.js` | `_redraw()` access pattern — Viktor audit in Phase 3.1 |
| `tests/*.test.js` | All new — empty directory at start |
| `.claude/design-team/nova-memory.md` | Enforce UI spec (Phase 1.1) + prompt criteria (Phase 2.1) |
| `.claude/qa-team/viktor-memory.md` | Pre-audit findings (Phase 0.3) seed entire QA pipeline |
