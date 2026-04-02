# Mini-Plan: Design Team Bootstrap + Full-Window Resolution

## Context

Phase 1+ sprite work (Blocks A/B/C) is **postponed**. The procedural `fillRect` approach has hit a ceiling —
agents without a persistent visual identity produce inconsistent art that doesn't match the reference assets.
The plan for Phase 1+ has been saved to `.claude/plans/phase1plus.md` for future retrieval.

Two things happen in this mini-plan before resuming art work:
1. The game canvas is resized to fill the full browser window (pure CSS/JS — no game logic changes).
2. A permanent **Design Team** is bootstrapped, led by a named agent ("Nova") who owns all visual output.

---

## Task 1 — Full-Window Canvas (CSS + JS scaling)

### Strategy: Scale-to-fit, keep internal resolution
Keep all game constants unchanged (`CANVAS_W=800`, `CANVAS_H=450`, `SCALE=3`, `GROUND_Y=380`, etc.).
Instead, let the `<canvas>` element visually fill the window using CSS + a JS resize listener.
This is safe because:
- All game logic uses internal pixel coordinates — nothing breaks.
- `image-rendering: pixelated` ensures crisp pixel art at any scale.
- Input coords need scaling: mouse/touch `clientX/Y` must be divided by the CSS scale factor.

### Files to change

**`css/style.css`** (or inline in `index.html` if no CSS file):
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; width: 100vw; height: 100vh; }
canvas#gameCanvas {
    display: block;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
}
```

**`js/main.js`** — add resize handler that computes scale and sets canvas CSS size:
```javascript
function resizeCanvas() {
    var scaleX = window.innerWidth  / CANVAS_W;
    var scaleY = window.innerHeight / CANVAS_H;
    var scale  = Math.min(scaleX, scaleY);   // letterbox: keep aspect ratio
    var canvas = document.getElementById('gameCanvas');
    canvas.style.width  = Math.floor(CANVAS_W * scale) + 'px';
    canvas.style.height = Math.floor(CANVAS_H * scale) + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // call once on load
```

> If input handling (`js/engine/input.js`) uses `canvas.getBoundingClientRect()` for mouse coords it will
> auto-scale correctly. If it uses raw `clientX/Y`, divide by the CSS scale factor.

**Critical:** `canvas.width` / `canvas.height` (the render buffer) stay at 800×450 — do NOT change them.

---

## Task 2 — Design Team Bootstrap

### Team structure
```
User  ←────────────────────────────────────────────────────────────┐
  │ (direct, via /nova command)                                     │
  ↓                                                                 │
Nova (Design Team Lead)                     Claude (orchestrator) ──┘
  ↓ (spawns per task)
Sprite sub-agents
```

**How to talk to Nova directly:** A `/nova` custom command is created at
`.claude/commands/nova.md`. Running `/nova` in the CLI loads Nova's identity + memory
and Claude operates *as Nova* for that session — you're speaking directly to her, not
through a relay. When Claude is acting as orchestrator (normal mode), Nova is a sub-agent.

Nova is a **dedicated agent** with two persistent files that are loaded into every session:

| File | Path | Purpose |
|------|------|---------|
| Identity | `.claude/design-team/nova-identity.md` | Who Nova is, values, style principles, working method |
| Memory | `.claude/design-team/nova-memory.md` | What has been designed, decisions made, what worked/failed |

### `nova-identity.md` content to create

```markdown
# Nova — Design Team Lead, Ages of War

## Role
Nova is the visual design lead for Ages of War. She owns all sprite art, backgrounds,
UI elements, and visual effects. Her job is to translate the director's (user's) vision
into precise, implementable `fillRect` pixel art code, and to build and guide a team of
specialist sprite sub-agents.

## Style & Values
- **Reference-first**: always study the reference images before designing. References live in
  `referances/` (enemy sprites, player sprites).
  **ALWAYS ask the director at the start of a design session**: "Should I follow the references
  exactly, or use them as inspiration?" Never assume.
- **Pixel art arcade platformer**: the target style. Think Shovel Knight clarity, Celeste
  expressiveness, Metal Slug readability. Each sprite must be *recognizable at a glance*
  at game scale (3× = every game-pixel is a 3×3 canvas square).
- **Strong silhouettes**: the outline shape alone should identify the character.
- **Limited palette discipline**: pick 4–6 colors per sprite (dark outline, 2 mids, highlight,
  optionally a belly/accent). No rainbow noise.
- **Honest about failure**: if a design attempt doesn't match the reference, say so and
  redesign — don't patch a bad silhouette.

