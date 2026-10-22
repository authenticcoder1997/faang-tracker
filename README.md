# My Space

A personal workspace for everyday tasks, study plans, notes, and links, backed by Firebase Firestore.

- **Home:** tasks grouped into lists, with voice dictation for titles and notes, daily, weekday, weekend, or one-time schedules; flags, completion history, and recoverable deleted tasks.
- **Homework:** a daily agenda for DSA, low-level design, system design, and concurrency.
- **Important links:** 21 supplied bookmarks, organized into folders with website screenshot cards, search, and bookmark import.
- **Study libraries:** searchable problems, shared filters, progress tracking, and problem notes.
- **Notes:** an open notebook editor with automatic Firebase saving.
- **Appearance:** Light and Dark Liquid Glass, with Silver, Ocean, Iris, Rose, and Amber palettes throughout every page and dialog.

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

Appearance is saved with the Firebase workspace and is shared across devices. The header separates the light/dark toggle from the horizontally scrollable palette rail. Header and page frames use the available width, with 24px desktop and 14px phone gutters.

Voice task entry uses the browser’s speech recognition. Click a microphone to start, stop to review the text, then save the task. Microphone access is requested only after starting dictation; browsers without speech support keep the typed form available.

## Saved data

Tasks, lists, notes, bookmarks, study progress, and appearance are stored in one shared Firestore document at `workspaces/main`. The owner chose a public workspace with no login: anyone who opens the website can read and change this same workspace. Firestore uses memory-only caching. The app does not write workspace data or appearance to browser storage.

Use the trash button beside a list to delete it. Tasks move to a list you choose, preserving schedules and completion history; deleting the last populated list creates an Inbox for its tasks. Empty lists can all be removed, and adding a task then creates an Inbox. The deletion notification offers Undo.

The first connection imports existing browser data and the original Firebase collections where access is permitted. Old browser keys are removed only after a confirmed server save, and only if their contents have not changed during import. Unreadable data is retained and reported. Each edit is applied as a field-level patch in a Firestore transaction, preserving unrelated changes from another device. Server revisions prevent older responses from replacing a newer snapshot.

Important links start with the supplied Important collection, including `leetcode lists`, `Jobs Sites`, and `Online Games` for NFS and Cricket 07. Additions and imports save in Firebase. Importing an exported browser bookmarks HTML file retains nested folders under Important; it does not change or continuously sync browser bookmarks. Preview images in `public/link-previews` are saved screenshots captured in Chrome, including the signed-in course page. New imported websites use a domain fallback when no saved screenshot exists.

Pending edits stay in memory until Firebase confirms them. The interface reports saving failures and protects reloads while edits are pending; reconnect or use Retry saving. There is no authentication or persistent browser cache.

## Firebase setup

Deploy `firestore.rules` to project `faang-tracker-db`. The rules permit direct reads and validated writes to `workspaces/main`, with no document listing or deletion. They also permit reads of the five original tracker documents for migration; legacy writes stay disabled. The public access model was explicitly selected by the owner. App code alone does not publish Firebase rules.

For isolated visual checks, run the development server and open `/tests/fixtures/workspace-preview.html`. This fixture uses generated data in memory and never connects to Firebase; it is not part of the production build.
