import { useCallback, useMemo } from 'react';
import { useWorkspace } from './useWorkspace';

const PROGRESS_KEYS = {
  dsa_progress: 'dsa',
  lld_progress: 'lld',
  hld_progress: 'hld',
  concurrency_progress: 'concurrency',
};

function combineItems(initialValue, progress = {}) {
  return initialValue.map((item) => ({ ...item, ...progress[item.id] }));
}

export function useCloudStorage(collectionName, _documentId, initialValue) {
  const { data, updateData, error } = useWorkspace();
  const key = PROGRESS_KEYS[collectionName];
  const items = useMemo(
    () => combineItems(initialValue, data.progress[key]),
    [data.progress, initialValue, key],
  );

  const setItems = useCallback(
    (value) =>
      updateData((current) => {
        const previous = combineItems(initialValue, current.progress[key]);
        const next = typeof value === 'function' ? value(previous) : value;
        const progress = Object.fromEntries(
          next.map((item) => [
            item.id,
            { completed: !!item.completed, note: item.note || '' },
          ]),
        );
        return {
          ...current,
          progress: {
            ...current.progress,
            [key]: { ...current.progress[key], ...progress },
          },
        };
      }),
    [initialValue, key, updateData],
  );

  return [items, setItems, false, error];
}
