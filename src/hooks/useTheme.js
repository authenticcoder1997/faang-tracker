import { useCallback, useEffect } from 'react';
import { applyTheme, isValidTheme } from '../lib/theme';
import { useWorkspace } from './useWorkspace';

export function useTheme() {
  const { data, updateData } = useWorkspace();

  useEffect(() => {
    applyTheme(data.appearance);
  }, [data.appearance]);

  const setTheme = useCallback(
    (theme) => {
      if (!isValidTheme(theme)) return false;
      return updateData((current) => ({ ...current, appearance: theme }));
    },
    [updateData],
  );

  return { theme: data.appearance, setTheme, storageError: false };
}
