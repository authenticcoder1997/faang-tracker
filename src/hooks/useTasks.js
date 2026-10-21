import { useCallback } from 'react';
import { useWorkspace } from './useWorkspace';

export function useTasks() {
  const { data, updateData: updateWorkspace, saving, error } = useWorkspace();
  const updateData = useCallback(
    (change) =>
      updateWorkspace((current) => ({
        ...current,
        tasks: typeof change === 'function' ? change(current.tasks) : change,
      })),
    [updateWorkspace],
  );

  return { data: data.tasks, updateData, error, saving };
}
