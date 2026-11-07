export const PROGRESS_KEYS = {
  dsa: ['faang-tracker-dsa-v10', 'faang-tracker-dsa-v9'],
  lld: ['faang-tracker-lld-v8'],
  hld: ['faang-tracker-hld-v8'],
  concurrency: ['faang-tracker-concurrency-v1'],
};
export const LEGACY_STORAGE_KEYS = Object.freeze([
  'faang-tracker-tasks-v1',
  'my-space-important-bookmarks-v1',
  'faang-tracker-notes',
  'my-space-theme',
  ...Object.values(PROGRESS_KEYS).flat(),
]);
