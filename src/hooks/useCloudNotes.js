import { useCallback } from 'react';
import { useWorkspace, useWorkspaceValue } from './useWorkspace';

export function useCloudNotes() {
  const { updateData } = useWorkspace();
  const notes = useWorkspaceValue((state) => state.data.notes);
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

  return [notes, setNotes];
}
