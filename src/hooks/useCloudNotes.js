import { useCallback } from 'react';
import { useWorkspace } from './useWorkspace';

export function useCloudNotes() {
  const { data, updateData, error } = useWorkspace();
  const setNotes = useCallback(
    (value) =>
      Promise.resolve(
        updateData((current) => ({
          ...current,
          notes: typeof value === 'function' ? value(current.notes) : value,
        })),
      ),
    [updateData],
  );

  return [data.notes, setNotes, false, error, null];
}
