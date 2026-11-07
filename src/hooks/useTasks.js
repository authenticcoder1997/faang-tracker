import { useCallback } from 'react';
import { useWorkspace, useWorkspaceSaving, useWorkspaceValue } from './useWorkspace';

export function useTasks() {
  const { updateData: updateWorkspace } = useWorkspace();
  const data = useWorkspaceValue((state) => state.data.tasks);
  const saving = useWorkspaceSaving('tasks');
  const error = useWorkspaceValue((state) => state.error);
  const updateData = useCallback(
    (change) =>
      updateWorkspace((current) => ({
        ...current,
        tasks: typeof change === 'function' ? change(current.tasks) : change,
      })),
    [updateWorkspace],
  );

  return { data, updateData, error, saving };
}
