# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JobCost Pro is an Electron + React + TypeScript desktop app for a printing/packaging business. It replaces a paper register system for tracking job costs across multiple machine types. Currency is INR.

## Commands

```bash
npm run dev              # Start dev mode with hot reload
npm run build            # Production build
npm run start            # Preview production build
npm run build:win        # Build Windows installer
npm run typecheck        # Full typecheck (main + renderer)
npm run typecheck:node   # Typecheck main/preload only
npm run typecheck:web    # Typecheck renderer only
```

No test framework or linter is configured.

## Architecture

### Process Model

- **Main process** (`src/main/`): Database access (Drizzle ORM + better-sqlite3), IPC handlers, PDF generation (jsPDF)
- **Preload** (`src/preload/index.ts`): Exposes typed `window.api` object via `contextBridge`
- **Renderer** (`src/renderer/src/`): React 19, Zustand stores, shadcn/ui components

### IPC Pattern

All DB access goes through IPC. The renderer **never** imports from `src/main/`.

```
Renderer: window.api.jobs.list()
  → Preload: ipcRenderer.invoke('jobs:list')
    → Main: ipcMain.handle('jobs:list', ...) → jobHandler.list()
```

- Handlers registered in `src/main/handlers/index.ts` via `registerHandlers()`
- Each handler file exports a plain object with async methods that call `getDb()` then run Drizzle queries
- Type declarations for `window.api` live in `src/renderer/src/types/api.d.ts`
- Adding a new IPC channel requires changes in 3 places: handler, preload, and api.d.ts

### Navigation (No Router)

Uses a Zustand store (`src/renderer/src/stores/navigation.ts`) instead of react-router:
- `navigate(page, params?)` sets `currentPage` and `pageParams`
- `AppLayout.tsx` maps page names to components and renders the active one
- Page params pass data like `jobId` (edit mode) or `machineTypeId` (new job)

### State Management

Zustand stores in `src/renderer/src/stores/` follow a consistent pattern:
- Each store has `data[]`, `loading`, `error`, and async CRUD methods
- Async methods call `window.api.*` then update local state

### Database

- SQLite via better-sqlite3, WAL mode, foreign keys enabled
- Schema defined in `src/main/db/schema.ts` using Drizzle ORM
- Migrations in `./drizzle/` directory, managed by `drizzle-kit`
- DB file at `app.getPath('userData')/jobcostpro.db`
- `meta` table with key `'seeded'` prevents duplicate seeding

### Machine Custom Fields

Machine types have a `customFieldsSchema` column (JSON string of `MachineFieldSchema[]`). Each schema entry defines `{ name, label, type, required, options? }`. Jobs store filled values in `machineCustomData` as JSON. `DynamicField.tsx` renders these dynamically.

### Job Number Format

`JOB-{YYYYMMDD}-{NNN}` — generated atomically in a DB transaction (3-digit padded daily counter).

### Cost Formula

```
grandTotal = (quantity * rate) + cooly + machineCost
```

### New Job Flow

1. Ctrl+N or "New Job" button dispatches `CustomEvent('app:new-job')`
2. `MachineSelectionModal` opens (supports keyboard shortcuts 1-9)
3. User selects machine → `navigate('job-form', { machineTypeId })`
4. `JobFormPage` reads `pageParams.machineTypeId`

## Conventions

- **Path alias**: `@/*` → `src/renderer/src/*` (renderer code only)
- **Tailwind v4**: Config in CSS (`main.css`) using `@theme inline {}`, not a JS config file
- **shadcn/ui**: New-york style. `components.json` is at project root but CLI outputs to `@/` literal path — must manually move files to `src/renderer/src/`
- **Named exports** for all components (no default exports)
- **Icons**: Lucide React exclusively
- **Toasts**: `sonner` library
- **`cn()` utility**: `src/renderer/src/lib/utils.ts` — `twMerge(clsx(...))`
- **Currency**: `formatINR()` in `src/renderer/src/lib/format.ts`
- **Form keyboard**: Enter advances fields, Ctrl+S saves, Escape goes back
