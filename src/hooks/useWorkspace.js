import { useContext } from 'react';
import { WorkspaceContext } from './workspaceContext';

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('The Firebase workspace provider is missing.');
  return context;
}
