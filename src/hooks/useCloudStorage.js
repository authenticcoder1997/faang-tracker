import { useCallback, useMemo } from 'react';
import { useWorkspace, useWorkspaceValue } from './useWorkspace';

function combineItems(initialValue, progress = {}) {
  return initialValue.map((item) => ({ ...item, ...progress[item.id] }));
}

export function useCloudStorage(key, initialValue) {
  const { updateData } = useWorkspace();
  const progress = useWorkspaceValue((state) => state.data.progress[key]);
  const items = useMemo(() => combineItems(initialValue, progress), [initialValue, progress]);

  const setItems = useCallback(
    (value) =>
      updateData((current) => {
        const previous = combineItems(initialValue, current.progress[key]);
        const next = typeof value === 'function' ? value(previous) : value;
        const fields = Object.fromEntries(next.map((item) => [
          item.id, { completed: !!item.completed, note: item.note || '' },
        ]));
        return {
          ...current,
          progress: {
            ...current.progress,
            [key]: { ...current.progress[key], ...fields },
          },
        };
      }),
    [initialValue, key, updateData],
  );

  return [items, setItems];
}
