import { useContext, useSyncExternalStore } from 'react';
import { WorkspaceContext } from './workspaceContext';

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('The Firebase workspace provider is missing.');
  return context;
}

export function useWorkspaceValue(select) {
  const { store } = useWorkspace();
  return useSyncExternalStore(store.subscribe, () => select(store.getSnapshot()));
}

export function useWorkspaceSaving(section) {
  return useWorkspaceValue((state) => !!state.pending[section]);
}
