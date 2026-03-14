# CLAUDE.md — Pixel Art Tool

AI-assisted standalone desktop application for generating pixel art sprites and exporting them as `pxAt()` code for game engines.

## Project Roadmap

Full phase-by-phase build plan, feature registry, schedule, and approval checkpoints: **[ROADMAP.md](ROADMAP.md)**

## Project Vision

**Pipeline:** description / reference image → AI generation (Claude Vision) → style enforcement → PNG export → `png2sprite.js` → paste-ready game code

This tool is the dedicated bridge between artistic intent and the `fillRect` sprite engine used in the director's games (e.g., Ages of War).

## Running

```bash
npm install
npm start        # launch Electron app
npm run convert  # run png2sprite.js CLI directly
```

## Architecture

```
src/
├── main.js          — Electron main process (window, IPC, file system)
├── index.html       — renderer entry point
├── app.js           — renderer: UI orchestration, state machine
├── core/
│   ├── canvas.js    — pixel art canvas: draw, undo, palette, zoom
│   ├── palette.js   — color palette management
│   └── history.js   — undo/redo stack
├── ai/
│   ├── client.js    — Anthropic SDK wrapper
│   ├── generate.js  — sprite generation from text + reference
│   └── enforce.js   — style enforcement (palette reduction, outline detection)
├── ui/
│   ├── toolbar.js   — tool selector (pencil, fill, eraser, eyedropper)
│   ├── palette-panel.js
│   ├── reference-panel.js  — shows reference image side by side
│   └── output-panel.js     — preview pxAt() code output
├── export/
│   └── exporter.js  — wraps png2sprite.js, copies output to clipboard
└── styles/
    └── main.css
tools/
└── png2sprite.js    — PNG → pxAt() code converter (shared with game projects)
tests/
```

## Key Conventions

- **Electron IPC**: all file system operations happen in `main.js` via `ipcMain`/`ipcRenderer`. The renderer never uses `fs` directly.
- **State**: app state lives in a plain `appState` object in `app.js` — no framework.
- **Canvas pixel scale**: the drawing canvas uses a configurable `ZOOM` factor (default 8× for comfortable drawing). Export always at 1× game pixels.
- **API key**: stored in `.env` (never committed). Loaded in `main.js` and passed to renderer via IPC.
- **png2sprite.js is the bridge**: this file is shared/copied across game projects. Keep it self-contained (no imports beyond `pngjs` and `fs`).

## Team & Naming Conventions

| Person | Informal | Formal / Docs / Cross-team |
|--------|----------|----------------------------|
| Project Director (Eitan) | Eitan | Director |
| Main Agent (Claude) | Claude | The Orchestrator |
| Design Lead | Nova | Nova |
| QA Team Lead | Viktor | Viktor |

- **Eitan** directs the project. In documentation, formal meetings, and cross-team correspondence he is referred to as **Director**.
- **Claude** is the main agent and Eitan's right hand. When spoken *about* — by other agents, sub-agents, or in documentation — use **The Orchestrator**.
- **Nova** is always Nova, no alternate name.
- **Viktor** is always Viktor, no alternate name. Old, grumpy, honest. QA gate owner.

## Team Communication Protocol

All spoken messages between team members use this format:

```
**[Speaker] → @[Recipient]:**
[message]
```

| Role | Speaker tag | Address as |
|------|-------------|------------|
| Project Director | `**Director:**` | `@Director` |
| Main Agent | `**Orchestrator:**` | `@Orchestrator` |
| Design Lead | `**Nova:**` | `@Nova` |
| QA Team Lead | `**Viktor:**` | `@Viktor` |

**Channels:**
- Eitan → Claude: normal conversation (always open)
- Eitan → Nova: invoke `/nova`, then address `@Nova` directly
- Claude → Nova: The Orchestrator addresses `@Nova` in conversation, or spawns Nova as a sub-agent for async tasks
- Nova → Eitan: Nova addresses `@Director`
- Nova → Claude: Nova addresses `@Orchestrator`
- Broadcast (no specific recipient): omit `→ @[Recipient]`

**Activating Nova:** type `/nova` to load her identity and memory into context. She will announce herself and respond.

**Activating Viktor:** type `/viktor` (optionally with a scope) to start a QA review. Viktor runs his full pipeline and reports to the Director.

**Async tasks (Orchestrator → Nova/Viktor):** The Orchestrator can spawn either as a background sub-agent, passing their identity + memory + task. They return output; The Orchestrator delivers it to the Director.

## QA Pipeline (Viktor)

Triggered: after every significant code change, and mandatory before every `git push`.

| Step | Action | Blocking? |
|------|--------|-----------|
| 1 | Code structure & organization analysis | No |
| 2 | Bug & edge case check | Yes (bugs block) |
| 3 | Readability & maintainability review | No (advise only) |
| 4 | Convention compliance (CLAUDE.md rules) | Yes |
| 5 | Tests / unit tests | Yes (failures block) |
| 6 | Return issues to responsible team lead; wait for fix | Yes (bugs/conventions) |
| 7 | Send Director a summary report | — |
| 8 | Await Director approval → then push | Yes |

Verdicts: `PASS` · `PASS WITH NOTES` · `BLOCKED`

**No code is pushed to git without Viktor's verdict and the Director's explicit approval.**

## Nova (Design Lead)

Nova manages all visual decisions for this tool. Her files:
- Identity: `.claude/design-team/nova-identity.md`
- Memory: `.claude/design-team/nova-memory.md`

When starting a design session, invoke `/nova` to load Nova into context.

## Memory Update Protocol

Memory files must be updated in two situations — no exceptions:

| Trigger | Who updates | Files |
|---------|-------------|-------|
| **Session approaching compaction** (context getting long) | All active team members | Their own memory file |
| **Phase transition** (one phase marked complete, next begins) | All active team members | Their own memory file |

**What to update:**
- Current build status (what is done, what is not)
- Any decisions made during the session
- Open items and their current state
- QA run history (Viktor)
- Pending work list (Nova)

**Rule:** If a team member is activated and their memory file is stale (does not reflect current project state), they must note the discrepancy and update before proceeding with any task.

---

## Git

```bash
git add <specific files>
git commit -m "feat: description"
git push
```

Commit prefixes: `feat:` `fix:` `refactor:` `chore:`
