# PlanWell — Claude Code Guide

## Commands

```bash
npm run dev          # Start dev server (Electron + Vite HMR)
npm run build        # Build renderer + main for production
npm run package      # Build + package into .dmg/.exe via electron-builder
npm run build:icon   # Regenerate app icons from resources/icon.svg (macOS only)
npx tsc --noEmit     # Type-check without emitting
```

After changing native dependencies or switching Node versions:
```bash
npx electron-rebuild -f -w better-sqlite3
```

## Architecture

Three-process Electron app:

- **Main** (`src/main/`) — Node.js process. Owns SQLite via better-sqlite3. All DB access goes through `db.ts`. Registers IPC handlers in `index.ts`.
- **Preload** (`src/preload/`) — Bridge. Exposes a typed `window.api` object via `contextBridge`. Type declarations live in `index.d.ts`.
- **Renderer** (`src/renderer/`) — React 18 SPA. Never touches Node APIs directly; always calls `window.api.*`.

## Key Files

| File | Purpose |
|---|---|
| `src/main/db.ts` | SQLite schema, migrations, all query functions |
| `src/main/index.ts` | IPC handler registration |
| `src/preload/index.ts` | `window.api` implementation |
| `src/preload/index.d.ts` | Global type declarations (Project, Task, Dependency) |
| `src/renderer/src/utils/schedule.ts` | Topological sort + auto-scheduling algorithm |
| `src/renderer/src/hooks/useShortcut.ts` | Keyboard shortcut hook |
| `src/renderer/src/components/Logo.tsx` | SVG logo component (Gantt bars mark) |
| `tailwind.config.js` | Design tokens — accent gold, dark surfaces, ink colors |

## Database

SQLite at `app.getPath('userData')/planwell.db`. Schema versioned via `PRAGMA user_version`.

Current version: **2**
- v1: projects, tasks, dependencies tables
- v2: `target_date` column on projects

To add a new migration, increment the version check in `db.ts`:
```ts
if (version < 3) {
  try { db.exec(`ALTER TABLE ...`) } catch {}
  db.pragma('user_version = 3')
}
```

## IPC Pattern

Every DB operation follows this path:
```
Renderer → window.api.X() → ipcRenderer.invoke('X') → ipcMain.handle('X') → db function → return value
```

Adding a new operation requires changes in 4 places: `db.ts`, `index.ts` (main), `index.ts` (preload), `index.d.ts`.

## Scheduling Algorithm

`scheduleTasks()` in `schedule.ts`:
1. Builds a dependency map
2. Topological sort (DFS)
3. For each task in order: start = max(dependency end dates) + 1 day, or today if no deps
4. End date is set to 23:59:59.999 so tasks aren't overdue until the day is fully over

## Design Tokens (Tailwind)

| Token | Value | Use |
|---|---|---|
| `accent` | `#f0a500` | Gold — primary actions, active states |
| `app-bg` | `#0d0d0f` | Page background |
| `app-surface` | `#141416` | Cards, sidebar |
| `app-elevated` | `#1c1c20` | Inputs, hover states |
| `ink-primary` | `#e8e8ea` | Main text |
| `ink-secondary` | `#a0a0a8` | Secondary text |
| `ink-tertiary` | `#606068` | Placeholders, labels |

## Known Quirks

- **frappe-gantt 0.6.1** is pinned — v1.x renders as a broken text list. Do not upgrade.
- **sass-embedded** is required because frappe-gantt imports SCSS source files.
- **better-sqlite3** must be rebuilt after any Electron version change (`electron-rebuild`).
- The Gantt SVG has internal bottom padding that can't be removed via CSS. `trimSvgToContent()` in `GanttChart.tsx` measures actual bar positions and sets the SVG height directly via `requestAnimationFrame`.
