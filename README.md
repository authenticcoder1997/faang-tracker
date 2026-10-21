# My Space

A personal workspace for everyday tasks, study plans, and notes.

- **Home:** tasks grouped into lists, with voice dictation for titles and notes, daily, weekday, weekend, or one-time schedules; flags, completion history, and recoverable deleted tasks.
- **Homework:** a daily agenda for DSA, low-level design, system design, and concurrency.
- **Study libraries:** searchable problems, shared filters, progress tracking, and problem notes.
- **Notes:** an open notebook editor with automatic browser saving and optional cloud sync.
- **Appearance:** consistent Light, Dark, and Liquid Glass themes throughout every page and dialog.

## Run locally

```sh
npm install
npm run dev
```

```sh
npm run build
npm run lint
node --test src/lib/*.test.js src/hooks/*.test.js
```

## Design system

`src/index.css` defines the shared theme tokens, page frame, typography, surfaces, and controls. `src/components/ui/Workspace.jsx` contains reusable page headers, statistics, and empty states. All four study libraries use `StudyTracker.jsx`.

Theme selection follows the system appearance until a preference is saved. It persists under `my-space-theme` and applies before the first render.

Voice task entry uses the browser’s speech recognition. Click a microphone to start, stop to review the text, then save the task. Microphone access is requested only after starting dictation; browsers without speech support keep the typed form available.

## Saved data

Tasks and lists remain in browser storage under `faang-tracker-tasks-v1`. Study progress keeps its existing per-track storage keys and Firebase integration. Notes use the existing `faang-tracker-notes` key, including migration of older note arrays; edits save locally before cloud requests. Cloud sync waits for a confirmed server read and merges pending local notes first.

Browser-local data belongs to the browser and site address where it was created. Local development and the published website have separate saved data. When cloud access is unavailable, the interface reports local saving.
