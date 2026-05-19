# PlanWell

A dark, sleek roadmapping desktop app for breaking goals into tasks, managing dependencies, and staying on track.

Built with Electron, React, TypeScript, and SQLite — fully offline, no accounts, no cloud.

---

## Features

- **Projects** — create, color-code, set target dates, mark complete or archive
- **Tasks** — add estimates, dependencies, notes; drag to reorder; click to cycle status
- **Gantt timeline** — auto-scheduled from today using topological sort, drag to reschedule
- **Dashboard** — live health per project: progress %, overdue count, next unblocked task, momentum tracking
- **Keyboard shortcuts** — `⌘1` Dashboard · `⌘2` Projects · `⌘,` Settings · `⌘N` New · `Esc` Close · `⌘↵` Submit

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop | Electron 33 |
| UI | React 18 + TypeScript + Tailwind CSS 3 |
| Database | SQLite via better-sqlite3 (local, no server) |
| Timeline | frappe-gantt 0.6.1 |
| Bundler | electron-vite |
| Packaging | electron-builder |

## Getting Started

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build and package
npm run package
```

> **Note:** better-sqlite3 is a native module. If you switch Node/Electron versions, run:
> ```bash
> npx electron-rebuild -f -w better-sqlite3
> ```

## Project Structure

```
src/
  main/         Electron main process — IPC handlers, SQLite DB
  preload/      Context bridge — typed API exposed to renderer
  renderer/     React app
    pages/      Dashboard, Projects, ProjectDetail, Settings
    components/ Layout, modals, GanttChart, Logo
    hooks/      useShortcut
    utils/      schedule.ts — topological sort + auto-scheduling
resources/
  icon.svg      Source logo (Gantt bars mark)
  icon.icns     macOS app icon
  icon.png      Cross-platform app icon (1024×1024)
```

## Data

All data is stored locally in SQLite at:
- **macOS:** `~/Library/Application Support/planwell/planwell.db`
- **Windows:** `%APPDATA%\planwell\planwell.db`

No data leaves your machine.

## Rebuilding the App Icon

The icon is generated from `resources/icon.svg`:

```bash
npm run build:icon
```

Requires macOS (uses `iconutil` for `.icns` generation).

## License

MIT
