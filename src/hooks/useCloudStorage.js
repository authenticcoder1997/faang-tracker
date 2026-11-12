import { useCallback, useMemo } from 'react';
import { useWorkspace, useWorkspaceValue } from './useWorkspace';
import { mergeChangedStudyProgress } from '../lib/studyProgress';
import { dateKey } from '../lib/tasks';

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
        const today = key === 'concurrency' ? undefined : dateKey();
        const progress = mergeChangedStudyProgress(current.progress[key], previous, next, today);
        if (progress === current.progress[key]) return current;
        return {
          ...current,
          progress: {
            ...current.progress,
            [key]: progress,
          },
        };
      }),
    [initialValue, key, updateData],
  );

  return [items, setItems];
}