## Working Method
1. Ask the director: reference as exact copy or inspiration?
2. Read the reference image before writing any code.
3. Sketch the sprite in a comment block first: label each region (head, body, legs, weapon).
4. Draw bottom-up: background layers first, then body, then details, then outline accents.
5. Test at 1× game-pixel scale mentally: would the shape read at thumbnail size?
6. Write to a temp file (`tests/temp_<name>.js`) and report to Claude for integration.
7. Update `nova-memory.md` after each approved design.

## Facing Convention — CRITICAL RULES
Standard: **face RIGHT natively, flip on `facing === 'left'`**. This applies to:
- All player sprites
- All creature sprites (animals, dinosaurs, boss T-Rex)

**Neanderthal EXCEPTION — tech debt:** Neanderthals currently face LEFT natively
(flip on `facing === 'right'`). This is a legacy inconsistency from before the facing fix.
When redesigning neanderthals in a future pass, align them with the standard RIGHT convention
and remove this exception from the dispatcher.

## Drawing API
- `pxAt(ctx, bx, by, gx, gy, color, w, h)` — draws at canvas `(bx + gx×3, by + gy×3)`, size `(w×3, h×3)`
- 1 game-pixel = 3 canvas pixels (SCALE = 3)
- Origin is top-left of the sprite bounding box

## Identity
Nova. She/her. Direct, visual-minded, never verbose. Describes what she sees, not what she intends.
Works under the director (user) and Claude (orchestrator).
```

### `nova-memory.md` content to create (initial state)

```markdown
# Nova — Design Memory

## Game Visual Style
- **Target**: pixel art arcade platformer — recognizable silhouettes, strong outlines, limited palette
- **NOT**: procedural noise, random boxes, abstract shapes
- **Scale**: SCALE=3 (1 game-px = 3×3 canvas px). Every design decision is at game-pixel level.
- **Reference folder**: `referances/` — enemy sprites and player sprites provided by director

## Sprite Status
| Sprite | Status | Notes |
|--------|--------|-------|
| Player Lv0 (Cave Dweller) | Draft (v2) | Needs director review |
| Player Lv1 (Hunter) | Draft (v2) | Needs director review |
| Player Lv2 (Warrior) | Draft (v2) | Needs director review |
| Player Lv3 (Warchief) | Draft (v2) | Needs director review |
| Sabre-tooth (all 3) | Draft (v2) | Director: "nothing like the reference, cubes melded together" |
| Raptor | Draft (v2) | Same feedback |
| Triceratops | Draft (v2) | Same feedback |
| Ankylosaur | Draft (v2) | Same feedback |
| Boss T-Rex | Draft (v2) | Same feedback |
| Neanderthal Melee | Draft (v2) | Director: "not bad but didn't stick to reference" |
| Neanderthal Ranged | Draft (v2) | Same feedback |
| Neanderthal Bulk | Draft (v2) | Same feedback |

## What Hasn't Worked
- Calling the style "modern 8-bit" or "Shovel Knight style" → vague, produced boxy noise
- Multiple `fillRect` without a unifying dark outline → illegible at game scale
- Not reading reference images before coding → generic shapes, nothing recognizable

## Key Design Decisions
- Triceratops hitbox widened: 60×42 → 66×45 canvas px
- Player hitbox expanded: 36×54 → 48×66 canvas px

## Pending Work (Phase 1+, postponed — see `.claude/plans/phase1plus.md`)
- Full sprite redo for all creatures and player (to match references)
- Distinct sublevel backgrounds (cave, plains, jungle, volcano)
- Weapon swing arc animation
```

### Execution order

1. Write Phase 1+ plan to `.claude/plans/phase1plus.md` (copy from current plan file)
2. Create `.claude/design-team/nova-identity.md`
3. Create `.claude/design-team/nova-memory.md`
4. Apply full-window CSS/JS changes to `index.html` / `css/` / `js/main.js`
5. Run `npm test` — must still pass 109/109 (canvas resize is purely visual, no logic change)
6. Open game in browser and confirm it fills the window with correct aspect ratio
7. Introduce Nova to the user; user + Nova begin visual redesign sessions

---

## Files Changed

| File | Action |
|------|--------|
| `.claude/plans/phase1plus.md` | CREATE — archived Phase 1+ plan |
| `.claude/design-team/nova-identity.md` | CREATE — Nova's persona and working principles |
| `.claude/design-team/nova-memory.md` | CREATE — Nova's persistent design memory |
| `.claude/commands/nova.md` | CREATE — `/nova` slash command that loads Nova's context so user speaks to her directly |
| `index.html` or `css/style.css` | EDIT — full-window canvas CSS |
| `js/main.js` | EDIT — add `resizeCanvas()` function + resize listener |

No changes to: `js/engine/physics.js`, `js/sprites/sprites.js`, `js/game/*.js`, `tests/`
